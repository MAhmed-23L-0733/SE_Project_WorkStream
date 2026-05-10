"use client";

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

interface AdminInsightsChartsProps {
  attendanceTrend: AttendanceTrendPoint[];
  leaveDistribution: LeaveDistribution;
  departmentHeadcount: DepartmentHeadcount[];
}

export const AdminInsightsCharts = ({
  attendanceTrend,
  leaveDistribution,
  departmentHeadcount
}: AdminInsightsChartsProps) => {
  const maxDepartmentCount = Math.max(...departmentHeadcount.map((item) => item.count), 1);
  const leaveTotal =
    leaveDistribution.pending + leaveDistribution.approved + leaveDistribution.rejected;

  const pendingPct = leaveTotal > 0 ? (leaveDistribution.pending / leaveTotal) * 100 : 0;
  const approvedPct = leaveTotal > 0 ? (leaveDistribution.approved / leaveTotal) * 100 : 0;

  const chartPoints = attendanceTrend
    .map((point, index) => {
      const x = (index / Math.max(attendanceTrend.length - 1, 1)) * 300 + 10;
      const y = 120 - (point.attendanceRate / 100) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">7-Day Attendance Trend</h2>
            <p className="text-sm text-slate-500">Present and late check-ins as % of total staff</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Last 7 Days
          </span>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <svg viewBox="0 0 320 140" className="h-44 w-full" role="img" aria-label="attendance trend chart">
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="10" y1="120" x2="310" y2="120" stroke="#CBD5E1" strokeWidth="1" />
            <polyline fill="none" stroke="#3B82F6" strokeWidth="3" points={chartPoints} />
            {chartPoints && (
              <polygon
                points={`${chartPoints} 310,120 10,120`}
                fill="url(#trendFill)"
              />
            )}
            {attendanceTrend.map((point, index) => {
              const x = (index / Math.max(attendanceTrend.length - 1, 1)) * 300 + 10;
              const y = 120 - (point.attendanceRate / 100) * 100;
              return (
                <circle key={point.key} cx={x} cy={y} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              );
            })}
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {attendanceTrend.map((point) => (
            <div key={point.key} className="rounded-md bg-slate-50 px-2 py-2 text-center">
              <p className="text-xs font-medium text-slate-500">{point.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{Math.round(point.attendanceRate)}%</p>
              <p className="text-[11px] text-slate-500">{point.presentCount} present</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Leave Status Mix</h2>
        <p className="mt-1 text-sm text-slate-500">Distribution of all leave requests</p>

        <div className="mt-5 flex items-center justify-center">
          <div
            className="relative h-40 w-40 rounded-full"
            style={{
              background: `conic-gradient(#f59e0b 0% ${pendingPct}%, #10b981 ${pendingPct}% ${pendingPct + approvedPct}%, #ef4444 ${pendingPct + approvedPct}% 100%)`
            }}
          >
            <div className="absolute inset-5 flex items-center justify-center rounded-full bg-white text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{leaveTotal}</p>
                <p className="text-xs text-slate-500">Total Requests</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2">
            <span className="font-medium text-amber-800">Pending</span>
            <span className="font-bold text-amber-900">{leaveDistribution.pending}</span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2">
            <span className="font-medium text-emerald-800">Approved</span>
            <span className="font-bold text-emerald-900">{leaveDistribution.approved}</span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2">
            <span className="font-medium text-red-800">Rejected</span>
            <span className="font-bold text-red-900">{leaveDistribution.rejected}</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
        <h2 className="text-xl font-semibold text-slate-900">Department Workforce</h2>
        <p className="mt-1 text-sm text-slate-500">Employee headcount by department</p>

        <div className="mt-5 space-y-3">
          {departmentHeadcount.length === 0 ? (
            <p className="text-sm text-slate-500">No department data yet.</p>
          ) : (
            departmentHeadcount.map((department) => (
              <div key={department.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{department.name}</span>
                  <span className="font-semibold text-slate-900">{department.count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                    style={{ width: `${(department.count / maxDepartmentCount) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
