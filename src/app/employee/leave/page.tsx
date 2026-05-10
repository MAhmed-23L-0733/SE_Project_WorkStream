"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { LeaveRequest, LeaveType, LeaveStatus } from "@/types";

export default function LeavePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Modal Confirmation States
  const [modalData, setModalData] = useState<{ title: string; message: string; actionText: string; onConfirm: () => void } | null>(null);
  const [countdown, setCountdown] = useState(5);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    leaveType: LeaveType.CASUAL,
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

  // Modal Countdown Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (modalData && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [modalData, countdown]);

  const calculateWorkingDays = (start: string, end: string) => {
    let count = 0;
    let currentDate = new Date(start);
    const endDate = new Date(end);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!user?.uid) return;

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setErrorMsg("End date cannot be before start date.");
      return;
    }

    const daysRequested = calculateWorkingDays(formData.startDate, formData.endDate);
    if (daysRequested === 0) {
      setErrorMsg("Selected date range contains no working days.");
      return;
    }

    const hasOverlap = requests.some((req) => {
      if (req.status !== LeaveStatus.APPROVED) return false;
      const existingStart = new Date(req.startDate);
      const existingEnd = new Date(req.endDate);
      const newStart = new Date(formData.startDate);
      const newEnd = new Date(formData.endDate);
      return newStart <= existingEnd && newEnd >= existingStart;
    });

    if (hasOverlap) {
      setErrorMsg("This request overlaps with an already approved leave.");
      return;
    }

    // Trigger the Custom Modal
    setCountdown(5);
    setModalData({
      title: "Confirm Leave Request",
      message: `You are requesting ${daysRequested} working day(s) of ${formData.leaveType} Leave. Once submitted, this will be sent to your admin for approval.`,
      actionText: "Submit Request",
      onConfirm: async () => {
        setModalData(null);
        await executeSubmit(daysRequested);
      }
    });
  };

  const executeSubmit = async (daysRequested: number) => {
    if (!user) {
      setErrorMsg("User not authenticated");
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
      setFormData({ startDate: "", endDate: "", leaveType: LeaveType.CASUAL, reason: "" });
      setShowForm(false);
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error creating leave request:", error);
      setErrorMsg("Failed to submit request.");
    }
  };

  const initiateCancel = (requestId: string) => {
    setCountdown(5);
    setModalData({
      title: "Cancel Leave Request",
      message: "Are you sure you want to withdraw this leave request? This action cannot be undone.",
      actionText: "Withdraw Request",
      onConfirm: async () => {
        setModalData(null);
        try {
          await firebaseHelpers.deleteLeaveRequest(requestId); 
          fetchLeaveRequests();
        } catch (error) {
          console.error("Error cancelling request:", error);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <div className="p-8 relative">
      {/* Custom Global Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{modalData.title}</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{modalData.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setModalData(null)} 
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Go Back
              </button>
              <button
                disabled={countdown > 0}
                onClick={modalData.onConfirm}
                className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-300 ${
                  countdown > 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                }`}
              >
                {countdown > 0 ? `Wait ${countdown}s` : modalData.actionText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Leave Requests</h1>
          <p className="text-slate-600 mt-2">Manage your leave applications</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors shadow-sm"
        >
          {showForm ? "Close Form" : "+ New Request"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Request Leave</h2>
          {errorMsg && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium">{errorMsg}</div>}
          <form onSubmit={handlePreSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input 
                  type="date" 
                  required 
                  min={today}
                  value={formData.startDate} 
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input 
                  type="date" 
                  required 
                  min={formData.startDate || today}
                  value={formData.endDate} 
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
              <select value={formData.leaveType} onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as LeaveType })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow cursor-pointer">
                <option value={LeaveType.CASUAL}>Casual Leave</option>
                <option value={LeaveType.SICK}>Sick Leave</option>
                <option value={LeaveType.ANNUAL}>Annual Leave</option>
                <option value={LeaveType.UNPAID}>Unpaid Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
              <textarea required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Provide a brief reason for your leave request" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow resize-none" rows={4} />
            </div>

            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors shadow-sm">
              Review Request
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-medium">No leave requests found.</div>
        ) : (
          <div className="space-y-4 p-6 bg-slate-50">
            {requests.map((request) => (
              <div key={request.id} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 capitalize">{request.leaveType} Leave</h3>
                    <p className="text-sm font-medium text-slate-500">
                      {new Date(request.startDate).toLocaleDateString()} &rarr; {new Date(request.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      request.status === LeaveStatus.APPROVED ? "bg-green-100 text-green-700" : 
                      request.status === LeaveStatus.REJECTED ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                    }`}>
                      {request.status}
                    </span>
                    {request.status === LeaveStatus.PENDING && (
                      <button onClick={() => initiateCancel(request.id!)} className="text-slate-400 hover:text-red-600 text-sm font-semibold transition-colors underline underline-offset-2">
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                  <span className="font-semibold text-slate-700 mr-2">Reason:</span> 
                  {request.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}