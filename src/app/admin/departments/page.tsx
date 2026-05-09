"use client";

import { useState, useEffect } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { User } from "@/types";

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentsData, usersData] = await Promise.all([
          firebaseHelpers.getAllDepartments(),
          firebaseHelpers.getAllUsers()
        ]);
        
        setDepartments(departmentsData);
        setEmployees((usersData as User[]).filter(user => user.role === "employee"));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || ""
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedDepartment) {
        // Update existing department
        await firebaseHelpers.updateDepartment(selectedDepartment.id, formData);
        setDepartments(departments.map(dept =>
          dept.id === selectedDepartment.id ? { ...dept, ...formData } : dept
        ));
      } else {
        // Create new department
        await firebaseHelpers.createDepartment(formData);
        const updatedDepartments = await firebaseHelpers.getAllDepartments();
        setDepartments(updatedDepartments);
      }
      setIsModalOpen(false);
      setSelectedDepartment(null);
    } catch (error) {
      console.error("Error saving department:", error);
    }
  };

  const handleDelete = async (departmentId: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      try {
        await firebaseHelpers.deleteDepartment(departmentId);
        setDepartments(departments.filter(dept => dept.id !== departmentId));
      } catch (error) {
        console.error("Error deleting department:", error);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDepartment(null);
    setFormData({ name: "", description: "" });
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
        <h1 className="text-4xl font-bold text-slate-900">Departments</h1>
        <p className="text-slate-600 mt-2">Manage all departments in the system</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Add Department
          </button>
        </div>

        {departments.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            No departments found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Department Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Employee Count</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {departments.map((department) => {
                  const employeeCount = employees.filter(emp => emp.department === department.name).length;
                  return (
                    <tr key={department.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-900">{department.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{department.description || "-"}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{employeeCount}</td>
                      <td className="px-6 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(department)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(department.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                {selectedDepartment ? "Edit Department" : "Add Department"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter department name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter department description"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
                >
                  {selectedDepartment ? "Update Department" : "Add Department"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}