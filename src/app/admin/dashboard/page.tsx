"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { AdminInsightsCharts } from "@/components/dashboard/AdminInsightsCharts";
import { useAuth } from "@/hooks/useAuth";
import {
  Announcement,
  AnnouncementPriority,
  AnnouncementType,
  AttendanceRecord,
  DashboardMetrics,
  LeaveRequest,
  LeaveStatus,
  User,
} from "@/types";
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
const timeStr = now.toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
});
const dateStr = now.toLocaleDateString([], {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const QuickActions = [
  {
    label: "Add Employee",
    href: "/admin/employees",
    tone: "indigo",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="1" y1="12" x2="3" y2="12" />
      </svg>
    ),
  },
  {
    label: "New Project",
    href: "/admin/projects",
    tone: "emerald",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    ),
  },
  {
    label: "Leave Requests",
    href: "/admin/leave-requests",
    tone: "amber",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Send Message",
    href: "/admin/messages",
    tone: "violet",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const todayDate = localToday;
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    averageAttendance: 0,
  });
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<
    AttendanceTrendPoint[]
  >([]);
  const [leaveDistribution, setLeaveDistribution] = useState<LeaveDistribution>(
    {
      pending: 0,
      approved: 0,
      rejected: 0,
    },
  );
  const [departmentHeadcount, setDepartmentHeadcount] = useState<
    DepartmentHeadcount[]
  >([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState<string | null>(
    null,
  );
  const [announcementForm, setAnnouncementForm] = useState({
    type: "general" as AnnouncementType,
    priority: "medium" as AnnouncementPriority,
    startDate: todayDate,
    title: "",
    detail: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildAttendanceTrend = (
      records: AttendanceRecord[],
      total: number,
    ) => {
      const today = new Date();
      const points: AttendanceTrendPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const presentCount = records.filter(
          (r) =>
            r.date === key && (r.status === "present" || r.status === "late"),
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
      const pending = leaves.filter(
        (l) => l.status === LeaveStatus.PENDING,
      ).length;
      const approved = leaves.filter(
        (l) => l.status === LeaveStatus.APPROVED,
      ).length;
      const rejected = leaves.filter(
        (l) => l.status === LeaveStatus.REJECTED,
      ).length;
      setLeaveDistribution({ pending, approved, rejected });
      setPendingLeaveCount(pending);
      setRecentLeaves(leaves.slice(0, 5));
    };

    const buildDepartmentHeadcount = (users: User[]) => {
      const map = new Map<string, number>();
      users
        .filter((u) => u.role === "employee")
        .forEach((emp) => {
          const dept = emp.department?.trim() || "Unassigned";
          map.set(dept, (map.get(dept) || 0) + 1);
        });
      setDepartmentHeadcount(
        Array.from(map.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6),
      );
    };

    const fetchAll = async () => {
      try {
        const [
          data,
          leaveRequests,
          attendanceRecords,
          users,
          allAnnouncements,
        ] = await Promise.all([
          firebaseHelpers.getDashboardMetrics(),
          firebaseHelpers.getAllLeaveRequests(),
          firebaseHelpers.getAllAttendanceRecords(),
          firebaseHelpers.getAllUsers(),
          firebaseHelpers.getAllAnnouncements(),
        ]);
        setMetrics(data);
        buildLeaveDistribution(leaveRequests as LeaveRequest[]);
        buildAttendanceTrend(
          attendanceRecords as AttendanceRecord[],
          data.totalEmployees,
        );
        buildDepartmentHeadcount(users as User[]);
        setAnnouncements(allAnnouncements as Announcement[]);
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
      <div className="adash-loading-wrap">
        <div className="adash-loading-spinner" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const attendancePct =
    metrics.totalEmployees > 0
      ? Math.round((metrics.presentToday / metrics.totalEmployees) * 100)
      : 0;

  const typeLabelMap: Record<AnnouncementType, string> = {
    timing_change: "Timing Change",
    policy_update: "Policy Update",
    general: "General",
    company_change: "Company Change",
  };

  const priorityTagClass: Record<AnnouncementPriority, string> = {
    high: "announce-tag-high",
    medium: "announce-tag-medium",
    low: "announce-tag-low",
  };

  const handleCreateAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !user?.uid ||
      !announcementForm.title.trim() ||
      !announcementForm.detail.trim() ||
      !announcementForm.startDate
    ) {
      return;
    }

    setSubmittingAnnouncement(true);
    setAnnouncementMessage(null);

    try {
      await firebaseHelpers.createAnnouncement({
        type: announcementForm.type,
        priority: announcementForm.priority,
        startDate: announcementForm.startDate,
        title: announcementForm.title,
        detail: announcementForm.detail,
        createdBy: user.uid,
        createdByName: (user as any)?.fullName || user.email || "Admin",
      });

      const allAnnouncements = await firebaseHelpers.getAllAnnouncements();
      setAnnouncements(allAnnouncements as Announcement[]);
      setAnnouncementForm({
        type: "general",
        priority: "medium",
        startDate: todayDate,
        title: "",
        detail: "",
      });
      setAnnouncementMessage("Announcement published successfully.");
    } catch (error) {
      console.error("Error creating announcement:", error);
      setAnnouncementMessage("Could not publish announcement.");
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

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

        .adash-loading-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 400px;
        }

        .adash-loading-spinner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 3px solid #eef0ff;
          border-top: 3px solid #6366f1;
          animation: spin 0.75s linear infinite;
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

        .welcome-stat-num-indigo { color: #6366f1; }
        .welcome-stat-num-emerald { color: #10b981; }
        .welcome-stat-num-amber { color: #f59e0b; }

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
          color: #475569;
        }

        .quick-action-icon.qa-indigo { background: #eef0ff; color: #6366f1; }
        .quick-action-icon.qa-emerald { background: #ecfdf5; color: #10b981; }
        .quick-action-icon.qa-amber { background: #fffbeb; color: #f59e0b; }
        .quick-action-icon.qa-violet { background: #fdf2ff; color: #a855f7; }

        .quick-action-label {
          color: #374151;
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

        .activity-dot.pending {
          background: #fffbeb;
          color: #f59e0b;
        }

        .activity-dot.approved {
          background: #ecfdf5;
          color: #10b981;
        }

        .activity-dot.rejected {
          background: #fff1f2;
          color: #ef4444;
        }

        .activity-badge.pending {
          background: #fffbeb;
          color: #92400e;
        }

        .activity-badge.approved {
          background: #ecfdf5;
          color: #065f46;
        }

        .activity-badge.rejected {
          background: #fff1f2;
          color: #991b1b;
        }

        .leave-empty-text {
          font-size: 0.85rem;
          color: #94a3b8;
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

        .announcement-form {
          border: 1px solid #eef2ff;
          border-radius: 0.85rem;
          background: #f8faff;
          padding: 0.85rem;
          margin-bottom: 1rem;
        }

        .announcement-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
          margin-bottom: 0.6rem;
        }

        .announcement-input,
        .announcement-select,
        .announcement-textarea {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.65rem;
          padding: 0.58rem 0.7rem;
          font-size: 0.78rem;
          color: #334155;
          background: #ffffff;
          outline: none;
          font-family: 'Inter', sans-serif;
        }

        .announcement-input:focus,
        .announcement-select:focus,
        .announcement-textarea:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .announcement-textarea {
          resize: vertical;
          min-height: 68px;
          margin-top: 0.55rem;
        }

        .announcement-submit {
          margin-top: 0.6rem;
          border: none;
          border-radius: 0.65rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 0.55rem 0.95rem;
          cursor: pointer;
        }

        .announcement-submit:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        .announcement-message {
          margin-top: 0.45rem;
          font-size: 0.75rem;
          color: #4f46e5;
          font-weight: 600;
        }

        .announce-tag-high {
          background: #fee2e2;
          color: #991b1b;
        }

        .announce-tag-medium {
          background: #fef3c7;
          color: #92400e;
        }

        .announce-tag-low {
          background: #e0e7ff;
          color: #3730a3;
        }

        .announce-list-empty {
          font-size: 0.83rem;
          color: #94a3b8;
        }

        @media (max-width: 700px) {
          .announcement-grid {
            grid-template-columns: 1fr;
          }
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {pendingLeaveCount > 0 && <span className="adash-bell-dot" />}
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-left">
            {(user as any)?.profileImage ? (
              <img
                src={(user as any).profileImage}
                alt="avatar"
                className="welcome-avatar"
              />
            ) : (
              <div className="welcome-avatar">
                {((user as any)?.fullName?.[0] || "A").toUpperCase()}
              </div>
            )}
            <div>
              <p className="welcome-greeting">Welcome Back</p>
              <p className="welcome-name">
                {(user as any)?.fullName || user?.email || "Admin"}
              </p>
              <div className="welcome-meta">
                <span className="welcome-meta-item">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Administrator
                </span>
                {(user as any)?.department && (
                  <span className="welcome-meta-item">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    {(user as any).department}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="welcome-actions">
            <div className="welcome-stat">
              <div className="welcome-stat-num welcome-stat-num-indigo">
                {metrics.totalEmployees}
              </div>
              <div className="welcome-stat-label">Total Employees</div>
            </div>
            <div className="welcome-stat">
              <div className="welcome-stat-num welcome-stat-num-emerald">
                {attendancePct}%
              </div>
              <div className="welcome-stat-label">Attendance Today</div>
            </div>
            {pendingLeaveCount > 0 && (
              <div className="welcome-stat">
                <div className="welcome-stat-num welcome-stat-num-amber">
                  {pendingLeaveCount}
                </div>
                <div className="welcome-stat-label">Pending Leaves</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-row">
          {QuickActions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="quick-action-btn"
            >
              <div className={`quick-action-icon qa-${action.tone}`}>
                <span>{action.icon}</span>
              </div>
              <span className="quick-action-label">{action.label}</span>
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
              <a href="/admin/leave-requests" className="panel-view-all">
                View All
              </a>
            </div>
            <div className="activity-list">
              {recentLeaves.length === 0 ? (
                <p className="leave-empty-text">No leave requests yet.</p>
              ) : (
                recentLeaves.map((leave: any) => {
                  const isPending = leave.status === LeaveStatus.PENDING;
                  const isApproved = leave.status === LeaveStatus.APPROVED;
                  const toneClass = isPending
                    ? "pending"
                    : isApproved
                      ? "approved"
                      : "rejected";
                  return (
                    <div key={leave.id} className="activity-item">
                      <div className={`activity-dot ${toneClass}`}>
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div className="activity-text">
                        <div className="activity-title">
                          {leave.userName || "Employee"}
                        </div>
                        <div className="activity-sub">
                          {leave.leaveType} · {leave.startDate} →{" "}
                          {leave.endDate}
                        </div>
                      </div>
                      <span className={`activity-badge ${toneClass}`}>
                        {leave.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Announcements Management */}
          <div className="panel-card">
            <div className="panel-header">
              <span className="panel-title">Announcements</span>
            </div>
            <form
              className="announcement-form"
              onSubmit={handleCreateAnnouncement}
            >
              <div className="announcement-grid">
                <select
                  className="announcement-select"
                  value={announcementForm.type}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      type: e.target.value as AnnouncementType,
                    }))
                  }
                >
                  <option value="timing_change">Timing Change</option>
                  <option value="policy_update">Policy Update</option>
                  <option value="general">General</option>
                  <option value="company_change">Company Change</option>
                </select>
                <select
                  className="announcement-select"
                  value={announcementForm.priority}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      priority: e.target.value as AnnouncementPriority,
                    }))
                  }
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="announcement-grid">
                <input
                  type="date"
                  className="announcement-input"
                  value={announcementForm.startDate}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  required
                />
                <input
                  type="text"
                  className="announcement-input"
                  placeholder="Announcement title"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <textarea
                className="announcement-textarea"
                placeholder="Write your announcement details..."
                value={announcementForm.detail}
                onChange={(e) =>
                  setAnnouncementForm((prev) => ({
                    ...prev,
                    detail: e.target.value,
                  }))
                }
                required
              />

              <button
                className="announcement-submit"
                disabled={submittingAnnouncement}
              >
                {submittingAnnouncement
                  ? "Publishing..."
                  : "Publish Announcement"}
              </button>

              {announcementMessage && (
                <p className="announcement-message">{announcementMessage}</p>
              )}
            </form>

            <div>
              {announcements.length === 0 ? (
                <p className="announce-list-empty">
                  No announcements created yet.
                </p>
              ) : (
                announcements.slice(0, 5).map((announcement) => (
                  <div className="announce-item" key={announcement.id}>
                    <div className="announce-top">
                      <span
                        className={`announce-tag ${priorityTagClass[announcement.priority]}`}
                      >
                        {typeLabelMap[announcement.type]} •{" "}
                        {announcement.priority}
                      </span>
                      <span className="announce-date">
                        Starts{" "}
                        {new Date(announcement.startDate).toLocaleDateString(
                          [],
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="announce-title">{announcement.title}</div>
                    <div className="announce-body">{announcement.detail}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
