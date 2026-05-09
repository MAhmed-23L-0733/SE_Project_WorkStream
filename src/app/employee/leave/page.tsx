"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { LeaveRequest, LeaveType, LeaveStatus } from "@/types";
import { where } from "firebase/firestore";

export default function LeavePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    leaveType: LeaveType.CASUAL,
    reason: ""
  });

  useEffect(() => {
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

    fetchLeaveRequests();
  }, [user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    try {
      const leaveData: LeaveRequest = {
        userId: user.uid,
        userName: user.fullName || user.email || "Unknown",
        startDate: formData.startDate,
        endDate: formData.endDate,
        leaveType: formData.leaveType as LeaveType,
        reason: formData.reason,
        status: LeaveStatus.PENDING
      };

      await firebaseHelpers.createLeaveRequest(leaveData);
      setFormData({ startDate: "", endDate: "", leaveType: LeaveType.CASUAL, reason: "" });
      setShowForm(false);

      // Refresh requests
      const updatedRequests = await firebaseHelpers.getLeaveRequests(user.uid);
      setRequests(updatedRequests as LeaveRequest[]);
    } catch (error) {
      console.error("Error creating leave request:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Leave Requests</h1>
          <p className="text-slate-600 mt-2">Manage your leave applications</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ New Request"}
        </button>
      </div>

      {/* Leave Request Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Request Leave</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
              <select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as LeaveType })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={LeaveType.CASUAL}>Casual Leave</option>
                <option value={LeaveType.SICK}>Sick Leave</option>
                <option value={LeaveType.ANNUAL}>Annual Leave</option>
                <option value={LeaveType.UNPAID}>Unpaid Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Provide a reason for your leave request"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={4}
              />
            </div>

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Submit Request
            </button>
          </form>
        </div>
      )}

      {/* Leave Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            No leave requests yet
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 capitalize">
                      {request.leaveType} Leave
                    </h3>
                    <p className="text-sm text-slate-600">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === LeaveStatus.APPROVED
                      ? "bg-green-100 text-green-800"
                      : request.status === LeaveStatus.REJECTED
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Reason:</span> {request.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
