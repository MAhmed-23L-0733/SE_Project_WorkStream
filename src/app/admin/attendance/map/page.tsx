"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { firebaseHelpers } from "@/lib/firebase";
import { AttendanceRecord } from "@/types";

// Dynamically import map component with SSR disabled
const AdminMap = dynamic(() => import("@/components/attendance/AdminMap"), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">Loading Map...</div>
});

export default function AttendanceMapPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [geofenceSettings, setGeofenceSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all attendance records
        const allRecords = await firebaseHelpers.getAllAttendanceRecords();
        setRecords(allRecords as AttendanceRecord[]);

        // Fetch geofence settings
        const settings = await firebaseHelpers.getSettings("geofence");
        if (settings) {
          setGeofenceSettings(settings);
        } else {
          // Default fallback
          setGeofenceSettings({ latitude: 37.7749, longitude: -122.4194, radiusMeters: 100 });
        }
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRecords = records.filter(record => {
    const matchesDate = filterDate ? record.date === filterDate : true;
    const matchesStatus = 
      filterStatus === "all" ? true :
      filterStatus === "unverified" ? record.verified === false :
      filterStatus === "verified" ? record.verified === true :
      true;
    return matchesDate && matchesStatus;
  });

  return (
    <div className="p-8 h-[calc(100vh-theme(spacing.16))] flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Map</h1>
          <p className="text-slate-600 mt-1">View employee check-ins and geofence compliance</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500 mb-1">Date Filter</label>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500 mb-1">Verification Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Check-ins</option>
              <option value="verified">Verified</option>
              <option value="unverified">Needs Review (Unverified)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white p-4 rounded-lg shadow min-h-[500px]">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <AdminMap records={filteredRecords} geofenceSettings={geofenceSettings} />
        )}
      </div>
    </div>
  );
}
