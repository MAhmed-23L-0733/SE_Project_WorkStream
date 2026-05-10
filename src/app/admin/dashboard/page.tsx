"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { AdminInsightsCharts } from "@/components/dashboard/AdminInsightsCharts";
import { useAuth } from "@/hooks/useAuth";
import { AttendanceRecord, DashboardMetrics, LeaveRequest, LeaveStatus, User } from "@/types";
import { firebaseHelpers } from "@/lib/firebase";

interface AttendanceTrendPoint {
  key: string;
  label: string;
  attendanceRate: number;
  presentCount: number;
}

interface LeaveDistribution {
  pending: number;
  approved: number;
  rejected: number;
}

interface DepartmentHeadcount {
  name: string;
  count: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    averageAttendance: 0
  });
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendPoint[]>([]);
  const [leaveDistribution, setLeaveDistribution] = useState<LeaveDistribution>({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [departmentHeadcount, setDepartmentHeadcount] = useState<DepartmentHeadcount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildAttendanceTrend = (attendanceRecords: AttendanceRecord[], totalEmployees: number) => {
      const today = new Date();
      const dateKeys: string[] = [];
      const points: AttendanceTrendPoint[] = [];

      for (let i = 6; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const key = date.toISOString().split("T")[0];
        dateKeys.push(key);
      }

      dateKeys.forEach((key) => {
        const date = new Date(`${key}T00:00:00`);
        const presentCount = attendanceRecords.filter(
          (record) => record.date === key && (record.status === "present" || record.status === "late")
        ).length;
        const denominator = totalEmployees > 0 ? totalEmployees : 1;
        const attendanceRate = (presentCount / denominator) * 100;

        points.push({
          key,
          label: date.toLocaleDateString([], { weekday: "short" }),
          attendanceRate,
          presentCount
        });
      });

      setAttendanceTrend(points);
    };

    const buildLeaveDistribution = (leaveRequests: LeaveRequest[]) => {
      const pending = leaveRequests.filter((request) => request.status === LeaveStatus.PENDING).length;
      const approved = leaveRequests.filter((request) => request.status === LeaveStatus.APPROVED).length;
      const rejected = leaveRequests.filter((request) => request.status === LeaveStatus.REJECTED).length;

      setLeaveDistribution({ pending, approved, rejected });
      setPendingLeaveCount(pending);
    };

    const buildDepartmentHeadcount = (users: User[]) => {
      const employeeUsers = users.filter((person) => person.role === "employee");
      const departmentMap = new Map<string, number>();

      employeeUsers.forEach((employee) => {
        const departmentName = employee.department?.trim() || "Unassigned";
        departmentMap.set(departmentName, (departmentMap.get(departmentName) || 0) + 1);
      });

      const sorted = Array.from(departmentMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setDepartmentHeadcount(sorted);
    };

    const fetchMetrics = async () => {
      try {
        const [data, leaveRequests, attendanceRecords, users] = await Promise.all([
          firebaseHelpers.getDashboardMetrics(),
          firebaseHelpers.getAllLeaveRequests(),
          firebaseHelpers.getAllAttendanceRecords(),
          firebaseHelpers.getAllUsers()
        ]);

        setMetrics(data);

        buildLeaveDistribution(leaveRequests as LeaveRequest[]);
        buildAttendanceTrend(attendanceRecords as AttendanceRecord[], data.totalEmployees);
        buildDepartmentHeadcount(users as User[]);
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const handleAddEmployee = () => {
    router.push("/admin/employees");
  };

  const handleReviewLeaveRequests = () => {
    router.push("/admin/leave-requests");
  };

  
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

      <AdminInsightsCharts
        attendanceTrend={attendanceTrend}
        leaveDistribution={leaveDistribution}
        departmentHeadcount={departmentHeadcount}
      />

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
            <button 
              onClick={handleAddEmployee}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded transition-colors"
            >
              ➕ Add New Employee
            </button>
            <button 
              onClick={handleReviewLeaveRequests}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded transition-colors"
            >
              📋 Review Leave Requests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
