"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const OFFICE_LAT = 31.5204; 
const OFFICE_LNG = 74.3587;
const MAX_DISTANCE_METERS = 100000; // Change to 999999 for testing from home

export function GeoCheckIn() {
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

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);

        if (distance > MAX_DISTANCE_METERS) {
          setStatus(`Failed. You are ${Math.round(distance)}m away. Must be within 100m.`);
          setLoading(false);
          setConfirmAction(null);
          return;
        }

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
            
          } else if (confirmAction === "checkOut" && todayRecord) {
            await updateDoc(recordRef, { checkOutTime: now });
            setTodayRecord({ ...todayRecord, checkOutTime: now });
            setStatus("Checked out successfully!");
          }
        } catch (error) {
          console.error("Attendance error:", error);
          setStatus("Error saving record.");
        }
        setLoading(false);
        setConfirmAction(null);
      },
      (error) => {
        setStatus("Please allow location permissions.");
        setLoading(false);
        setConfirmAction(null);
      }
    );
  };

  let actionUI;
  
  if (confirmAction) {
    // Custom Confirmation UI
    actionUI = (
      <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
        <p className="text-sm text-slate-700 font-medium text-center bg-orange-50 border border-orange-200 py-2 rounded-lg">
          {confirmAction === "checkIn" ? "Confirm Check-In?" : "Final Check-Out for today?"}
        </p>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setConfirmAction(null);
              setStatus("");
            }}
            disabled={loading}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={executeAction}
            disabled={countdown > 0 || loading}
            className={`flex-1 font-bold py-3 px-4 rounded-lg transition-all duration-300 ${
              countdown > 0 
                ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                : confirmAction === "checkIn" 
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200" 
                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
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
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
      >
        Check In
      </button>
    );
  } else if (todayRecord && !todayRecord.checkOutTime) {
    actionUI = (
      <button 
        onClick={() => initiateConfirmation("checkOut")} 
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
      >
        Check Out
      </button>
    );
  } else {
    actionUI = (
      <div className="w-full bg-slate-100 text-slate-500 font-bold py-3 px-4 rounded-lg text-center border border-slate-200">
        Attendance Completed Today
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Daily Check-In</h2>
      <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
        <p className="text-sm text-slate-500 mb-1">Location Status</p>
        <p className="font-medium text-slate-800">
          {status || "Ready to verify location"}
        </p>
      </div>
      {actionUI}
    </div>
  );
}