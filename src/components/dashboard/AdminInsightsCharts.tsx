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

const DEPT_COLORS = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"
];

export const AdminInsightsCharts = ({
  attendanceTrend,
  leaveDistribution,
  departmentHeadcount,
}: AdminInsightsChartsProps) => {
  const maxDepartmentCount = Math.max(...departmentHeadcount.map((d) => d.count), 1);
  const leaveTotal = leaveDistribution.pending + leaveDistribution.approved + leaveDistribution.rejected;

  const pendingPct = leaveTotal > 0 ? (leaveDistribution.pending / leaveTotal) * 100 : 0;
  const approvedPct = leaveTotal > 0 ? (leaveDistribution.approved / leaveTotal) * 100 : 0;

  const chartPoints = attendanceTrend
    .map((point, index) => {
      const x = (index / Math.max(attendanceTrend.length - 1, 1)) * 300 + 10;
      const y = 110 - (point.attendanceRate / 100) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  const maxRate = Math.max(...attendanceTrend.map((p) => p.attendanceRate), 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.25rem;
          margin-top: 1.5rem;
          font-family: 'Inter', sans-serif;
        }

        @media (max-width: 1100px) {
          .charts-grid { grid-template-columns: 1fr 1fr; }
          .chart-trend { grid-column: 1 / -1; }
        }

        @media (max-width: 640px) {
          .charts-grid { grid-template-columns: 1fr; }
          .chart-trend { grid-column: auto; }
        }

        .chart-card {
          background: #ffffff;
          border-radius: 1rem;
          border: 1px solid #f0f2f8;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          padding: 1.35rem;
          overflow: hidden;
        }

        .chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.1rem;
        }

        .chart-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
        }

        .chart-subtitle {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 2px;
        }

        .chart-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.25rem 0.65rem;
          border-radius: 99px;
          background: #eef0ff;
          color: #6366f1;
          white-space: nowrap;
        }

        /* -- Attendance Trend -- */
        .trend-svg-wrap {
          background: #f8fafc;
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem 0.25rem;
          overflow: hidden;
        }

        .trend-days {
          display: grid;
          gap: 0.25rem;
          margin-top: 0.75rem;
        }

        .trend-day-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .trend-day-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748b;
          width: 28px;
          flex-shrink: 0;
        }

        .trend-day-bar-wrap {
          flex: 1;
          height: 6px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
        }

        .trend-day-bar {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          transition: width 0.5s ease;
        }

        .trend-day-pct {
          font-size: 0.72rem;
          font-weight: 700;
          color: #475569;
          width: 32px;
          text-align: right;
          flex-shrink: 0;
        }

        /* -- Leave Donut -- */
        .donut-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0.5rem 0 1rem;
        }

        .donut-ring {
          position: relative;
        }

        .donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .donut-center-num {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }

        .donut-center-label {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 500;
          margin-top: 2px;
        }

        .leave-legend {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .leave-legend-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.55rem 0.75rem;
          border-radius: 0.5rem;
        }

        .leave-legend-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .leave-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .leave-legend-name {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .leave-legend-count {
          font-size: 0.875rem;
          font-weight: 800;
        }

        /* -- Department -- */
        .dept-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-top: 0.25rem;
        }

        .dept-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.3rem;
        }

        .dept-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
        }

        .dept-count {
          font-size: 0.8rem;
          font-weight: 700;
          color: #0f172a;
        }

        .dept-bar-wrap {
          height: 7px;
          background: #f1f5f9;
          border-radius: 99px;
          overflow: hidden;
        }

        .dept-bar {
          height: 100%;
          border-radius: 99px;
          transition: width 0.5s ease;
        }
      `}</style>

      <div className="charts-grid">
        {/* ---- Attendance Trend ---- */}
        <div className="chart-card chart-trend" style={{ gridColumn: "1 / 3" }}>
          <div className="chart-header">
            <div>
              <p className="chart-title">7-Day Attendance Trend</p>
              <p className="chart-subtitle">Present + late check-ins as % of total staff</p>
            </div>
            <span className="chart-badge">Last 7 Days</span>
          </div>

          <div className="trend-svg-wrap">
            <svg viewBox="0 0 320 130" style={{ width: "100%", height: "160px" }} aria-label="attendance trend">
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((pct) => {
                const y = 110 - (pct / 100) * 90;
                return (
                  <g key={pct}>
                    <line x1="10" y1={y} x2="310" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
                    <text x="6" y={y + 4} fontSize="8" fill="#94a3b8" textAnchor="end">{pct}%</text>
                  </g>
                );
              })}
              {/* Area fill */}
              {chartPoints && (
                <polygon
                  points={`${chartPoints} 310,110 10,110`}
                  fill="url(#trendGrad)"
                />
              )}
              {/* Line */}
              <polyline
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={chartPoints}
              />
              {/* Dots */}
              {attendanceTrend.map((point, index) => {
                const x = (index / Math.max(attendanceTrend.length - 1, 1)) * 300 + 10;
                const y = 110 - (point.attendanceRate / 100) * 90;
                return (
                  <g key={point.key}>
                    <circle cx={x} cy={y} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                    <text x={x} y={y - 10} fontSize="8" fill="#6366f1" textAnchor="middle" fontWeight="700">
                      {Math.round(point.attendanceRate)}%
                    </text>
                  </g>
                );
              })}
              {/* Day labels */}
              {attendanceTrend.map((point, index) => {
                const x = (index / Math.max(attendanceTrend.length - 1, 1)) * 300 + 10;
                return (
                  <text key={`lbl-${point.key}`} x={x} y={126} fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="600">
                    {point.label}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="trend-days" style={{ gridTemplateColumns: `repeat(${attendanceTrend.length}, 1fr)` }}>
            {attendanceTrend.map((point) => (
              <div key={point.key} className="trend-day-item">
                <span className="trend-day-label">{point.label}</span>
                <div className="trend-day-bar-wrap">
                  <div
                    className="trend-day-bar"
                    style={{ width: `${maxRate > 0 ? (point.attendanceRate / maxRate) * 100 : 0}%` }}
                  />
                </div>
                <span className="trend-day-pct">{Math.round(point.attendanceRate)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Leave Distribution ---- */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <p className="chart-title">Leave Status</p>
              <p className="chart-subtitle">All leave requests breakdown</p>
            </div>
          </div>

          <div className="donut-wrap">
            <div className="donut-ring" style={{ width: 120, height: 120 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="44" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                {leaveTotal > 0 && (
                  <>
                    <circle
                      cx="60" cy="60" r="44"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="16"
                      strokeDasharray={`${(pendingPct / 100) * 276.5} 276.5`}
                      strokeDashoffset="69"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="60" cy="60" r="44"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="16"
                      strokeDasharray={`${(approvedPct / 100) * 276.5} 276.5`}
                      strokeDashoffset={`${69 - (pendingPct / 100) * 276.5}`}
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
              <div className="donut-center">
                <span className="donut-center-num">{leaveTotal}</span>
                <span className="donut-center-label">Total</span>
              </div>
            </div>
          </div>

          <div className="leave-legend">
            <div className="leave-legend-item" style={{ background: "#fffbeb" }}>
              <div className="leave-legend-left">
                <span className="leave-dot" style={{ background: "#f59e0b" }} />
                <span className="leave-legend-name" style={{ color: "#92400e" }}>Pending</span>
              </div>
              <span className="leave-legend-count" style={{ color: "#78350f" }}>{leaveDistribution.pending}</span>
            </div>
            <div className="leave-legend-item" style={{ background: "#ecfdf5" }}>
              <div className="leave-legend-left">
                <span className="leave-dot" style={{ background: "#10b981" }} />
                <span className="leave-legend-name" style={{ color: "#065f46" }}>Approved</span>
              </div>
              <span className="leave-legend-count" style={{ color: "#064e3b" }}>{leaveDistribution.approved}</span>
            </div>
            <div className="leave-legend-item" style={{ background: "#fff1f2" }}>
              <div className="leave-legend-left">
                <span className="leave-dot" style={{ background: "#ef4444" }} />
                <span className="leave-legend-name" style={{ color: "#991b1b" }}>Rejected</span>
              </div>
              <span className="leave-legend-count" style={{ color: "#7f1d1d" }}>{leaveDistribution.rejected}</span>
            </div>
          </div>
        </div>

        {/* ---- Department Workforce ---- */}
        <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
          <div className="chart-header">
            <div>
              <p className="chart-title">Department Workforce</p>
              <p className="chart-subtitle">Employee headcount by department</p>
            </div>
          </div>

          {departmentHeadcount.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No department data yet.</p>
          ) : (
            <div className="dept-list">
              {departmentHeadcount.map((dept, i) => (
                <div key={dept.name}>
                  <div className="dept-item-header">
                    <span className="dept-name">{dept.name}</span>
                    <span className="dept-count">{dept.count} employees</span>
                  </div>
                  <div className="dept-bar-wrap">
                    <div
                      className="dept-bar"
                      style={{
                        width: `${(dept.count / maxDepartmentCount) * 100}%`,
                        background: DEPT_COLORS[i % DEPT_COLORS.length],
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
