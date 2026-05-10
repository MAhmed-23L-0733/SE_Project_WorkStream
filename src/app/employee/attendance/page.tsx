"use client";

import { useState, useEffect } from "react";
import { GeoCheckIn } from "@/components/attendance/GeoCheckIn";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { AttendanceRecord } from "@/types";

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      if (user?.uid) {
        const attendance = await firebaseHelpers.getAttendanceRecords(user.uid);
        // Sort newest first
        const sorted = (attendance as AttendanceRecord[]).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecords(sorted);
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user?.uid]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return "-";
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .att-page {
          padding: 2rem;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          max-width: 1200px;
          margin: 0 auto;
        }

        .att-header-section {
          margin-bottom: 2rem;
        }

        .att-header-section h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.01em;
        }

        .att-header-section p {
          color: #64748b;
          margin: 0;
          font-size: 0.95rem;
        }

        .att-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .att-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Card Styles Shared with GeoCheckIn Component */
        .att-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          overflow: hidden;
        }

        .att-card.top-bordered {
          border-top: 4px solid #3b82f6;
        }

        .att-card-header {
          padding: 1.5rem 1.5rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .att-card-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .att-card-body {
          padding: 1.5rem;
        }

        /* GeoCheckIn specific styles */
        .att-status-box {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .att-status-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .att-status-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0f172a;
        }

        .att-btn-primary {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 0.875rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }

        .att-btn-primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
        }

        .att-btn-warning {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          padding: 0.875rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
        }

        .att-btn-warning:hover {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          transform: translateY(-1px);
        }

        .att-status-complete {
          width: 100%;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 0.875rem;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
        }

        .att-confirm-wrap {
          animation: fadein 0.2s ease-in-out;
        }

        @keyframes fadein {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .att-confirm-msg {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #92400e;
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
          margin: 0 0 1rem 0;
        }

        .att-btn-row {
          display: flex;
          gap: 0.5rem;
        }

        .att-btn-secondary {
          flex: 1;
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .att-btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .att-btn {
          flex: 1;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .att-btn.success {
          background: #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }

        .att-btn.success:hover:not(:disabled) {
          background: #059669;
        }

        .att-btn.danger {
          background: #ef4444;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        }

        .att-btn.danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .att-btn.disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Table Styles */
        .att-table-wrap {
          overflow-x: auto;
        }

        .att-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .att-table th {
          padding: 1rem 1.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
          background: #f8fafc;
        }

        .att-table td {
          padding: 1.25rem 1.5rem;
          font-size: 0.9rem;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .att-table tr:last-child td {
          border-bottom: none;
        }

        .att-td-date {
          font-weight: 600;
          color: #1e293b;
        }
        
        .att-td-time {
          color: #475569;
          font-family: monospace;
          font-size: 0.95rem;
        }

        .att-status {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .att-status.present {
          background-color: #dcfce7;
          color: #166534;
        }

        .att-status.late {
          background-color: #fef3c7;
          color: #92400e;
        }

        .att-status.absent {
          background-color: #fee2e2;
          color: #b91c1c;
        }

        .att-loading {
          text-align: center;
          padding: 3rem;
          color: #64748b;
          font-weight: 500;
        }
      `}</style>

      <div className="att-page">
        <div className="att-header-section">
          <h1>Attendance</h1>
          <p>Track your daily check-ins and check-outs.</p>
        </div>

        <div className="att-grid">
          <div>
            <GeoCheckIn onSuccess={fetchAttendance} />
          </div>

          <div className="att-card">
            <div className="att-card-header" style={{ paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <h2>Attendance History</h2>
            </div>
            <div className="att-table-wrap">
              <table className="att-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="att-loading">Loading records...</div>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="att-loading">No attendance records found.</div>
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr key={record.id}>
                        <td className="att-td-date">
                          {formatDate(record.date)}
                        </td>
                        <td className="att-td-time">
                          {formatTime(record.checkInTime)}
                        </td>
                        <td className="att-td-time">
                          {formatTime(record.checkOutTime)}
                        </td>
                        <td>
                          <span className={`att-status ${record.status.toLowerCase()}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}