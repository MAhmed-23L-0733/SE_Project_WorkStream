"use client";

import { useState, useEffect } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { User } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const users = await firebaseHelpers.getAllUsers();
        setEmployees(users as User[]);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

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
        <h1 className="text-4xl font-bold text-slate-900">Employees</h1>
        <p className="text-slate-600 mt-2">Manage all employees in the system</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
            + Add Employee
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            No employees found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Position</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Department</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map((employee) => (
                  <tr key={employee.uid} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-900">{employee.fullName}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{employee.email}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{employee.position || "-"}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{employee.department || "-"}</td>
                    <td className="px-6 py-3 text-sm">
                      <button className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
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
