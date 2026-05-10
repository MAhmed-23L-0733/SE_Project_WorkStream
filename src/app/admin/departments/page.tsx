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

const DEPT_PALETTE = [
  { bg: "#eef0ff", color: "#6366f1", light: "#f5f6ff" },
  { bg: "#ecfdf5", color: "#10b981", light: "#f0fdf9" },
  { bg: "#fffbeb", color: "#f59e0b", light: "#fffdf5" },
  { bg: "#fff1f2", color: "#f43f5e", light: "#fff8f8" },
  { bg: "#fdf4ff", color: "#a855f7", light: "#fdf0ff" },
  { bg: "#f0fdfa", color: "#14b8a6", light: "#edfcfa" },
  { bg: "#fff7ed", color: "#f97316", light: "#fffaf5" },
];

function getDeptPalette(name: string) {
  const idx = Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % DEPT_PALETTE.length;
  return DEPT_PALETTE[idx];
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; }
.dp-root { padding: 1.75rem 2rem; background: #f5f7ff; min-height: 100vh; font-family: 'Inter', sans-serif; }
.dp-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.75rem; flex-wrap: wrap; gap: 1rem; }
.dp-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0; }
.dp-subtitle { font-size: 0.875rem; color: #64748b; margin: 0.25rem 0 0; }
.dp-btn-primary { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.25rem; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border: none; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: opacity .2s, transform .15s; box-shadow: 0 4px 12px rgba(99,102,241,.25); font-family: 'Inter',sans-serif; }
.dp-btn-primary:hover { opacity: .9; transform: translateY(-1px); }
.dp-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.5rem; }
.dp-stat { background:#fff; border-radius:1rem; padding:1.25rem; border:1px solid #f0f2f8; box-shadow:0 2px 12px rgba(0,0,0,.04); }
.dp-stat-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#94a3b8; margin-bottom:.4rem; }
.dp-stat-value { font-size:2rem; font-weight:800; line-height:1; }
.dp-toolbar { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid #f1f5f9; gap:1rem; flex-wrap:wrap; background:#fff; border-radius:1.25rem 1.25rem 0 0; }
.dp-search-wrap { position:relative; flex:1; max-width:280px; }
.dp-search-wrap svg { position:absolute; left:.85rem; top:50%; transform:translateY(-50%); width:15px; height:15px; color:#94a3b8; }
.dp-search { width:100%; padding:.65rem .9rem .65rem 2.4rem; border:1.5px solid #e2e8f0; border-radius:.75rem; font-size:.875rem; background:#f8fafc; outline:none; transition:all .2s; font-family:'Inter',sans-serif; color:#1e293b; }
.dp-search:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); background:#fff; }
.dp-filter { padding:.65rem .9rem; border:1.5px solid #e2e8f0; border-radius:.75rem; font-size:.875rem; background:#f8fafc; outline:none; font-family:'Inter',sans-serif; color:#1e293b; cursor:pointer; }
.dp-filter:focus { border-color:#6366f1; }
.dp-count { font-size:.78rem; color:#94a3b8; font-weight:500; white-space:nowrap; }
.dp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:1.25rem; padding:1.5rem; background:#fff; border-radius:0 0 1.25rem 1.25rem; border:1px solid #f0f2f8; border-top:none; box-shadow:0 2px 12px rgba(0,0,0,.04); }
.dp-card { border-radius:1rem; border:1.5px solid transparent; padding:1.5rem; transition:transform .2s, box-shadow .2s; cursor:default; position:relative; overflow:hidden; }
.dp-card:hover { transform:translateY(-3px); box-shadow:0 12px 30px rgba(0,0,0,.09); }
.dp-card-icon { width:48px; height:48px; border-radius:.85rem; display:flex; align-items:center; justify-content:center; margin-bottom:1rem; flex-shrink:0; }
.dp-card-name { font-size:1.1rem; font-weight:800; color:#0f172a; margin-bottom:.3rem; }
.dp-card-desc { font-size:.8rem; color:#64748b; line-height:1.5; margin-bottom:1rem; min-height:2.4rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.dp-card-footer { display:flex; align-items:center; justify-content:space-between; border-top:1px solid rgba(0,0,0,.05); padding-top:.85rem; margin-top:auto; }
.dp-emp-count { display:flex; align-items:center; gap:.4rem; font-size:.8rem; font-weight:700; }
.dp-card-actions { display:flex; gap:.4rem; }
.dp-btn-edit { font-size:.75rem; font-weight:700; padding:.3rem .65rem; border-radius:.5rem; border:none; cursor:pointer; transition:all .2s; font-family:'Inter',sans-serif; }
.dp-btn-del-sm { font-size:.75rem; font-weight:700; padding:.3rem .65rem; border-radius:.5rem; border:none; cursor:pointer; transition:all .2s; font-family:'Inter',sans-serif; }
.dp-empty { text-align:center; padding:3rem; color:#94a3b8; font-size:.9rem; background:#fff; border-radius:0 0 1.25rem 1.25rem; border:1px solid #f0f2f8; border-top:none; }
.dp-overlay { position:fixed; inset:0; background:rgba(15,23,42,.35); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:50; }
.dp-modal { background:#fff; border-radius:1.25rem; padding:2rem; width:100%; max-width:440px; margin:1rem; box-shadow:0 24px 60px rgba(0,0,0,.18); }
.dp-modal h2 { font-size:1.2rem; font-weight:800; color:#0f172a; margin:0 0 .35rem; }
.dp-modal p.sub { font-size:.82rem; color:#64748b; margin:0 0 1.5rem; }
.dp-form-group { margin-bottom:1rem; }
.dp-form-group label { display:block; font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#64748b; margin-bottom:.4rem; }
.dp-inp { width:100%; padding:.75rem .9rem; border:1.5px solid #e2e8f0; border-radius:.75rem; font-size:.875rem; background:#f8fafc; outline:none; transition:all .2s; font-family:'Inter',sans-serif; color:#1e293b; }
.dp-inp:focus { border-color:#6366f1; background:#fff; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
.dp-modal-footer { display:flex; justify-content:flex-end; gap:.75rem; margin-top:1.5rem; }
.dp-btn-cancel { padding:.65rem 1.1rem; border:1.5px solid #e2e8f0; border-radius:.75rem; background:#fff; color:#475569; font-weight:600; font-size:.875rem; cursor:pointer; font-family:'Inter',sans-serif; transition:background .2s; }
.dp-btn-cancel:hover { background:#f8fafc; }
.dp-btn-save { padding:.65rem 1.25rem; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border:none; border-radius:.75rem; font-weight:700; font-size:.875rem; cursor:pointer; font-family:'Inter',sans-serif; box-shadow:0 4px 12px rgba(99,102,241,.25); transition:opacity .2s; }
.dp-btn-save:hover { opacity:.9; }
.dp-btn-del-modal { padding:.65rem 1.25rem; background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; border:none; border-radius:.75rem; font-weight:700; font-size:.875rem; cursor:pointer; font-family:'Inter',sans-serif; box-shadow:0 4px 12px rgba(239,68,68,.25); transition:opacity .2s; }
.dp-btn-del-modal:hover { opacity:.9; }
.dp-btn-del-modal:disabled, .dp-btn-save:disabled { opacity:.5; cursor:not-allowed; }
.dp-del-icon { width:48px; height:48px; border-radius:50%; background:#fff1f2; display:flex; align-items:center; justify-content:center; margin-bottom:1rem; }
.dp-toast { position:fixed; bottom:1.5rem; right:1.5rem; background:#fff; border:1px solid #f0f2f8; border-radius:1rem; padding:1rem 1.25rem; box-shadow:0 8px 30px rgba(0,0,0,.12); font-size:.875rem; color:#1e293b; font-weight:600; z-index:100; max-width:360px; display:flex; align-items:center; gap:.75rem; }
.dp-toast-icon { width:32px; height:32px; border-radius:50%; background:#ecfdf5; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.dp-spinner { width:40px; height:40px; border:3px solid #eef0ff; border-top-color:#6366f1; border-radius:50%; animation:spin .7s linear infinite; margin:4rem auto; }
@keyframes spin { to { transform:rotate(360deg); } }
`;

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
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "with-employees" | "without-employees">("all");

  useEffect(() => {
    Promise.all([
      firebaseHelpers.getAllDepartments(),
      firebaseHelpers.getAllUsers()
    ]).then(([depts, users]) => {
      setDepartments(depts);
      setEmployees((users as User[]).filter(u => u.role === "employee"));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const handleEdit = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({ name: dept.name, description: dept.description || "" });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    setFormData({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDepartment(null);
    setFormData({ name: "", description: "" });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    try {
      if (selectedDepartment) {
        await firebaseHelpers.updateDepartment(selectedDepartment.id, formData);
        setDepartments(prev => prev.map(d => d.id === selectedDepartment.id ? { ...d, ...formData } : d));
        setToastMessage("Department updated successfully!");
      } else {
        await firebaseHelpers.createDepartment(formData);
        const updated = await firebaseHelpers.getAllDepartments();
        setDepartments(updated);
        setToastMessage("Department created successfully!");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving department:", error);
    }
  };

  const handleDelete = (dept: Department) => {
    setDepartmentToDelete(dept);
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => { setIsDeleteModalOpen(false); setDepartmentToDelete(null); };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;
    setIsDeleting(true);
    try {
      await firebaseHelpers.deleteDepartment(departmentToDelete.id);
      setDepartments(prev => prev.filter(d => d.id !== departmentToDelete.id));
      cancelDelete();
      setToastMessage("Department deleted successfully!");
    } catch (error) {
      console.error("Error deleting department:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = departments.filter(dept => {
    const q = searchTerm.toLowerCase();
    const matchSearch = dept.name.toLowerCase().includes(q) || (dept.description || "").toLowerCase().includes(q);
    const count = employees.filter(e => e.department === dept.name).length;
    const matchFilter = filterType === "all" || (filterType === "with-employees" && count > 0) || (filterType === "without-employees" && count === 0);
    return matchSearch && matchFilter;
  });

  const totalEmployeesAssigned = employees.filter(e => e.department).length;

  return (
    <>
      <style>{S}</style>

      {toastMessage && (
        <div className="dp-toast">
          <div className="dp-toast-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          {toastMessage}
        </div>
      )}

      {loading ? (
        <div className="dp-root"><div className="dp-spinner" /></div>
      ) : (
        <div className="dp-root">
          {/* Header */}
          <div className="dp-topbar">
            <div>
              <h1 className="dp-title">Departments</h1>
              <p className="dp-subtitle">Organise your company structure and manage teams</p>
            </div>
            <button className="dp-btn-primary" onClick={handleAdd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Department
            </button>
          </div>

          {/* Stats */}
          <div className="dp-stats-row">
            <div className="dp-stat">
              <div className="dp-stat-label">Total Departments</div>
              <div className="dp-stat-value" style={{ color: "#6366f1" }}>{departments.length}</div>
            </div>
            <div className="dp-stat">
              <div className="dp-stat-label">Employees Assigned</div>
              <div className="dp-stat-value" style={{ color: "#10b981" }}>{totalEmployeesAssigned}</div>
            </div>
            <div className="dp-stat">
              <div className="dp-stat-label">Empty Departments</div>
              <div className="dp-stat-value" style={{ color: "#f59e0b" }}>
                {departments.filter(d => employees.filter(e => e.department === d.name).length === 0).length}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="dp-toolbar">
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", flex: 1 }}>
              <div className="dp-search-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input className="dp-search" placeholder="Search departments…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <select className="dp-filter" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
                <option value="all">All Departments</option>
                <option value="with-employees">Has Employees</option>
                <option value="without-employees">Empty</option>
              </select>
            </div>
            <span className="dp-count">Showing {filtered.length} of {departments.length}</span>
          </div>

          {/* Cards Grid */}
          {filtered.length === 0 ? (
            <div className="dp-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem" }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <p>{departments.length === 0 ? "No departments yet. Create your first one!" : "No departments match your search."}</p>
            </div>
          ) : (
            <div className="dp-grid">
              {filtered.map(dept => {
                const palette = getDeptPalette(dept.name);
                const count = employees.filter(e => e.department === dept.name).length;
                return (
                  <div key={dept.id} className="dp-card" style={{ background: palette.light, borderColor: palette.bg }}>
                    <div className="dp-card-icon" style={{ background: palette.bg }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={palette.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                    <div className="dp-card-name">{dept.name}</div>
                    <div className="dp-card-desc">{dept.description || "No description provided."}</div>
                    <div className="dp-card-footer">
                      <div className="dp-emp-count" style={{ color: palette.color }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        {count} employee{count !== 1 ? "s" : ""}
                      </div>
                      <div className="dp-card-actions">
                        <button
                          className="dp-btn-edit"
                          style={{ background: palette.bg, color: palette.color }}
                          onClick={() => handleEdit(dept)}
                        >
                          Edit
                        </button>
                        <button
                          className="dp-btn-del-sm"
                          style={{ background: "#fff1f2", color: "#ef4444" }}
                          onClick={() => handleDelete(dept)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="dp-overlay" onClick={e => { if (e.target === e.currentTarget) handleCloseModal(); }}>
          <div className="dp-modal">
            <h2>{selectedDepartment ? "Edit Department" : "New Department"}</h2>
            <p className="sub">{selectedDepartment ? "Update the department details below." : "Fill in the details to create a new department."}</p>
            <div className="dp-form-group">
              <label>Department Name *</label>
              <input className="dp-inp" placeholder="e.g. Engineering" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="dp-form-group">
              <label>Description</label>
              <textarea className="dp-inp" placeholder="What does this department do?" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ resize: "vertical" }} />
            </div>
            <div className="dp-modal-footer">
              <button className="dp-btn-cancel" onClick={handleCloseModal}>Cancel</button>
              <button className="dp-btn-save" onClick={handleSave}>{selectedDepartment ? "Save Changes" : "Create Department"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && departmentToDelete && (
        <div className="dp-overlay" onClick={e => { if (e.target === e.currentTarget) cancelDelete(); }}>
          <div className="dp-modal">
            <div className="dp-del-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <h2>Delete Department?</h2>
            <p className="sub">
              Are you sure you want to delete <strong>{departmentToDelete.name}</strong>? This cannot be undone and will unassign all employees from this department.
            </p>
            <div className="dp-modal-footer">
              <button className="dp-btn-cancel" disabled={isDeleting} onClick={cancelDelete}>Cancel</button>
              <button className="dp-btn-del-modal" disabled={isDeleting} onClick={confirmDelete}>{isDeleting ? "Deleting…" : "Delete Department"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}