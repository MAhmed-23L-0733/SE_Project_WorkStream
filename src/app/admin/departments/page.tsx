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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "with-employees" | "without-employees">("all");

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

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

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
        await firebaseHelpers.updateDepartment(selectedDepartment.id, formData);
        setDepartments(departments.map(dept =>
          dept.id === selectedDepartment.id ? { ...dept, ...formData } : dept
        ));
      } else {
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

  const handleDelete = (department: Department) => {
    setDepartmentToDelete(department);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;

    setIsDeleting(true);
    try {
      await firebaseHelpers.deleteDepartment(departmentToDelete.id);
      setDepartments(departments.filter(dept => dept.id !== departmentToDelete.id));
      setIsDeleteModalOpen(false);
      setDepartmentToDelete(null);
      setToastMessage("Department deleted successfully!");
    } catch (error) {
      console.error("Error deleting department:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDepartmentToDelete(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDepartment(null);
    setFormData({ name: "", description: "" });
  };

  const filteredDepartments = departments.filter(department => {
    const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const employeeCount = employees.filter(emp => emp.department === department.name).length;
    const matchesFilter = filterType === "all" ||
                         (filterType === "with-employees" && employeeCount > 0) ||
                         (filterType === "without-employees" && employeeCount === 0);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {toastMessage && (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Departments</h1>
        <p className="text-slate-600 mt-2">Manage all departments in the system</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <button
              onClick={handleAdd}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + Add Department
            </button>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 pl-9 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "all" | "with-employees" | "without-employees")}
                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Departments</option>
                <option value="with-employees">With Employees</option>
                <option value="without-employees">Without Employees</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-slate-600">
            Showing {filteredDepartments.length} of {departments.length} departments
          </div>
        </div>

        {filteredDepartments.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            {departments.length === 0 ? "No departments found" : "No departments match your search criteria"}
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
                {filteredDepartments.map((department) => {
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
                          onClick={() => handleDelete(department)}
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


      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
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

      
      {isDeleteModalOpen && departmentToDelete && (
        <div 
          className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelDelete();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Delete Department?
              </h2>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{departmentToDelete.name}</span>? This action cannot be undone and will unassign all employees from this department.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md disabled:bg-red-400"
                >
                  {isDeleting ? "Deleting..." : "Delete Department"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}