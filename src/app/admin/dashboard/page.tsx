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

const now = new Date();
const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dateStr = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

const QuickActions = [
  {
    label: "Add Employee",
    href: "/admin/employees",
    bg: "#eef0ff",
    color: "#6366f1",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
      </svg>
    ),
  },
  {
    label: "New Project",
    href: "/admin/projects",
    bg: "#ecfdf5",
    color: "#10b981",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        <line x1="12" y1="11" x2="12" y2="17"/>
        <line x1="9" y1="14" x2="15" y2="14"/>
      </svg>
    ),
  },
  {
    label: "Leave Requests",
    href: "/admin/leave-requests",
    bg: "#fffbeb",
    color: "#f59e0b",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    label: "Send Message",
    href: "/admin/messages",
    bg: "#fdf2ff",
    color: "#a855f7",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    averageAttendance: 0,
  });
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendPoint[]>([]);
  const [leaveDistribution, setLeaveDistribution] = useState<LeaveDistribution>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [departmentHeadcount, setDepartmentHeadcount] = useState<DepartmentHeadcount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildAttendanceTrend = (records: AttendanceRecord[], total: number) => {
      const today = new Date();
      const points: AttendanceTrendPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const presentCount = records.filter(
          (r) => r.date === key && (r.status === "present" || r.status === "late")
        ).length;
        points.push({
          key,
          label: d.toLocaleDateString([], { weekday: "short" }),
          attendanceRate: total > 0 ? (presentCount / total) * 100 : 0,
          presentCount,
        });
      }
      setAttendanceTrend(points);
    };

    const buildLeaveDistribution = (leaves: LeaveRequest[]) => {
      const pending = leaves.filter((l) => l.status === LeaveStatus.PENDING).length;
      const approved = leaves.filter((l) => l.status === LeaveStatus.APPROVED).length;
      const rejected = leaves.filter((l) => l.status === LeaveStatus.REJECTED).length;
      setLeaveDistribution({ pending, approved, rejected });
      setPendingLeaveCount(pending);
      setRecentLeaves(leaves.slice(0, 5));
    };

    const buildDepartmentHeadcount = (users: User[]) => {
      const map = new Map<string, number>();
      users.filter((u) => u.role === "employee").forEach((emp) => {
        const dept = emp.department?.trim() || "Unassigned";
        map.set(dept, (map.get(dept) || 0) + 1);
      });
      setDepartmentHeadcount(
        Array.from(map.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
      );
    };

    const fetchAll = async () => {
      try {
        const [data, leaveRequests, attendanceRecords, users] = await Promise.all([
          firebaseHelpers.getDashboardMetrics(),
          firebaseHelpers.getAllLeaveRequests(),
          firebaseHelpers.getAllAttendanceRecords(),
          firebaseHelpers.getAllUsers(),
        ]);
        setMetrics(data);
        buildLeaveDistribution(leaveRequests as LeaveRequest[]);
        buildAttendanceTrend(attendanceRecords as AttendanceRecord[], data.totalEmployees);
        buildDepartmentHeadcount(users as User[]);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "400px" }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          border: "3px solid #eef0ff",
          borderTop: "3px solid #6366f1",
          animation: "spin 0.75s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const attendancePct = metrics.totalEmployees > 0
    ? Math.round((metrics.presentToday / metrics.totalEmployees) * 100)
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .adash-root {
          padding: 1.75rem 2rem 2.5rem;
          background: #f5f7ff;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* --- Top Bar --- */
        .adash-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
        }

        .adash-page-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
        }

        .adash-topbar-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .adash-datetime {
          text-align: right;
        }

        .adash-time {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }

        .adash-date {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 1px;
        }

        .adash-bell {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #e8eaf0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: box-shadow 0.2s;
        }

        .adash-bell:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .adash-bell-dot {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid #fff;
        }

        /* --- Welcome Banner --- */
        .welcome-banner {
          background: #ffffff;
          border-radius: 1.25rem;
          border: 1px solid #f0f2f8;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          padding: 1.5rem 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          overflow: hidden;
          position: relative;
        }

        .welcome-banner::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 5px;
          background: linear-gradient(180deg, #6366f1, #a855f7, #f59e0b);
          border-radius: 4px 0 0 4px;
        }

        .welcome-left {
          display: flex;
          align-items: center;
          gap: 1.1rem;
        }

        .welcome-avatar {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
          font-size: 1.25rem;
          flex-shrink: 0;
          object-fit: cover;
        }

        .welcome-greeting {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6366f1;
          margin-bottom: 0.2rem;
        }

        .welcome-name {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .welcome-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.4rem;
          flex-wrap: wrap;
        }

        .welcome-meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 500;
        }

        .welcome-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .welcome-stat {
          text-align: center;
          padding: 0.6rem 1rem;
          background: #f8fafc;
          border-radius: 0.75rem;
          border: 1px solid #f0f2f8;
        }

        .welcome-stat-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
        }

        .welcome-stat-label {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 500;
          margin-top: 1px;
        }

        /* --- Quick Actions --- */
        .quick-actions-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.85rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 900px) {
          .quick-actions-row { grid-template-columns: repeat(2, 1fr); }
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.85rem 1rem;
          border-radius: 0.75rem;
          border: 1.5px solid transparent;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
          background: #fff;
          border-color: #f0f2f8;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }

        .quick-action-btn:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .quick-action-icon {
          width: 34px;
          height: 34px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* --- Bottom Grid --- */
        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 860px) {
          .bottom-grid { grid-template-columns: 1fr; }
        }

        .panel-card {
          background: #ffffff;
          border-radius: 1rem;
          border: 1px solid #f0f2f8;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          padding: 1.35rem;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.1rem;
        }

        .panel-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        .panel-view-all {
          font-size: 0.78rem;
          font-weight: 600;
          color: #6366f1;
          text-decoration: none;
          transition: color 0.2s;
        }

        .panel-view-all:hover { color: #4f46e5; }

        /* Recent Activity */
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.75rem 0.5rem;
          border-bottom: 1px solid #f8fafc;
        }

        .activity-item:last-child { border-bottom: none; }

        .activity-dot {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.9rem;
        }

        .activity-text { flex: 1; }

        .activity-title {
          font-size: 0.825rem;
          font-weight: 600;
          color: #1e293b;
        }

        .activity-sub {
          font-size: 0.73rem;
          color: #94a3b8;
          margin-top: 2px;
        }

        .activity-badge {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 99px;
        }

        /* Announcements placeholder */
        .announce-item {
          padding: 0.85rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .announce-item:last-child { border-bottom: none; }

        .announce-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.3rem;
        }

        .announce-tag {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.2rem 0.55rem;
          border-radius: 99px;
        }

        .announce-date {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        .announce-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.2rem;
        }

        .announce-body {
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.5;
        }
      `}</style>

      <div className="adash-root">
        {/* Top Bar */}
        <div className="adash-topbar">
          <h1 className="adash-page-title">Admin Dashboard</h1>
          <div className="adash-topbar-right">
            <div className="adash-datetime">
              <div className="adash-time">{timeStr}</div>
              <div className="adash-date">{dateStr}</div>
            </div>
            <div className="adash-bell">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {pendingLeaveCount > 0 && <span className="adash-bell-dot" />}
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-left">
            {(user as any)?.profileImage ? (
              <img src={(user as any).profileImage} alt="avatar" className="welcome-avatar" />
            ) : (
              <div className="welcome-avatar">
                {((user as any)?.fullName?.[0] || "A").toUpperCase()}
              </div>
            )}
            <div>
              <p className="welcome-greeting">Welcome Back</p>
              <p className="welcome-name">{(user as any)?.fullName || user?.email || "Admin"}</p>
              <div className="welcome-meta">
                <span className="welcome-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Administrator
                </span>
                {(user as any)?.department && (
                  <span className="welcome-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    </svg>
                    {(user as any).department}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="welcome-actions">
            <div className="welcome-stat">
              <div className="welcome-stat-num" style={{ color: "#6366f1" }}>{metrics.totalEmployees}</div>
              <div className="welcome-stat-label">Total Employees</div>
            </div>
            <div className="welcome-stat">
              <div className="welcome-stat-num" style={{ color: "#10b981" }}>{attendancePct}%</div>
              <div className="welcome-stat-label">Attendance Today</div>
            </div>
            {pendingLeaveCount > 0 && (
              <div className="welcome-stat">
                <div className="welcome-stat-num" style={{ color: "#f59e0b" }}>{pendingLeaveCount}</div>
                <div className="welcome-stat-label">Pending Leaves</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-row">
          {QuickActions.map((action) => (
            <a key={action.href} href={action.href} className="quick-action-btn">
              <div className="quick-action-icon" style={{ background: action.bg }}>
                <span style={{ color: action.color }}>{action.icon}</span>
              </div>
              <span style={{ color: "#374151" }}>{action.label}</span>
            </a>
          ))}
        </div>

        {/* Metrics */}
        <MetricsGrid metrics={metrics} pendingLeaveCount={pendingLeaveCount} />

        {/* Charts */}
        <AdminInsightsCharts
          attendanceTrend={attendanceTrend}
          leaveDistribution={leaveDistribution}
          departmentHeadcount={departmentHeadcount}
        />

        {/* Bottom Row: Recent Leave Requests + Announcements */}
        <div className="bottom-grid">
          {/* Recent Leave Requests */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Recent Leave Requests</span>
              <a href="/admin/leave-requests" className="panel-view-all">View All</a>
            </div>
            <div className="activity-list">
              {recentLeaves.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No leave requests yet.</p>
              ) : recentLeaves.map((leave: any) => {
                const isPending = leave.status === LeaveStatus.PENDING;
                const isApproved = leave.status === LeaveStatus.APPROVED;
                return (
                  <div key={leave.id} className="activity-item">
                    <div
                      className="activity-dot"
                      style={{ background: isPending ? "#fffbeb" : isApproved ? "#ecfdf5" : "#fff1f2" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                        stroke={isPending ? "#f59e0b" : isApproved ? "#10b981" : "#ef4444"}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="activity-text">
                      <div className="activity-title">{leave.userName || "Employee"}</div>
                      <div className="activity-sub">
                        {leave.leaveType} · {leave.startDate} → {leave.endDate}
                      </div>
                    </div>
                    <span
                      className="activity-badge"
                      style={{
                        background: isPending ? "#fffbeb" : isApproved ? "#ecfdf5" : "#fff1f2",
                        color: isPending ? "#92400e" : isApproved ? "#065f46" : "#991b1b",
                      }}
                    >
                      {leave.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Announcements / Quick Stats */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Overview</span>
            </div>
            <div>
              <div className="announce-item">
                <div className="announce-top">
                  <span className="announce-tag" style={{ background: "#eef0ff", color: "#4338ca" }}>Workforce</span>
                  <span className="announce-date">Today</span>
                </div>
                <div className="announce-title">Daily Attendance Summary</div>
                <div className="announce-body">
                  {metrics.presentToday} employees checked in, {metrics.absentToday} absent, and {metrics.onLeaveToday} on approved leave today.
                </div>
              </div>

              <div className="announce-item">
                <div className="announce-top">
                  <span className="announce-tag" style={{ background: "#fffbeb", color: "#92400e" }}>Action Required</span>
                  <span className="announce-date">Pending</span>
                </div>
                <div className="announce-title">Leave Requests Awaiting Approval</div>
                <div className="announce-body">
                  {pendingLeaveCount > 0
                    ? `${pendingLeaveCount} leave request${pendingLeaveCount !== 1 ? "s" : ""} need your review and approval.`
                    : "All leave requests are up to date. No pending actions required."}
                </div>
              </div>

              <div className="announce-item">
                <div className="announce-top">
                  <span className="announce-tag" style={{ background: "#ecfdf5", color: "#065f46" }}>Status</span>
                  <span className="announce-date">Month</span>
                </div>
                <div className="announce-title">Average Attendance Rate</div>
                <div className="announce-body">
                  Monthly average attendance is at {metrics.averageAttendance
                    ? `${Math.round(metrics.averageAttendance)}%`
                    : `${attendancePct}%`} — {attendancePct >= 90 ? "on track with targets." : attendancePct >= 75 ? "slightly below target." : "needs attention."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
