"use client";

import { useState } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { AttendanceRecord } from "@/types";

export const GeoCheckIn = () => {
  const { user } = useAuth();
  const { location, error, loading, getLocation } = useLocation();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleCheckIn = async () => {
    if (!location || !user) return;

    setSubmitting(true);
    try {
      const attendanceData: AttendanceRecord = {
        userId: user.uid,
        checkInTime: new Date().toISOString(),
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        status: "present",
        date: new Date().toISOString().split("T")[0]
      };

      await firebaseHelpers.createAttendanceRecord(attendanceData);
      setIsCheckedIn(true);
      setMessage("Check-in successful!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error checking in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Daily Check-In</h2>

      {/* Location Status */}
      <div className="mb-4 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm font-medium text-slate-700">Location Status</p>
        {location ? (
          <p className="text-green-600 mt-1">
            ✓ Location detected ({location.accuracy?.toFixed(0)}m accuracy)
          </p>
        ) : (
          <p className="text-slate-600 mt-1">
            {error ? `✗ ${error}` : "No location detected"}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={getLocation}
          disabled={loading || isCheckedIn}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {loading ? "Getting location..." : "Enable Location"}
        </button>
        <button
          onClick={handleCheckIn}
          disabled={!location || submitting || isCheckedIn}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {submitting ? "Checking in..." : isCheckedIn ? "Checked In" : "Check In"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <p className={`mt-3 text-sm ${message.includes("successful") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
};
