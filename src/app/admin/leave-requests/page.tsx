"use client";

import { useState, useEffect } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { LeaveRequest, LeaveStatus } from "@/types";
import { where } from "firebase/firestore";

const S = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; }
.lr-root { padding: 1.75rem 2rem; background: #f5f7ff; min-height: 100vh; font-family: 'Inter', sans-serif; }
.lr-topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem; }
.lr-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0; }
.lr-subtitle { font-size: 0.875rem; color: #64748b; margin: 0.25rem 0 0; }
.lr-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
@media (max-width: 900px) { .lr-stats { grid-template-columns: repeat(2,1fr); } }
.lr-stat { background: #fff; border-radius: 1rem; padding: 1.1rem 1.25rem; border: 1px solid #f0f2f8; box-shadow: 0 2px 12px rgba(0,0,0,.04); }
.lr-stat-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin-bottom: .35rem; }
.lr-stat-value { font-size: 1.75rem; font-weight: 800; line-height: 1; }
.lr-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; background: #fff; padding: .5rem; border-radius: 1rem; border: 1px solid #f0f2f8; box-shadow: 0 2px 12px rgba(0,0,0,.04); width: fit-content; }
.lr-tab { padding: .5rem 1.1rem; border-radius: .65rem; font-size: .85rem; font-weight: 600; border: none; cursor: pointer; transition: all .2s; font-family: 'Inter', sans-serif; background: transparent; color: #64748b; }
.lr-tab.active-all { background: #eef0ff; color: #6366f1; }
.lr-tab.active-pending { background: #fffbeb; color: #f59e0b; }
.lr-tab.active-approved { background: #ecfdf5; color: #10b981; }
.lr-tab.active-rejected { background: #fff1f2; color: #ef4444; }
.lr-tab:hover:not([class*="active"]) { background: #f8fafc; color: #475569; }
.lr-tab-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: .4rem; vertical-align: middle; }
.lr-card-list { display: flex; flex-direction: column; gap: 1rem; }
.lr-card { background: #fff; border-radius: 1rem; border: 1px solid #f0f2f8; box-shadow: 0 2px 12px rgba(0,0,0,.04); padding: 1.35rem 1.5rem; display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; transition: box-shadow .2s; }
.lr-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.07); }
.lr-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
.lr-info { display: flex; flex-direction: column; gap: .2rem; min-width: 0; }
.lr-name { font-size: .975rem; font-weight: 700; color: #0f172a; }
.lr-meta-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: .3rem; }
.lr-meta-item { display: flex; align-items: center; gap: .35rem; font-size: .78rem; color: #64748b; font-weight: 500; }
.lr-reason { font-size: .78rem; color: #94a3b8; margin-top: .25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px; }
.lr-right { display: flex; flex-direction: column; align-items: flex-end; gap: .75rem; flex-shrink: 0; }
.lr-badge { padding: .3rem .75rem; border-radius: 99px; font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
.lr-actions { display: flex; gap: .5rem; }
.lr-btn-approve { padding: .45rem .9rem; background: #ecfdf5; color: #10b981; border: 1.5px solid #a7f3d0; border-radius: .6rem; font-size: .78rem; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: all .2s; }
.lr-btn-approve:hover { background: #10b981; color: #fff; border-color: #10b981; }
.lr-btn-reject { padding: .45rem .9rem; background: #fff1f2; color: #ef4444; border: 1.5px solid #fecdd3; border-radius: .6rem; font-size: .78rem; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: all .2s; }
.lr-btn-reject:hover { background: #ef4444; color: #fff; border-color: #ef4444; }
.lr-empty { text-align: center; padding: 3.5rem; background: #fff; border-radius: 1.25rem; border: 1px solid #f0f2f8; box-shadow: 0 2px 12px rgba(0,0,0,.04); color: #94a3b8; }
.lr-spinner { width: 40px; height: 40px; border: 3px solid #eef0ff; border-top-color: #6366f1; border-radius: 50%; animation: spin .7s linear infinite; margin: 4rem auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.lr-leave-type { display: inline-block; padding: .2rem .55rem; border-radius: .4rem; font-size: .72rem; font-weight: 700; text-transform: capitalize; }
`;

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  casual:  { bg: "#eef0ff", color: "#6366f1" },
  sick:    { bg: "#fff1f2", color: "#f43f5e" },
  annual:  { bg: "#ecfdf5", color: "#10b981" },
  unpaid:  { bg: "#fff7ed", color: "#f97316" },
};

function getTypeStyle(type: string) {
  return TYPE_COLORS[type.toLowerCase()] || { bg: "#f1f5f9", color: "#64748b" };
}

function calcDays(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

const FILTER_TABS = [
  { key: "all",      label: "All",      dot: "#94a3b8", activeClass: "active-all" },
  { key: "pending",  label: "Pending",  dot: "#f59e0b", activeClass: "active-pending" },
  { key: "approved", label: "Approved", dot: "#10b981", activeClass: "active-approved" },
  { key: "rejected", label: "Rejected", dot: "#ef4444", activeClass: "active-rejected" },
];

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeaveStatus | "all">("all");

  // Fetch all once, filter client-side for instant tab switching
  useEffect(() => {
    firebaseHelpers.getAllLeaveRequests([])
      .then(r => {
        setAllRequests(r as LeaveRequest[]);
        setRequests(r as LeaveRequest[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (filter === "all") {
      setRequests(allRequests);
    } else {
      setRequests(allRequests.filter(r => r.status === filter));
    }
  }, [filter, allRequests]);

  const handleApprove = async (id: string) => {
    try {
      await firebaseHelpers.updateLeaveRequest(id, { status: LeaveStatus.APPROVED, approvalDate: new Date().toISOString() });
      setAllRequests(prev => prev.map(r => r.id === id ? { ...r, status: LeaveStatus.APPROVED } : r));
    } catch (e) { console.error(e); }
  };

  const handleReject = async (id: string) => {
    try {
      await firebaseHelpers.updateLeaveRequest(id, { status: LeaveStatus.REJECTED, approvalDate: new Date().toISOString() });
      setAllRequests(prev => prev.map(r => r.id === id ? { ...r, status: LeaveStatus.REJECTED } : r));
    } catch (e) { console.error(e); }
  };

  const pending  = allRequests.filter(r => r.status === LeaveStatus.PENDING).length;
  const approved = allRequests.filter(r => r.status === LeaveStatus.APPROVED).length;
  const rejected = allRequests.filter(r => r.status === LeaveStatus.REJECTED).length;

  return (
    <>
      <style>{S}</style>
      {loading ? (
        <div className="lr-root"><div className="lr-spinner" /></div>
      ) : (
        <div className="lr-root">
          {/* Header */}
          <div className="lr-topbar">
            <div>
              <h1 className="lr-title">Leave Requests</h1>
              <p className="lr-subtitle">Review, approve, and manage employee time-off requests</p>
            </div>
          </div>

          {/* Stats */}
          <div className="lr-stats">
            <div className="lr-stat">
              <div className="lr-stat-label">Total Requests</div>
              <div className="lr-stat-value" style={{ color: "#6366f1" }}>{allRequests.length}</div>
            </div>
            <div className="lr-stat">
              <div className="lr-stat-label">Pending Review</div>
              <div className="lr-stat-value" style={{ color: "#f59e0b" }}>{pending}</div>
            </div>
            <div className="lr-stat">
              <div className="lr-stat-label">Approved</div>
              <div className="lr-stat-value" style={{ color: "#10b981" }}>{approved}</div>
            </div>
            <div className="lr-stat">
              <div className="lr-stat-label">Rejected</div>
              <div className="lr-stat-value" style={{ color: "#ef4444" }}>{rejected}</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="lr-tabs">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                className={`lr-tab${filter === tab.key ? ` ${tab.activeClass}` : ""}`}
                onClick={() => setFilter(tab.key as LeaveStatus | "all")}
              >
                <span className="lr-tab-dot" style={{ background: tab.dot }} />
                {tab.label}
                {tab.key !== "all" && (
                  <span style={{ marginLeft: ".35rem", opacity: .7 }}>
                    ({tab.key === "pending" ? pending : tab.key === "approved" ? approved : rejected})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Request Cards */}
          {requests.length === 0 ? (
            <div className="lr-empty">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem" }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
              </svg>
              <p style={{ fontWeight: 600, fontSize: ".9rem" }}>No {filter === "all" ? "" : filter} requests found</p>
              <p style={{ fontSize: ".8rem", marginTop: ".35rem" }}>When employees submit leave requests, they will appear here.</p>
            </div>
          ) : (
            <div className="lr-card-list">
              {requests.map(req => {
                const isPending  = req.status === LeaveStatus.PENDING;
                const isApproved = req.status === LeaveStatus.APPROVED;
                const initials   = (req.userName || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                const days       = calcDays(req.startDate, req.endDate);
                const typeStyle  = getTypeStyle(req.leaveType);

                return (
                  <div key={req.id} className="lr-card">
                    {/* Avatar */}
                    <div className="lr-avatar">{initials}</div>

                    {/* Info */}
                    <div className="lr-info">
                      <div className="lr-name">{req.userName || "Unknown Employee"}</div>
                      <div className="lr-meta-row">
                        <span className="lr-leave-type" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                          {req.leaveType}
                        </span>
                        <span className="lr-meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
                          {new Date(req.startDate).toLocaleDateString([], { month: "short", day: "numeric" })} → {new Date(req.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="lr-meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {days} day{days !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {req.reason && <div className="lr-reason">💬 {req.reason}</div>}
                    </div>

                    {/* Right: badge + actions */}
                    <div className="lr-right">
                      <span
                        className="lr-badge"
                        style={{
                          background: isPending ? "#fffbeb" : isApproved ? "#ecfdf5" : "#fff1f2",
                          color:      isPending ? "#92400e" : isApproved ? "#065f46" : "#991b1b",
                        }}
                      >
                        {req.status}
                      </span>

                      {isPending && (
                        <div className="lr-actions">
                          <button className="lr-btn-approve" onClick={() => req.id && handleApprove(req.id)}>
                            ✓ Approve
                          </button>
                          <button className="lr-btn-reject" onClick={() => req.id && handleReject(req.id)}>
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
