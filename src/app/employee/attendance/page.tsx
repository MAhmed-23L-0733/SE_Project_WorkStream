"use client";

import { useState, useEffect } from "react";
import { GeoCheckIn } from "@/components/attendance/GeoCheckIn";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { AttendanceRecord } from "@/types";

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        if (user?.uid) {
          const attendance = await firebaseHelpers.getAttendanceRecords(user.uid);
          // Sort newest first
          const sorted = (attendance as AttendanceRecord[]).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setRecords(sorted);
        }
      } catch (error) {
        console.error("Error fetching attendance records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Attendance</h1>
        <p className="text-slate-600 mt-2">Track your daily check-ins</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Check-In Component */}
        <div>
          <GeoCheckIn />
        </div>

        {/* Attendance History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Attendance History</h2>

            {records.length === 0 ? (
              <div className="text-center text-slate-600 py-8">
                No attendance records yet
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-slate-900">
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === "present"
                          ? "bg-green-100 text-green-800"
                          : record.status === "late"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Check-in: {new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      {record.checkOutTime && (
                        <p>Check-out: {new Date(record.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      )}
                      <p className="mt-2">
                        Location: {record.location.latitude.toFixed(4)}, {record.location.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}