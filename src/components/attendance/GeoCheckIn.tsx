"use client";

import { useState, useEffect, useRef } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useGeoFence } from "@/hooks/useGeoFence";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";

export const GeoCheckIn = () => {
  const { user } = useAuth();
  const { location, error: locError, isWatching, startWatch, stopWatch } = useLocation();
  const { isInside, distance, settings } = useGeoFence(location);
  
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [autoTriggered, setAutoTriggered] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    // Start watching location on mount
    startWatch();
    return () => {
      stopWatch();
      stopCamera();
    };
  }, [startWatch, stopWatch]);

  useEffect(() => {
    if (isInside && !isCheckedIn && !autoTriggered) {
      setAutoTriggered(true);
      setMessage("You entered the office geofence! Please take a selfie to auto check-in.");
      startCamera();
    }
  }, [isInside, isCheckedIn, autoTriggered]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setMessage("Camera access is required for check-in verification.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setStreamActive(false);
    }
  };

  const capturePhoto = (): string | null => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        return canvasRef.current.toDataURL("image/jpeg", 0.8);
      }
    }
    return null;
  };

  const handleCheckIn = async (method: "auto" | "manual" = "manual") => {
    if (!location || !user) return;
    
    if (!streamActive) {
      startCamera();
      return;
    }

    const photoDataUrl = capturePhoto();
    if (!photoDataUrl) {
      setMessage("Failed to capture photo. Please try again.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload photo to Firebase Storage
      const photoUrl = await firebaseHelpers.uploadPhoto(user.uid, photoDataUrl);

      // 2. Call server API to create attendance record
      const res = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          location: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          photoUrl,
          method,
          distanceMeters: distance || 0,
          deviceId: navigator.userAgent
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify check-in");
      }

      setIsCheckedIn(true);
      setMessage(`Check-in successful! ${data.verified ? 'Verified.' : 'Pending manual review.'}`);
      stopCamera();
      
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      console.error("Check-in error:", err);
      setMessage(err.message || "Error checking in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Daily Check-In</h2>

      {/* Location & Geofence Status */}
      <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-2">
        <div>
          <p className="text-sm font-medium text-slate-700">Location Status</p>
          {location ? (
            <p className="text-green-600 mt-1 text-sm">
              ✓ Detected ({location.accuracy?.toFixed(0)}m accuracy)
            </p>
          ) : (
            <p className="text-slate-600 mt-1 text-sm">
              {locError ? `✗ ${locError}` : "Detecting location..."}
            </p>
          )}
        </div>
        
        {location && (
          <div>
            <p className="text-sm font-medium text-slate-700">Geofence Status</p>
            {isInside ? (
              <p className="text-green-600 mt-1 text-sm">✓ Inside office area ({distance?.toFixed(0)}m from center)</p>
            ) : (
              <p className="text-amber-600 mt-1 text-sm">✗ Outside office area ({distance?.toFixed(0)}m from center)</p>
            )}
          </div>
        )}
      </div>

      {/* Camera View */}
      <div className={`mb-4 overflow-hidden rounded-lg bg-slate-100 relative ${streamActive ? 'block' : 'hidden'}`}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-auto"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs bg-black bg-opacity-50 py-1">
          Selfie required for verification
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        {!streamActive && !isCheckedIn && (
          <button
            onClick={startCamera}
            disabled={!location || isCheckedIn}
            className="w-full bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 font-semibold py-2 rounded-lg transition-colors"
          >
            Start Camera for Check-in
          </button>
        )}

        <button
          onClick={() => handleCheckIn(autoTriggered ? "auto" : "manual")}
          disabled={!location || submitting || isCheckedIn}
          className={`w-full font-semibold py-3 rounded-lg transition-colors text-white ${
            isCheckedIn 
              ? "bg-slate-400" 
              : isInside 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-blue-600 hover:bg-blue-700"
          } disabled:opacity-70`}
        >
          {submitting 
            ? "Verifying & Checking in..." 
            : isCheckedIn 
              ? "Checked In" 
              : streamActive 
                ? "Take Photo & Check In"
                : "Check In"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mt-4 p-3 rounded text-sm ${message.includes("successful") ? "bg-green-50 text-green-700" : message.includes("entered") ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}
    </div>
  );
};
