"use client";

import { useState, useEffect, useCallback } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { User } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    department: "",
    position: ""
  });
  const [newEmployeeData, setNewEmployeeData] = useState({
    fullName: "",
    email: "",
    department: "",
    position: "",
    dateOfJoin: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");

  useEffect(() => {
    const initializeDepartments = async () => {
      try {
        const existingDepartments = await firebaseHelpers.getAllDepartments();
        setDepartments(existingDepartments.map(dept => dept.name));
      } catch (error) {
        console.error("Error initializing departments:", error);
        setDepartments([]);
      }
    };

    const fetchEmployees = async () => {
      try {
        const users = await firebaseHelpers.getAllUsers();
        const filteredEmployees = (users as User[]).filter(user => user.role === "employee");
        setEmployees(filteredEmployees);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeDepartments();
    fetchEmployees();
  }, []);

  
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
    setFormData({ department: "", position: "" });
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setNewEmployeeData({
      fullName: "",
      email: "",
      department: "",
      position: "",
      dateOfJoin: ""
    });
  }, []);

  
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isAddModalOpen) {
          handleCloseAddModal();
        } else if (isModalOpen) {
          handleCloseModal();
        } else if (isDeleteModalOpen) {
          cancelDelete();
        }
      }
    };

    if (isModalOpen || isDeleteModalOpen || isAddModalOpen) {
      window.addEventListener("keydown", handleEscapeKey);
      return () => window.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isModalOpen, isDeleteModalOpen, isAddModalOpen]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleEdit = (employee: User) => {
    setSelectedEmployee(employee);
    setFormData({
      department: employee.department || "",
      position: employee.position || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedEmployee) return;

    try {
      await firebaseHelpers.updateUser(selectedEmployee.uid, {
        department: formData.department,
        position: formData.position
      });

      setEmployees(employees.map(emp =>
        emp.uid === selectedEmployee.uid
          ? { ...emp, department: formData.department, position: formData.position }
          : emp
      ));

      setIsModalOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const handleDelete = (employee: User) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    try {
      await firebaseHelpers.deleteUser(employeeToDelete.uid);
      setEmployees(employees.filter(emp => emp.uid !== employeeToDelete.uid));
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  const handleAddEmployee = () => {
    setNewEmployeeData({
      fullName: "",
      email: "",
      department: "",
      position: "",
      dateOfJoin: ""
    });
    setIsAddModalOpen(true);
  };

  const handleAddEmployeeSave = async () => {
    if (!newEmployeeData.fullName || !newEmployeeData.email || !newEmployeeData.dateOfJoin) {
      alert("Please fill in all required fields");
      return;
    }

    setIsAdding(true);
    try {
      const newEmployeeId = await firebaseHelpers.addEmployee({
        fullName: newEmployeeData.fullName,
        email: newEmployeeData.email,
        department: newEmployeeData.department,
        position: newEmployeeData.position,
        role: "employee",
        dateOfJoin: newEmployeeData.dateOfJoin
      });

  
      setEmployees([...employees, {
        uid: newEmployeeId,
        fullName: newEmployeeData.fullName,
        email: newEmployeeData.email,
        department: newEmployeeData.department,
        position: newEmployeeData.position,
        role: "employee",
        dateOfJoin: newEmployeeData.dateOfJoin
      } as User]);

      setIsAddModalOpen(false);
      setNewEmployeeData({
        fullName: "",
        email: "",
        department: "",
        position: "",
        dateOfJoin: ""
      });
      setToastMessage("Employee added successfully! They can now log in with their email and the default password: 123456789");
    } catch (error) {
      console.error("Error adding employee:", error);
      if (error instanceof Error) {
        if (error.message.includes("auth/email-already-in-use")) {
          alert("This email is already in use. Please use a different email.");
        } else {
          alert("Failed to add employee. Please try again.");
        }
      } else {
        alert("Failed to add employee. Please try again.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.position && employee.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = selectedDepartmentFilter === "" || employee.department === selectedDepartmentFilter;
    
    return matchesSearch && matchesDepartment;
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
        <h1 className="text-4xl font-bold text-slate-900">Employees</h1>
        <p className="text-slate-600 mt-2">Manage all employees in the system</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <button 
              onClick={handleAddEmployee}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + Add Employee
            </button>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 pl-9 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select
                value={selectedDepartmentFilter}
                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-sm text-slate-600">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            {employees.length === 0 ? "No employees found" : "No employees match your search criteria"}
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
                {filteredEmployees.map((employee) => (
                  <tr key={employee.uid} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-900">{employee.fullName}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{employee.email}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{employee.position || "-"}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{employee.department || "-"}</td>
                    <td className="px-6 py-3 text-sm space-x-3">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(employee)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {isModalOpen && selectedEmployee && (
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
                Edit Employee: {selectedEmployee.fullName}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-40 overflow-y-auto"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter position"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    
      {isDeleteModalOpen && employeeToDelete && (
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
                Delete Employee?
              </h2>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{employeeToDelete.fullName}</span>? This action cannot be undone.
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
                  {isDeleting ? "Deleting..." : "Delete Employee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

  
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseAddModal();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Add New Employee
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newEmployeeData.fullName}
                    onChange={(e) => setNewEmployeeData({ ...newEmployeeData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newEmployeeData.email}
                    onChange={(e) => setNewEmployeeData({ ...newEmployeeData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department
                  </label>
                  <select
                    value={newEmployeeData.department}
                    onChange={(e) => setNewEmployeeData({ ...newEmployeeData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={newEmployeeData.position}
                    onChange={(e) => setNewEmployeeData({ ...newEmployeeData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter position"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date of Join *
                  </label>
                  <input
                    type="date"
                    value={newEmployeeData.dateOfJoin}
                    onChange={(e) => setNewEmployeeData({ ...newEmployeeData, dateOfJoin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseAddModal}
                  disabled={isAdding}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmployeeSave}
                  disabled={isAdding}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:bg-green-400"
                >
                  {isAdding ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
