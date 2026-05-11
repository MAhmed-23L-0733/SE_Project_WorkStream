"use client";

import { useState, useEffect, useCallback } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { User } from "@/types";

const S = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; }
.ep-root { padding: 1.75rem 2rem; background: #f5f7ff; min-height: 100vh; font-family: 'Inter', sans-serif; }
.ep-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem; }
.ep-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0; }
.ep-subtitle { font-size: 0.875rem; color: #64748b; margin: 0.25rem 0 0; }
.ep-btn-primary { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.25rem; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border: none; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: opacity .2s, transform .15s; box-shadow: 0 4px 12px rgba(99,102,241,.25); font-family: 'Inter',sans-serif; }
.ep-btn-primary:hover { opacity: .9; transform: translateY(-1px); }
.ep-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.5rem; }
.ep-stat-card { background: #fff; border-radius: 1rem; padding: 1.25rem; border: 1px solid #f0f2f8; box-shadow: 0 2px 12px rgba(0,0,0,.04); }
.ep-stat-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; margin-bottom: .4rem; }
.ep-stat-value { font-size: 2rem; font-weight: 800; line-height: 1; }
.ep-table-card { background: #fff; border-radius: 1.25rem; border: 1px solid #f0f2f8; box-shadow: 0 2px 12px rgba(0,0,0,.04); overflow: hidden; }
.ep-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; gap: 1rem; flex-wrap: wrap; }
.ep-search-wrap { position: relative; flex: 1; max-width: 280px; }
.ep-search-wrap svg { position: absolute; left: .85rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #94a3b8; }
.ep-search { width: 100%; padding: .65rem .9rem .65rem 2.4rem; border: 1.5px solid #e2e8f0; border-radius: .75rem; font-size: .875rem; background: #f8fafc; outline: none; transition: border-color .2s, box-shadow .2s; font-family: 'Inter',sans-serif; color: #1e293b; }
.ep-search:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); background: #fff; }
.ep-filter { padding: .65rem .9rem; border: 1.5px solid #e2e8f0; border-radius: .75rem; font-size: .875rem; background: #f8fafc; outline: none; font-family: 'Inter',sans-serif; color: #1e293b; cursor: pointer; }
.ep-filter:focus { border-color: #6366f1; }
.ep-count { font-size: .78rem; color: #94a3b8; font-weight: 500; white-space: nowrap; }
table { width: 100%; border-collapse: collapse; }
thead { background: #f8fafc; }
th { padding: .85rem 1.25rem; text-align: left; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #64748b; border-bottom: 1px solid #f1f5f9; }
tbody tr { transition: background .15s; }
tbody tr:hover { background: #fafbff; }
td { padding: 1rem 1.25rem; font-size: .875rem; color: #475569; border-bottom: 1px solid #f8fafc; }
.ep-name-cell { display: flex; align-items: center; gap: .75rem; }
.ep-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: .85rem; flex-shrink: 0; object-fit: cover; }
.ep-name { font-weight: 700; color: #1e293b; font-size: .9rem; }
.ep-email-cell { font-size: .8rem; color: #64748b; }
.ep-badge { display: inline-block; padding: .25rem .65rem; border-radius: 99px; font-size: .7rem; font-weight: 700; }
.ep-btn-edit { font-size: .78rem; font-weight: 700; color: #6366f1; background: #eef0ff; border: none; padding: .35rem .75rem; border-radius: .5rem; cursor: pointer; transition: all .2s; font-family: 'Inter',sans-serif; }
.ep-btn-edit:hover { background: #6366f1; color: #fff; }
.ep-btn-del { font-size: .78rem; font-weight: 700; color: #ef4444; background: #fff1f2; border: none; padding: .35rem .75rem; border-radius: .5rem; cursor: pointer; transition: all .2s; font-family: 'Inter',sans-serif; }
.ep-btn-del:hover { background: #ef4444; color: #fff; }
.ep-empty { text-align: center; padding: 3rem; color: #94a3b8; font-size: .9rem; }
/* Modal */
.ep-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.35); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 50; }
.ep-modal { background: #fff; border-radius: 1.25rem; padding: 2rem; width: 100%; max-width: 440px; margin: 1rem; box-shadow: 0 24px 60px rgba(0,0,0,.18); max-height: 90vh; overflow-y: auto; }
.ep-modal h2 { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0 0 .35rem; }
.ep-modal p.sub { font-size: .82rem; color: #64748b; margin: 0 0 1.5rem; }
.ep-form-group { margin-bottom: 1rem; }
.ep-form-group label { display: block; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #64748b; margin-bottom: .4rem; }
.ep-inp { width: 100%; padding: .75rem .9rem; border: 1.5px solid #e2e8f0; border-radius: .75rem; font-size: .875rem; background: #f8fafc; outline: none; transition: all .2s; font-family: 'Inter',sans-serif; color: #1e293b; }
.ep-inp:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
.ep-modal-footer { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1.5rem; }
.ep-btn-cancel { padding: .65rem 1.1rem; border: 1.5px solid #e2e8f0; border-radius: .75rem; background: #fff; color: #475569; font-weight: 600; font-size: .875rem; cursor: pointer; font-family: 'Inter',sans-serif; transition: background .2s; }
.ep-btn-cancel:hover { background: #f8fafc; }
.ep-btn-save { padding: .65rem 1.25rem; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border: none; border-radius: .75rem; font-weight: 700; font-size: .875rem; cursor: pointer; font-family: 'Inter',sans-serif; transition: opacity .2s; box-shadow: 0 4px 12px rgba(99,102,241,.25); }
.ep-btn-save:hover { opacity: .9; }
.ep-btn-save:disabled, .ep-btn-del-modal:disabled { opacity: .5; cursor: not-allowed; }
.ep-btn-del-modal { padding: .65rem 1.25rem; background: linear-gradient(135deg,#ef4444,#dc2626); color: #fff; border: none; border-radius: .75rem; font-weight: 700; font-size: .875rem; cursor: pointer; font-family: 'Inter',sans-serif; transition: opacity .2s; box-shadow: 0 4px 12px rgba(239,68,68,.25); }
.ep-btn-del-modal:hover { opacity: .9; }
.ep-del-icon { width: 48px; height: 48px; border-radius: 50%; background: #fff1f2; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
/* Toast */
.ep-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; background: #fff; border: 1px solid #f0f2f8; border-radius: 1rem; padding: 1rem 1.25rem; box-shadow: 0 8px 30px rgba(0,0,0,.12); font-size: .875rem; color: #1e293b; font-weight: 600; z-index: 100; max-width: 360px; display: flex; align-items: flex-start; gap: .75rem; }
.ep-toast-icon { width: 32px; height: 32px; border-radius: 50%; background: #ecfdf5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
/* Spinner */
.ep-spinner { width: 40px; height: 40px; border: 3px solid #eef0ff; border-top-color: #6366f1; border-radius: 50%; animation: spin .7s linear infinite; margin: 4rem auto; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

const DEPT_COLORS = ["#eef0ff:#6366f1","#ecfdf5:#10b981","#fffbeb:#f59e0b","#fff1f2:#ef4444","#fdf4ff:#a855f7","#f0fdfa:#14b8a6"];
function deptColor(dept: string) {
  const idx = Math.abs(dept.split("").reduce((a,c)=>a+c.charCodeAt(0),0)) % DEPT_COLORS.length;
  const [bg,color] = DEPT_COLORS[idx].split(":");
  return { bg, color };
}

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
  const [addError, setAddError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ department: "", position: "" });
  const [newEmployeeData, setNewEmployeeData] = useState({ fullName: "", email: "", department: "", position: "", dateOfJoin: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("");

  useEffect(() => {
    Promise.all([
      firebaseHelpers.getAllDepartments().then(d => setDepartments(d.map((x:any) => x.name))).catch(() => {}),
      firebaseHelpers.getAllUsers().then(u => setEmployees((u as User[]).filter(x => x.role === "employee"))).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const handleCloseModal = useCallback(() => { setIsModalOpen(false); setSelectedEmployee(null); setFormData({ department: "", position: "" }); }, []);
  const handleCloseAddModal = useCallback(() => { setIsAddModalOpen(false); setNewEmployeeData({ fullName: "", email: "", department: "", position: "", dateOfJoin: "" }); setAddError(null); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isAddModalOpen) handleCloseAddModal();
      else if (isModalOpen) handleCloseModal();
      else if (isDeleteModalOpen) cancelDelete();
    };
    if (isModalOpen || isDeleteModalOpen || isAddModalOpen) { window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }
  }, [isModalOpen, isDeleteModalOpen, isAddModalOpen, handleCloseModal, handleCloseAddModal]);

  useEffect(() => { if (!toastMessage) return; const t = window.setTimeout(() => setToastMessage(null), 4000); return () => window.clearTimeout(t); }, [toastMessage]);

  const handleEdit = (emp: User) => { setSelectedEmployee(emp); setFormData({ department: emp.department || "", position: emp.position || "" }); setIsModalOpen(true); };

  const handleSave = async () => {
    if (!selectedEmployee) return;
    try {
      await firebaseHelpers.updateUser(selectedEmployee.uid, { department: formData.department, position: formData.position });
      setEmployees(prev => prev.map(e => e.uid === selectedEmployee.uid ? { ...e, ...formData } : e));
      handleCloseModal();
      setToastMessage("Employee updated successfully!");
    } catch { /* silent */ }
  };

  const handleDelete = (emp: User) => { setEmployeeToDelete(emp); setIsDeleteModalOpen(true); };
  const cancelDelete = () => { setIsDeleteModalOpen(false); setEmployeeToDelete(null); };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await firebaseHelpers.deleteUser(employeeToDelete.uid);
      setEmployees(prev => prev.filter(e => e.uid !== employeeToDelete.uid));
      cancelDelete();
      setToastMessage(`${employeeToDelete.fullName} has been removed.`);
    } catch { /* silent */ } finally { setIsDeleting(false); }
  };

  const handleAddEmployeeSave = async () => {
    setAddError(null);
    if (!newEmployeeData.fullName || !newEmployeeData.email || !newEmployeeData.dateOfJoin) { setAddError("Please fill in all required fields."); return; }
    setIsAdding(true);
    try {
      const newId = await firebaseHelpers.addEmployee({ ...newEmployeeData, role: "employee" } as any);
      setEmployees(prev => [...prev, { uid: newId, ...newEmployeeData, role: "employee" } as User]);
      handleCloseAddModal();
      setToastMessage("Employee added! Default password: 123456789");
    } catch (e: any) {
      if (e?.message === "employee-already-exists" || e?.message?.includes("email-already-in-use")) {
        setAddError("Employee with this email already exists.");
      } else {
        setAddError("Failed to add employee.");
      }
    } finally { setIsAdding(false); }
  };

  const filtered = employees.filter(e => {
    const q = searchTerm.toLowerCase();
    const matchSearch = e.fullName.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || (e.position||"").toLowerCase().includes(q);
    const matchDept = !selectedDepartmentFilter || e.department === selectedDepartmentFilter;
    return matchSearch && matchDept;
  });

  const byDept = departments.reduce((acc, d) => { acc[d] = employees.filter(e => e.department === d).length; return acc; }, {} as Record<string, number>);

  return (
    <>
      <style>{S}</style>
      {toastMessage && (
        <div className="ep-toast">
          <div className="ep-toast-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>{toastMessage}</div>
        </div>
      )}

      {loading ? <div className="ep-root"><div className="ep-spinner" /></div> : (
        <div className="ep-root">
          {/* Header */}
          <div className="ep-topbar">
            <div>
              <h1 className="ep-title">Employees</h1>
              <p className="ep-subtitle">Manage your team members and their roles</p>
            </div>
            <button className="ep-btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Employee
            </button>
          </div>

          {/* Stats */}
          <div className="ep-stats-row">
            <div className="ep-stat-card">
              <div className="ep-stat-label">Total Employees</div>
              <div className="ep-stat-value" style={{ color: "#6366f1" }}>{employees.length}</div>
            </div>
            <div className="ep-stat-card">
              <div className="ep-stat-label">Departments</div>
              <div className="ep-stat-value" style={{ color: "#10b981" }}>{departments.length}</div>
            </div>
            <div className="ep-stat-card">
              <div className="ep-stat-label">Unassigned</div>
              <div className="ep-stat-value" style={{ color: "#f59e0b" }}>{employees.filter(e => !e.department).length}</div>
            </div>
          </div>

          {/* Table Card */}
          <div className="ep-table-card">
            <div className="ep-toolbar">
              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", flex: 1 }}>
                <div className="ep-search-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input className="ep-search" placeholder="Search by name, email or role…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="ep-filter" value={selectedDepartmentFilter} onChange={e => setSelectedDepartmentFilter(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d} ({byDept[d] || 0})</option>)}
                </select>
              </div>
              <span className="ep-count">Showing {filtered.length} of {employees.length}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="ep-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem" }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <p>{employees.length === 0 ? "No employees yet. Add your first team member!" : "No employees match your search."}</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Position</th>
                      <th>Department</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(emp => {
                      const dc = deptColor(emp.department || "z");
                      return (
                        <tr key={emp.uid}>
                          <td>
                            <div className="ep-name-cell">
                              {emp.profileImage
                                ? <img src={emp.profileImage} alt={emp.fullName} className="ep-avatar" />
                                : <div className="ep-avatar">{emp.fullName?.[0]?.toUpperCase() || "?"}</div>
                              }
                              <div>
                                <div className="ep-name">{emp.fullName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="ep-email-cell">{emp.email}</td>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>{emp.position || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                          <td>
                            {emp.department
                              ? <span className="ep-badge" style={{ background: dc.bg, color: dc.color }}>{emp.department}</span>
                              : <span style={{ color: "#cbd5e1" }}>—</span>
                            }
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: ".5rem" }}>
                              <button className="ep-btn-edit" onClick={() => handleEdit(emp)}>Edit</button>
                              <button className="ep-btn-del" onClick={() => handleDelete(emp)}>Remove</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && selectedEmployee && (
        <div className="ep-overlay" onClick={e => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="ep-modal">
            <h2>Edit Employee</h2>
            <p className="sub">{selectedEmployee.fullName} · {selectedEmployee.email}</p>
            <div className="ep-form-group">
              <label>Department</label>
              <select className="ep-inp" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="ep-form-group">
              <label>Position</label>
              <input className="ep-inp" placeholder="e.g. Senior Engineer" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
            </div>
            <div className="ep-modal-footer">
              <button className="ep-btn-cancel" onClick={handleCloseModal}>Cancel</button>
              <button className="ep-btn-save" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && employeeToDelete && (
        <div className="ep-overlay" onClick={e => { if (e.target === e.currentTarget) cancelDelete(); }}>
          <div className="ep-modal">
            <div className="ep-del-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h2>Remove Employee?</h2>
            <p className="sub">Are you sure you want to remove <strong>{employeeToDelete.fullName}</strong>? This action cannot be undone.</p>
            <div className="ep-modal-footer">
              <button className="ep-btn-cancel" disabled={isDeleting} onClick={cancelDelete}>Cancel</button>
              <button className="ep-btn-del-modal" disabled={isDeleting} onClick={confirmDelete}>{isDeleting ? "Removing…" : "Remove Employee"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="ep-overlay" onClick={e => { if (e.target === e.currentTarget) handleCloseAddModal(); }}>
          <div className="ep-modal">
            <h2>Add New Employee</h2>
            <p className="sub">They will receive a default password: <strong>123456789</strong></p>
            {addError && <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: 600, padding: "0.75rem", background: "#fef2f2", borderRadius: "0.5rem", border: "1px solid #fee2e2" }}>{addError}</div>}
            {[
              { label: "Full Name *", key: "fullName", type: "text", placeholder: "e.g. Sarah Johnson" },
              { label: "Email Address *", key: "email", type: "email", placeholder: "sarah@company.com" },
              { label: "Position", key: "position", type: "text", placeholder: "e.g. Software Engineer" },
              { label: "Date of Join *", key: "dateOfJoin", type: "date", placeholder: "" },
            ].map(f => (
              <div className="ep-form-group" key={f.key}>
                <label>{f.label}</label>
                <input
                  className="ep-inp"
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(newEmployeeData as any)[f.key]}
                  onChange={e => setNewEmployeeData({ ...newEmployeeData, [f.key]: e.target.value })}
                />
              </div>
            ))}
            <div className="ep-form-group">
              <label>Department</label>
              <select className="ep-inp" value={newEmployeeData.department} onChange={e => setNewEmployeeData({ ...newEmployeeData, department: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="ep-modal-footer">
              <button className="ep-btn-cancel" disabled={isAdding} onClick={handleCloseAddModal}>Cancel</button>
              <button className="ep-btn-save" disabled={isAdding} onClick={handleAddEmployeeSave}>{isAdding ? "Adding…" : "Add Employee"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
