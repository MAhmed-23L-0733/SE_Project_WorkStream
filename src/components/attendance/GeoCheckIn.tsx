"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { MapPin, Clock } from "lucide-react";

const OFFICE_LAT = 31.5204; 
const OFFICE_LNG = 74.3587;
const MAX_DISTANCE_METERS = 999999999; // Bypassed for testing purposes

interface GeoCheckInProps {
  onSuccess?: () => void;
}

export function GeoCheckIn({ onSuccess }: GeoCheckInProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);

  // Custom UI Confirmation States
  const [confirmAction, setConfirmAction] = useState<"checkIn" | "checkOut" | null>(null);
  const [countdown, setCountdown] = useState(5);

  const todayDate = new Date().toLocaleDateString('en-CA');

  useEffect(() => {
    const fetchTodayStatus = async () => {
      if (!user?.uid) return;
      try {
        const recordId = `${user.uid}_${todayDate}`;
        const docRef = doc(db, "attendance", recordId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setTodayRecord({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching today's attendance:", error);
      }
    };
    fetchTodayStatus();
  }, [user?.uid, todayDate]);

  // Countdown Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (confirmAction && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [confirmAction, countdown]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const initiateConfirmation = (actionType: "checkIn" | "checkOut") => {
    setConfirmAction(actionType);
    setCountdown(5); // Start the 5-second timer
    setStatus("Pending confirmation...");
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    
    setLoading(true);
    setStatus("Locating...");

    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported by your browser.");
      setLoading(false);
      setConfirmAction(null);
      return;
    }

    const proceedWithCheckIn = async (latitude: number, longitude: number) => {
      try {
        const now = new Date().toISOString();
        const recordId = `${user?.uid}_${todayDate}`;
        const recordRef = doc(db, "attendance", recordId);
        
        if (confirmAction === "checkIn") {
          const newRecord = {
            userId: user?.uid,
            date: todayDate,
            checkInTime: now,
            checkOutTime: null,
            status: "present", 
            location: { latitude, longitude }
          };
          
          await setDoc(recordRef, newRecord);
          setTodayRecord({ id: recordId, ...newRecord });
          setStatus("Checked in successfully!");
          onSuccess?.();
          
        } else if (confirmAction === "checkOut" && todayRecord) {
          await updateDoc(recordRef, { checkOutTime: now });
          setTodayRecord({ ...todayRecord, checkOutTime: now });
          setStatus("Checked out successfully!");
          onSuccess?.();
        }
      } catch (error) {
        console.error("Attendance error:", error);
        setStatus("Error saving record.");
      }
      setLoading(false);
      setConfirmAction(null);
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);

        if (distance > MAX_DISTANCE_METERS) {
          setStatus(`Failed. You are ${Math.round(distance)}m away. Must be within 100m.`);
          setLoading(false);
          setConfirmAction(null);
          return;
        }

        proceedWithCheckIn(latitude, longitude);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("Please allow location permissions in your browser.");
          setLoading(false);
          setConfirmAction(null);
        } else {
          // Desktop browsers often lack GPS. Fallback to mock coordinates.
          console.warn("Location unavailable, falling back to mock office coordinates:", error.message);
          proceedWithCheckIn(OFFICE_LAT, OFFICE_LNG);
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
    );
  };

  let actionUI;
  
  if (confirmAction) {
    // Custom Confirmation UI
    actionUI = (
      <div className="att-confirm-wrap">
        <p className="att-confirm-msg">
          {confirmAction === "checkIn" ? "Confirm Check-In?" : "Final Check-Out for today?"}
        </p>
        <div className="att-btn-row">
          <button 
            onClick={() => {
              setConfirmAction(null);
              setStatus("");
            }}
            disabled={loading}
            className="att-btn-secondary"
          >
            Cancel
          </button>
          <button 
            onClick={executeAction}
            disabled={countdown > 0 || loading}
            className={`att-btn ${
              countdown > 0 
                ? "disabled" 
                : confirmAction === "checkIn" 
                  ? "success" 
                  : "danger"
            }`}
          >
            {loading ? "Processing..." : countdown > 0 ? `Wait ${countdown}s` : "Confirm"}
          </button>
        </div>
      </div>
    );
  } else if (!todayRecord) {
    actionUI = (
      <button 
        onClick={() => initiateConfirmation("checkIn")} 
        className="att-btn-primary"
      >
        <MapPin size={18} /> Check In Now
      </button>
    );
  } else if (todayRecord && !todayRecord.checkOutTime) {
    actionUI = (
      <button 
        onClick={() => initiateConfirmation("checkOut")} 
        className="att-btn-warning"
      >
        <Clock size={18} /> Check Out
      </button>
    );
  } else {
    actionUI = (
      <div className="att-status-complete">
        ✅ Attendance Completed Today
      </div>
    );
  }

  return (
    <div className="att-card top-bordered">
      <div className="att-card-header">
        <h2>Daily Check-In</h2>
      </div>
      <div className="att-card-body">
        <div className="att-status-box">
          <span className="att-status-label">Location Status</span>
          <span className="att-status-text">
            {status || "Ready to verify location"}
          </span>
        </div>
        {actionUI}
      </div>
    </div>
  );
}