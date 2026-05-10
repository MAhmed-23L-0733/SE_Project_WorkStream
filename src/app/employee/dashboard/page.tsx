"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import Link from "next/link";
import { Announcement, AttendanceRecord } from "@/types";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [employeeMetrics, setEmployeeMetrics] = useState<any>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>(
    [],
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementLoadError, setAnnouncementLoadError] =
    useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const attendancePromise = user?.uid
          ? firebaseHelpers.getAttendanceRecords(user.uid)
          : Promise.resolve([]);
        const leavePromise = user?.uid
          ? firebaseHelpers.getLeaveRequests(user.uid)
          : Promise.resolve([]);

        const [attendanceResult, announcementsResult, leaveResult] =
          await Promise.allSettled([
            attendancePromise,
            firebaseHelpers.getAllAnnouncements(),
            leavePromise,
          ]);

        let allAttendance: AttendanceRecord[] = [];
        if (attendanceResult.status === "fulfilled") {
          allAttendance = attendanceResult.value as AttendanceRecord[];
          const sorted = [...allAttendance].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          setRecentAttendance(sorted.slice(0, 3));
        } else {
          console.error("Error fetching attendance:", attendanceResult.reason);
        }

        if (announcementsResult.status === "fulfilled") {
          setAnnouncements(announcementsResult.value.slice(0, 4));
          setAnnouncementLoadError("");
        } else {
          console.error("Error fetching announcements:", announcementsResult.reason);
          setAnnouncementLoadError("Announcements unavailable.");
          setAnnouncements([]);
        }

        let pendingLeaves = 0;
        let annualLeaveBalance = 14;
        let sickLeaveBalance = 14;

        if (leaveResult.status === "fulfilled") {
          const leaves = leaveResult.value as any[];
          
          pendingLeaves = leaves.filter((l) => l.status === "pending").length;

          // Calculate working days for approved leaves
          const calculateDays = (start: string, end: string) => {
            let count = 0;
            let current = new Date(start);
            const endDate = new Date(end);
            while (current <= endDate) {
              const day = current.getDay();
              if (day !== 0 && day !== 6) count++;
              current.setDate(current.getDate() + 1);
            }
            return count;
          };

          const approvedLeaves = leaves.filter((l) => l.status === "approved");
          let annualUsed = 0;
          let sickUsed = 0;

          approvedLeaves.forEach((l) => {
            const days = calculateDays(l.startDate, l.endDate);
            if (l.leaveType === "annual") annualUsed += days;
            if (l.leaveType === "sick") sickUsed += days;
          });

          annualLeaveBalance = Math.max(0, 14 - annualUsed);
          sickLeaveBalance = Math.max(0, 14 - sickUsed);
        }

        // Attendance Calculations
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let presentDays = 0;
        let totalWorkedHours = 0;
        let totalOvertimeHours = 0;
        
        const currentMonthRecords = allAttendance.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        });

        currentMonthRecords.forEach((record) => {
          if (record.status === "present") presentDays++;
          
          if (record.checkInTime && record.checkOutTime) {
            const checkIn = new Date(record.checkInTime);
            const checkOut = new Date(record.checkOutTime);
            const diffMs = checkOut.getTime() - checkIn.getTime();
            const hours = diffMs / (1000 * 60 * 60);
            
            if (hours > 0) {
              if (hours > 8) {
                totalWorkedHours += 8;
                totalOvertimeHours += (hours - 8);
              } else {
                totalWorkedHours += hours;
              }
            }
          }
        });

        const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        let expectedWorkingDays = 0;
        for (let i = 1; i <= Math.min(totalDaysInMonth, now.getDate()); i++) {
          const d = new Date(currentYear, currentMonth, i);
          if (d.getDay() !== 0 && d.getDay() !== 6) expectedWorkingDays++;
        }

        const attendancePercent = expectedWorkingDays > 0 
          ? Math.round((presentDays / expectedWorkingDays) * 100) 
          : 100;

        setEmployeeMetrics({
          attendancePercent: Math.min(100, attendancePercent),
          workedHours: Math.round(totalWorkedHours + totalOvertimeHours),
          regularHours: Math.round(totalWorkedHours),
          overtimeHours: Math.round(totalOvertimeHours),
          pendingLeaves,
          annualLeaveBalance,
          sickLeaveBalance,
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

  const profileName = user?.fullName || user?.email || "Employee";
  const attendancePercent = employeeMetrics?.attendancePercent || 0;
  const workedHours = employeeMetrics?.workedHours || 0;
  const regularHours = employeeMetrics?.regularHours || 0;
  const overtimeHours = employeeMetrics?.overtimeHours || 0;
  const initials = (user?.fullName || "Employee")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const recentActivity = recentAttendance.map((record) => {
    const checkedIn = new Date(record.checkInTime);
    const checkedOut = record.checkOutTime
      ? new Date(record.checkOutTime)
      : null;

    return {
      id: `${record.id || record.date}-${record.checkInTime}`,
      title: checkedOut ? "Checked Out (Office)" : "Checked In (Office)",
      subtitle: checkedOut
        ? `${checkedOut.toLocaleDateString()} • ${checkedOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : `${checkedIn.toLocaleDateString()} • ${checkedIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      tone: checkedOut ? "amber" : "emerald",
    };
  });

  if (recentActivity.length === 0) {
    recentActivity.push(
      {
        id: "default-1",
        title: "No recent check-ins",
        subtitle: "Your attendance activity will appear here",
        tone: "slate",
      },
      {
        id: "default-2",
        title: "Leave Request Approved",
        subtitle: "Annual leave approved for next week",
        tone: "violet",
      },
    );
  }

  const announcementTypeLabel: Record<Announcement["type"], string> = {
    timing_change: "Timing Change",
    policy_update: "Policy Update",
    general: "General",
    company_change: "Company Change",
  };

  const announcementPriorityTone: Record<Announcement["priority"], string> = {
    high: "rose",
    medium: "amber",
    low: "indigo",
  };

  return (
    <div className="relative min-h-full overflow-x-hidden bg-[#f5f7fb] p-4 md:p-6 lg:p-8">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');`}</style>

      <div className="pointer-events-none absolute -top-24 -right-25 h-72 w-72 rounded-full bg-linear-to-br from-blue-200/45 to-cyan-100/0 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-30 h-72 w-72 rounded-full bg-linear-to-br from-orange-200/35 to-amber-100/0 blur-3xl" />

      <div className="relative mx-auto max-w-7xl font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
            Employee Dashboard
          </h1>
          <div className="text-right">
            <p className="text-base font-bold text-slate-700">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm font-medium text-slate-500">
              {new Date().toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_-20px_rgba(15,23,42,0.55)]">
          <div className="h-1 w-full bg-linear-to-r from-indigo-500 via-violet-500 to-orange-400" />
          <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="flex items-center gap-4">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={profileName}
                  className="h-16 w-16 rounded-full border-4 border-indigo-100 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-indigo-100 bg-linear-to-br from-indigo-500 to-violet-500 text-xl font-bold text-white">
                  {initials || "E"}
                </div>
              )}

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-indigo-500">
                  Welcome Back
                </p>
                <h2 className="mt-0.5 text-3xl font-extrabold text-slate-900">
                  {profileName}
                </h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-500">
                  <span>
                    ID:{" "}
                    {user?.uid
                      ? user.uid.slice(0, 8).toUpperCase()
                      : "EMP-123456"}
                  </span>
                  <span>{user?.position || "Software Engineer"}</span>
                  <span>{user?.department || "Engineering Dept"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/employee/attendance"
                className="inline-flex items-center rounded-xl bg-linear-to-r from-indigo-500 via-violet-500 to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-[0_10px_20px_-12px_rgba(79,70,229,0.8)] transition-transform hover:-translate-y-0.5"
              >
                Check In
              </Link>
              <Link
                href="/employee/projects"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Remote Work
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-600">
                  Attendance (Month)
                </p>
                <p className="mt-3 text-5xl font-extrabold tracking-tight text-slate-900">
                  {attendancePercent}%
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                +2% vs last
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-500">Target: 95%</p>
            <div className="mt-3 h-2.5 rounded-full bg-slate-100">
              <div className="h-2.5 w-[98%] rounded-full bg-linear-to-r from-blue-500 to-indigo-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-600">
                  Remaining Leave
                </p>
                <p className="mt-3 text-5xl font-extrabold tracking-tight text-slate-900">
                  {employeeMetrics?.annualLeaveBalance || 0}
                </p>
                <p className="text-sm font-semibold text-slate-500">Days</p>
              </div>
              <Link
                href="/employee/leave"
                className="rounded-full bg-violet-100 px-3 py-1 text-xs font-extrabold text-violet-700"
              >
                Apply
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-slate-500">
              <span>Annual: {employeeMetrics?.annualLeaveBalance || 0}</span>
              <span>Sick: {employeeMetrics?.sickLeaveBalance || 0}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-1">
            <p className="text-sm font-bold text-slate-600">Hours Worked</p>
            <p className="mt-3 text-5xl font-extrabold tracking-tight text-slate-900">
              {workedHours}
            </p>
            <p className="text-sm font-semibold text-slate-500">
              Hrs this month
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-semibold text-slate-500">
              <span>Regular: {regularHours}</span>
              <span>Overtime: {overtimeHours}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                Recent Activity
              </h3>
              <Link
                href="/employee/attendance"
                className="text-sm font-extrabold text-indigo-600 hover:text-indigo-700"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4 px-5 py-4">
              {recentActivity.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-9 w-9 shrink-0 rounded-full ${
                      activity.tone === "emerald"
                        ? "bg-emerald-100"
                        : activity.tone === "amber"
                          ? "bg-amber-100"
                          : activity.tone === "violet"
                            ? "bg-violet-100"
                            : "bg-slate-100"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {activity.title}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {activity.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-extrabold text-slate-900">
                Announcements
              </h3>
            </div>
            <div className="space-y-3 px-5 py-4">
              {announcementLoadError ? (
                <article className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
                  <h4 className="text-base font-extrabold text-rose-700">
                    Unable to load announcements
                  </h4>
                  <p className="mt-1 text-sm font-medium leading-6 text-rose-600">
                    {announcementLoadError}
                  </p>
                </article>
              ) : announcements.length === 0 ? (
                <article className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <h4 className="text-base font-extrabold text-slate-900">
                    No announcements yet
                  </h4>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                    Company updates from admins will appear here.
                  </p>
                </article>
              ) : (
                announcements.map((announcement) => {
                  const tone = announcementPriorityTone[announcement.priority];
                  return (
                    <article
                      key={announcement.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                            tone === "rose"
                              ? "bg-rose-100 text-rose-700"
                              : tone === "amber"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {announcementTypeLabel[announcement.type]} •{" "}
                          {announcement.priority}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(announcement.startDate).toLocaleDateString(
                            [],
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900">
                        {announcement.title}
                      </h4>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                        {announcement.detail}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
