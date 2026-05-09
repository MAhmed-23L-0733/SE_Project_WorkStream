"use client";
import { useEffect, useState } from "react";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { useAuth } from "@/hooks/useAuth";
import { DashboardMetrics } from "@/types";
import { firebaseHelpers } from "@/lib/firebase";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    averageAttendance: 0
  });
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await firebaseHelpers.getDashboardMetrics();
        setMetrics(data);

        // Fetch pending leave requests
        const leaveRequests = await firebaseHelpers.getAllLeaveRequests();
        const pendingCount = leaveRequests.filter(
          (req: any) => req.status === "pending"
        ).length;
        setPendingLeaveCount(pendingCount);
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
        <h1 className="text-4xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome back, {user?.fullName || user?.email}</p>
      </div>

      <MetricsGrid metrics={metrics} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Pending Leave Requests</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{pendingLeaveCount}</p>
            </div>
            <div className="text-3xl">📝</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Activities</h2>
          <div className="text-slate-600">No recent activities</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded">
              ➕ Add New Employee
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded">
              📋 Review Leave Requests
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded">
              📊 Generate Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
