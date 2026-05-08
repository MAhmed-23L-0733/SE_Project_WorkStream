"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardMetrics } from "@/types";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch employee attendance metrics
    const fetchMetrics = async () => {
      try {
        // TODO: Implement metrics calculation from Firestore
        setMetrics({
          totalEmployees: 1,
          presentToday: 1,
          absentToday: 0,
          onLeaveToday: 0,
          averageAttendance: 92
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

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
        <h1 className="text-4xl font-bold text-slate-900">Welcome, {user?.displayName || user?.email}</h1>
        <p className="text-slate-600 mt-2">Here&apos;s your attendance overview</p>
      </div>

      <MetricsGrid metrics={metrics} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Attendance History</h2>
          <div className="text-slate-600">No attendance records yet</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded">
              ✓ Check In Today
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded">
              📋 Request Leave
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded">
              👁️ View Statistics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
