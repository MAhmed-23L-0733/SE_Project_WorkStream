"use client";

import { useState, useEffect } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { LeaveRequest, LeaveStatus } from "@/types";
import { where } from "firebase/firestore";

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeaveStatus | "all">(LeaveStatus.PENDING);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        let leaveRequests = await firebaseHelpers.getAllLeaveRequests(
          filter !== "all" ? [where("status", "==", filter)] : []
        );
        setRequests(leaveRequests as LeaveRequest[]);
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [filter]);

  const handleApprove = async (requestId: string) => {
    try {
      await firebaseHelpers.updateLeaveRequest(requestId, {
        status: LeaveStatus.APPROVED,
        approvalDate: new Date().toISOString()
      });
      setRequests(requests.map(r => r.id === requestId ? { ...r, status: LeaveStatus.APPROVED } : r));
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await firebaseHelpers.updateLeaveRequest(requestId, {
        status: LeaveStatus.REJECTED,
        approvalDate: new Date().toISOString()
      });
      setRequests(requests.map(r => r.id === requestId ? { ...r, status: LeaveStatus.REJECTED } : r));
    } catch (error) {
      console.error("Error rejecting request:", error);
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Leave Requests</h1>
        <p className="text-slate-600 mt-2">Review and approve/reject leave requests</p>
      </div>

      <div className="mb-6 flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status === "all" ? "all" : (status as LeaveStatus))}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-900 hover:bg-slate-300"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            No leave requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">From</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">To</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-900">{request.userName || "Unknown"}</td>
                    <td className="px-6 py-3 text-sm text-slate-600 capitalize">{request.leaveType}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{new Date(request.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{new Date(request.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === LeaveStatus.APPROVED
                          ? "bg-green-100 text-green-800"
                          : request.status === LeaveStatus.REJECTED
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {request.status === LeaveStatus.PENDING && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => request.id && handleApprove(request.id)}
                            className="text-green-600 hover:text-green-700 font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => request.id && handleReject(request.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
