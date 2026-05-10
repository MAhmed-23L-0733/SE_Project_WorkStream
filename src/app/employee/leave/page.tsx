"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { LeaveRequest, LeaveType, LeaveStatus } from "@/types";
import { Search, Send, Calendar, ChevronDown } from "lucide-react";

export default function LeavePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    leaveType: "",
    reason: ""
  });

  const fetchLeaveRequests = async () => {
    try {
      if (user?.uid) {
        const leaveRequests = await firebaseHelpers.getLeaveRequests(user.uid);
        setRequests(leaveRequests as LeaveRequest[]);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.leaveType || !formData.startDate || !formData.endDate) {
      alert("Please fill all required fields");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert("End date cannot be before start date");
      return;
    }

    try {
      const leaveData: LeaveRequest = {
        userId: user.uid,
        userName: user.fullName || user.email || "Unknown",
        startDate: formData.startDate,
        endDate: formData.endDate,
        leaveType: formData.leaveType as LeaveType,
        reason: formData.reason,
        status: LeaveStatus.PENDING,
      };

      await firebaseHelpers.createLeaveRequest(leaveData);
      setFormData({ startDate: "", endDate: "", leaveType: "", reason: "" });
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error creating leave request:", error);
      alert("Failed to submit request.");
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit' };
    const yearOptions: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Check if same exact date
    if (start === end) {
      return startDate.toLocaleDateString('en-US', yearOptions);
    }
    
    // Check if they are in the same year
    if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', yearOptions)}`;
    }
    
    return `${startDate.toLocaleDateString('en-US', yearOptions)} - ${endDate.toLocaleDateString('en-US', yearOptions)}`;
  };

  const leaveTypeLabel: Record<string, string> = {
    [LeaveType.CASUAL]: "Casual Leave",
    [LeaveType.SICK]: "Sick Leave",
    [LeaveType.ANNUAL]: "Annual Leave",
    [LeaveType.UNPAID]: "Personal Leave", // Mapped from UI mockup
  };

  const filteredRequests = requests.filter(req => 
    leaveTypeLabel[req.leaveType]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.adminRemarks || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .lm-page {
          padding: 2rem;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          max-width: 1200px;
          margin: 0 auto;
        }

        .lm-header {
          margin-bottom: 2rem;
        }

        .lm-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.01em;
        }

        .lm-header p {
          color: #64748b;
          margin: 0;
          font-size: 0.95rem;
        }

        .lm-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .lm-card.top-bordered {
          border-top: 4px solid #3b82f6;
        }

        .lm-card-header {
          padding: 1.5rem 1.5rem 0;
        }

        .lm-card-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .lm-card-body {
          padding: 1.5rem;
        }

        .lm-form-row {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.25rem;
        }

        .lm-form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .lm-form-group.full {
          width: 100%;
        }

        .lm-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .lm-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .lm-input, .lm-select, .lm-textarea {
          width: 100%;
          padding: 0.625rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #334155;
          outline: none;
          transition: all 0.2s;
          background: #fff;
          font-family: inherit;
        }

        .lm-select {
          appearance: none;
          padding-right: 2.5rem;
          color: #64748b;
        }
        
        .lm-select.has-value {
          color: #334155;
        }

        .lm-input:focus, .lm-select:focus, .lm-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .lm-input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }

        .lm-icon {
          position: absolute;
          right: 1rem;
          color: #94a3b8;
          pointer-events: none;
        }

        .lm-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .lm-submit-wrap {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .lm-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #7c3aed; /* Purple-ish button from screenshot */
          color: white;
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .lm-btn:hover {
          background: #6d28d9;
        }

        .lm-table-wrap {
          overflow-x: auto;
        }

        .lm-table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .lm-table-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
        }

        .lm-search {
          position: relative;
          width: 250px;
        }

        .lm-search input {
          width: 100%;
          padding: 0.5rem 1rem 0.5rem 2.25rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.875rem;
          outline: none;
          background: #f8fafc;
        }

        .lm-search input:focus {
          border-color: #cbd5e1;
          background: #fff;
        }

        .lm-search .icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          width: 16px;
          height: 16px;
        }

        .lm-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .lm-table th {
          padding: 1rem 1.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
          background: #f8fafc;
        }

        .lm-table td {
          padding: 1.25rem 1.5rem;
          font-size: 0.9rem;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .lm-table tr:last-child td {
          border-bottom: none;
        }

        .lm-td-date {
          font-weight: 600;
          color: #1e293b;
        }
        
        .lm-td-type {
          color: #475569;
        }

        .lm-status {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .lm-status.approved {
          background-color: #dcfce7;
          color: #166534;
        }

        .lm-status.pending {
          background-color: #fef3c7;
          color: #92400e;
        }

        .lm-status.rejected {
          background-color: #fee2e2;
          color: #b91c1c;
        }

        .lm-remarks {
          color: #64748b;
          font-size: 0.875rem;
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 768px) {
          .lm-form-row {
            flex-direction: column;
            gap: 1rem;
          }
          .lm-table-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          .lm-search {
            width: 100%;
          }
        }
      `}</style>

      <div className="lm-page">
        <div className="lm-header">
          <h1>Leave Management</h1>
          <p>Submit new requests and view your leave history below.</p>
        </div>

        <div className="lm-card top-bordered">
          <div className="lm-card-header">
            <h2>Submit New Leave Request</h2>
          </div>
          <div className="lm-card-body">
            <form onSubmit={handleSubmit}>
              <div className="lm-form-row">
                <div className="lm-form-group full">
                  <label className="lm-label">Leave Type</label>
                  <div className="lm-input-wrap">
                    <select 
                      className={`lm-select ${formData.leaveType ? 'has-value' : ''}`}
                      value={formData.leaveType}
                      onChange={(e) => setFormData({...formData, leaveType: e.target.value})}
                      required
                    >
                      <option value="" disabled>Select leave type</option>
                      <option value={LeaveType.SICK}>Sick Leave</option>
                      <option value={LeaveType.ANNUAL}>Annual Leave</option>
                      <option value={LeaveType.CASUAL}>Casual Leave</option>
                      <option value={LeaveType.UNPAID}>Personal Leave</option>
                    </select>
                    <ChevronDown className="lm-icon" size={18} />
                  </div>
                </div>
              </div>

              <div className="lm-form-row">
                <div className="lm-form-group">
                  <label className="lm-label">Start Date</label>
                  <div className="lm-input-wrap">
                    <input 
                      type="date" 
                      className="lm-input"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      required
                    />
                    <Calendar className="lm-icon" size={18} />
                  </div>
                </div>
                <div className="lm-form-group">
                  <label className="lm-label">End Date</label>
                  <div className="lm-input-wrap">
                    <input 
                      type="date" 
                      className="lm-input"
                      value={formData.endDate}
                      min={formData.startDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      required
                    />
                    <Calendar className="lm-icon" size={18} />
                  </div>
                </div>
              </div>

              <div className="lm-form-row">
                <div className="lm-form-group full">
                  <label className="lm-label">Reason (Optional)</label>
                  <textarea 
                    className="lm-textarea"
                    placeholder="Briefly describe your reason for taking leave..."
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
                </div>
              </div>

              <div className="lm-submit-wrap">
                <button type="submit" className="lm-btn">
                  <Send size={16} />
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lm-card">
          <div className="lm-table-header">
            <h2>My Leave History</h2>
            <div className="lm-search">
              <Search className="icon" />
              <input 
                type="text" 
                placeholder="Filter history..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="lm-table-wrap">
            <table className="lm-table">
              <thead>
                <tr>
                  <th>Date Range</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>Loading...</td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>No leave requests found.</td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="lm-td-date">
                        {formatDateRange(req.startDate, req.endDate)}
                      </td>
                      <td className="lm-td-type">
                        {leaveTypeLabel[req.leaveType] || req.leaveType}
                      </td>
                      <td>
                        <span className={`lm-status ${req.status.toLowerCase()}`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="lm-remarks" title={req.adminRemarks || "-"}>
                          {req.adminRemarks || "-"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}