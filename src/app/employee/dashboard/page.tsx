"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import Link from "next/link"; 
import { AttendanceRecord } from "@/types";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [employeeMetrics, setEmployeeMetrics] = useState<any>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.uid) {
          // Fetch real attendance history
          const attendance = await firebaseHelpers.getAttendanceRecords(user.uid);
          // Sort to get newest first and slice top 3
          const sorted = (attendance as AttendanceRecord[]).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setRecentAttendance(sorted.slice(0, 3));
        }

        // Keep existing metrics block
        setEmployeeMetrics({
          attendanceStreak: 12, 
          pendingLeaves: 1, 
          annualLeaveBalance: 14,
          sickLeaveBalance: 6
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        <h1 className="text-4xl font-bold text-slate-900">Welcome, {user?.fullName || user?.email}</h1>
        <p className="text-slate-600 mt-2">Here&apos;s your attendance overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col">
          <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Attendance Streak</span>
          <span className="text-3xl font-bold text-slate-800 mt-2">{employeeMetrics?.attendanceStreak || 0} 🔥</span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col">
          <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Pending Leaves</span>
          <span className="text-3xl font-bold text-slate-800 mt-2">{employeeMetrics?.pendingLeaves || 0} ⏳</span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col">
          <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Annual Leave</span>
          <span className="text-3xl font-bold text-slate-800 mt-2">{employeeMetrics?.annualLeaveBalance || 0} <span className="text-lg font-medium text-slate-500">Days</span></span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col">
          <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Sick Leave</span>
          <span className="text-3xl font-bold text-slate-800 mt-2">{employeeMetrics?.sickLeaveBalance || 0} <span className="text-lg font-medium text-slate-500">Days</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance History Block */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Recent Attendance</h2>
            <Link href="/employee/attendance" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All &rarr;
            </Link>
          </div>
          
          {recentAttendance.length === 0 ? (
            <div className="text-slate-600 py-4">No attendance records yet.</div>
          ) : (
            <div className="space-y-3">
              {recentAttendance.map((record) => (
                <div key={record.id} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800">{new Date(record.date).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-500">
                      In: {new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {record.checkOutTime ? ` - Out: ${new Date(record.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : " - No Checkout"}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.status === "present" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Profile Block */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/employee/attendance">
                <button className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition-colors border border-transparent hover:border-slate-200">
                  📍 Daily Check-In
                </button>
              </Link>
              <Link href="/employee/leave">
                <button className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-lg text-slate-700 font-medium transition-colors border border-transparent hover:border-slate-200">
                  📋 Request Leave
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">My Profile</h2>
            <div className="space-y-3 text-slate-600">
              <p><span className="font-medium text-slate-800">Name:</span> {user?.displayName || "Not Set"}</p>
              <p><span className="font-medium text-slate-800">Email:</span> {user?.email}</p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}