"use client";

import { DashboardMetrics } from "@/types";

interface MetricsGridProps {
  metrics: DashboardMetrics;
  pendingLeaveCount?: number;
}

const TotalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const PresentIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

const AbsentIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const LeaveIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const AttendanceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

export const MetricsGrid = ({ metrics, pendingLeaveCount = 0 }: MetricsGridProps) => {
  const attendancePct = metrics.totalEmployees > 0
    ? Math.round((metrics.presentToday / metrics.totalEmployees) * 100)
    : 0;

  const cards = [
    {
      label: "Total Employees",
      value: metrics.totalEmployees,
      sub: "Active workforce",
      iconBg: "#eef0ff",
      iconColor: "#6366f1",
      Icon: TotalIcon,
      accent: "#6366f1",
      progress: null,
    },
    {
      label: "Present Today",
      value: metrics.presentToday,
      sub: `${attendancePct}% attendance rate`,
      iconBg: "#ecfdf5",
      iconColor: "#10b981",
      Icon: PresentIcon,
      accent: "#10b981",
      progress: attendancePct,
    },
    {
      label: "Absent Today",
      value: metrics.absentToday,
      sub: metrics.totalEmployees > 0 ? `${Math.round((metrics.absentToday / metrics.totalEmployees) * 100)}% of workforce` : "—",
      iconBg: "#fff1f2",
      iconColor: "#ef4444",
      Icon: AbsentIcon,
      accent: "#ef4444",
      progress: null,
    },
    {
      label: "On Leave",
      value: metrics.onLeaveToday,
      sub: `${pendingLeaveCount} pending request${pendingLeaveCount !== 1 ? "s" : ""}`,
      iconBg: "#fffbeb",
      iconColor: "#f59e0b",
      Icon: LeaveIcon,
      accent: "#f59e0b",
      progress: null,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          font-family: 'Inter', sans-serif;
        }

        @media (max-width: 1024px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 560px) {
          .metrics-grid { grid-template-columns: 1fr; }
        }

        .metric-card {
          background: #ffffff;
          border-radius: 1rem;
          padding: 1.35rem 1.35rem 1.1rem;
          border: 1px solid #f0f2f8;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .metric-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }

        .metric-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .metric-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .metric-icon {
          width: 42px;
          height: 42px;
          border-radius: 0.625rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 0.35rem;
        }

        .metric-sub {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .metric-progress-bar {
          margin-top: 0.85rem;
          height: 5px;
          border-radius: 99px;
          background: #f1f5f9;
          overflow: hidden;
        }

        .metric-progress-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.6s ease;
        }
      `}</style>

      <div className="metrics-grid">
        {cards.map((card) => (
          <div key={card.label} className="metric-card">
            <div className="metric-top">
              <span className="metric-label">{card.label}</span>
              <div className="metric-icon" style={{ background: card.iconBg }}>
                <span style={{ color: card.iconColor }}><card.Icon /></span>
              </div>
            </div>
            <div className="metric-value">{card.value}</div>
            <div className="metric-sub">{card.sub}</div>
            {card.progress !== null && (
              <div className="metric-progress-bar">
                <div
                  className="metric-progress-fill"
                  style={{ width: `${card.progress}%`, background: card.accent }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};
