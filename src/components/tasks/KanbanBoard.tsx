"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { Project, ProjectTask, TaskStatus, TaskUrgency, User } from "@/types";

const STATUS_COLUMNS: Array<{ key: TaskStatus; label: string; icon: string }> = [
  { key: "todo", label: "To Do", icon: "📋" },
  { key: "in_progress", label: "In Progress", icon: "⚡" },
  { key: "done", label: "Done", icon: "✅" }
];

const urgencyConfig: Record<TaskUrgency, { bg: string; color: string; label: string }> = {
  low: { bg: "#ecfdf5", color: "#10b981", label: "Low" },
  medium: { bg: "#fffbeb", color: "#f59e0b", label: "Medium" },
  high: { bg: "#fff1f2", color: "#f43f5e", label: "High" },
  critical: { bg: "#fef2f2", color: "#ef4444", label: "Critical" }
};

export const KanbanBoard = () => {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState({ title: "", description: "" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    urgency: "medium" as TaskUrgency,
    deadline: "",
    assignedTo: ""
  });

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const employeeById = useMemo(() => {
    const map = new Map<string, User>();
    if (Array.isArray(employees)) {
      employees.forEach((employee) => {
        map.set(employee.uid, employee);
      });
    }
    return map;
  }, [employees]);

  // Initial data load: Projects and Employees
  useEffect(() => {
    if (!user?.uid) return;

    const fetchInitialData = async () => {
      setLoadingProjects(true);
      try {
        const [projectList, employeeList] = await Promise.all([
          firebaseHelpers.getAllProjects(),
          firebaseHelpers.getEmployees()
        ]);

        setProjects(projectList || []);
        setEmployees(employeeList || []);

        // Only auto-select first project if none is selected
        if (projectList && projectList.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectList[0].id || "");
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        setErrorMessage("Could not load projects or employees.");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchInitialData();
  }, [user?.uid, selectedProjectId]); // Added selectedProjectId to match expected dependency count for HMR and safety

  // Load tasks when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const projectTasks = await firebaseHelpers.getProjectTasks(selectedProjectId);
        setTasks(projectTasks || []);
        setErrorMessage(null);
      } catch (error) {
        console.error("Error loading tasks:", error);
        setErrorMessage("Could not load tasks for this project.");
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [selectedProjectId]);

  const refreshTasks = async () => {
    if (!selectedProjectId) return;
    try {
      const projectTasks = await firebaseHelpers.getProjectTasks(selectedProjectId);
      setTasks(projectTasks || []);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  const handleCreateProject = async (event: FormEvent) => {
    event.preventDefault();
    if (role !== "admin" || !user?.uid || !projectForm.title.trim()) return;

    setSubmittingProject(true);
    try {
      await firebaseHelpers.createProject({
        title: projectForm.title,
        description: projectForm.description,
        createdBy: user.uid,
        createdByName: user.fullName || user.email || "Admin"
      });

      const projectList = await firebaseHelpers.getAllProjects();
      setProjects(projectList || []);
      setProjectForm({ title: "", description: "" });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("Could not create project.");
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault();
    if (role !== "admin" || !user?.uid || !selectedProjectId || !taskForm.title.trim()) return;

    setSubmittingTask(true);
    try {
      const assignedEmployee = taskForm.assignedTo ? employeeById.get(taskForm.assignedTo) : null;

      await firebaseHelpers.createTask({
        projectId: selectedProjectId,
        title: taskForm.title,
        description: taskForm.description,
        urgency: taskForm.urgency,
        deadline: taskForm.deadline,
        assignedTo: taskForm.assignedTo,
        assignedToName: assignedEmployee?.fullName || assignedEmployee?.email || "",
        createdBy: user.uid,
        createdByName: user.fullName || user.email || "Admin"
      });

      setTaskForm({
        title: "",
        description: "",
        urgency: "medium",
        deadline: "",
        assignedTo: ""
      });
      await refreshTasks();
    } catch (error) {
      setErrorMessage("Could not create task.");
    } finally {
      setSubmittingTask(false);
    }
  };

  const canMoveTask = (task: ProjectTask) => {
    if (!user?.uid) return false;
    if (role === "admin") return true;
    return task.assignedTo === user.uid;
  };

  const handleStatusDrop = async (event: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("task-id");
    if (!taskId) return;

    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === status || !canMoveTask(targetTask)) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    try {
      await firebaseHelpers.updateTaskStatus(taskId, status);
    } catch (error) {
      console.error("Drop error:", error);
      await refreshTasks();
    }
  };

  const handleClaimTask = async (task: ProjectTask) => {
    if (!task.id || !user?.uid) return;
    try {
      await firebaseHelpers.assignTask(task.id, user.uid, user.fullName || user.email || "Employee");
      await refreshTasks();
    } catch (error) {
      setErrorMessage("Could not assign task.");
    }
  };

  const handleAdminAssignmentChange = async (task: ProjectTask, assignedUserId: string) => {
    if (role !== "admin" || !task.id) return;
    try {
      if (!assignedUserId) {
        await firebaseHelpers.updateTask(task.id, { assignedTo: "", assignedToName: "" });
      } else {
        const emp = employeeById.get(assignedUserId);
        if (emp) {
          await firebaseHelpers.assignTask(task.id, assignedUserId, emp.fullName || emp.email);
        }
      }
      await refreshTasks();
    } catch (error) {
      setErrorMessage("Could not update assignee.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .kanban-root {
          padding: 1.75rem 2rem;
          background: #f5f7ff;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        .kanban-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .kanban-title-section h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .kanban-title-section p {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.35rem;
        }

        .admin-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1024px) {
          .admin-actions { grid-template-columns: 1fr; }
        }

        .form-card {
          background: white;
          border-radius: 1.25rem;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          border: 1px solid #f0f2f8;
        }

        .form-card h2 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .input-group {
          margin-bottom: 1rem;
        }

        .input-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }

        .styled-input, .styled-textarea, .styled-select {
          width: 100%;
          padding: 0.75rem 0.9rem;
          border-radius: 0.75rem;
          border: 1.5px solid #e2e8f0;
          font-size: 0.875rem;
          color: #1e293b;
          background: #f8fafc;
          transition: all 0.2s;
          outline: none;
        }

        .styled-input:focus, .styled-textarea:focus, .styled-select:focus {
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .btn-gradient {
          padding: 0.75rem 1.25rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-weight: 700;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .btn-gradient:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-gradient:disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
        }

        .project-switcher {
          background: white;
          border-radius: 1.25rem;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
          border: 1px solid #f0f2f8;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        .project-select-wrap {
          flex: 1;
          max-width: 400px;
        }

        .project-info-mini {
          flex: 2;
        }

        .project-info-mini h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .project-info-mini p {
          font-size: 0.8rem;
          color: #94a3b8;
          margin: 0.2rem 0 0;
        }

        .kanban-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .kanban-grid { grid-template-columns: 1fr; }
        }

        .kanban-column {
          background: #f1f3f9;
          border-radius: 1.25rem;
          padding: 1.25rem;
          min-height: 500px;
          border: 1px solid transparent;
        }

        .kanban-column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding: 0 0.5rem;
        }

        .column-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .column-count {
          background: white;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.2rem 0.6rem;
          border-radius: 99px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .task-card {
          background: white;
          border-radius: 1rem;
          padding: 1.25rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          border: 1px solid #f0f2f8;
          cursor: grab;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .task-urgency {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.6rem;
          border-radius: 99px;
          margin-bottom: 0.75rem;
        }

        .task-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .task-desc {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.5;
          margin-bottom: 1.25rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .task-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid #f1f3f8;
          padding-top: 1rem;
        }

        .task-meta {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .task-assignee-select {
          width: 100%;
          font-size: 0.75rem;
          padding: 0.35rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          margin-top: 0.5rem;
        }

        .claim-btn {
          font-size: 0.75rem;
          font-weight: 700;
          color: #6366f1;
          background: #f0f2ff;
          border: none;
          padding: 0.4rem 0.75rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .claim-btn:hover {
          background: #6366f1;
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #eef0ff;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 2rem auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="kanban-root">
        <div className="kanban-header">
          <div className="kanban-title-section">
            <h1>Project Board</h1>
            <p>
              {role === "admin"
                ? "Manage workspace projects and track team progress."
                : "Collaborate on projects and complete assigned tasks."}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div style={{ background: "#fef2f2", color: "#ef4444", padding: "1rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontSize: "0.875rem", fontWeight: "600", border: "1px solid #fecaca" }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {role === "admin" && (
          <div className="admin-actions">
            <form className="form-card" onSubmit={handleCreateProject}>
              <h2><span>📁</span> Create New Project</h2>
              <div className="input-group">
                <label>Project Title</label>
                <input
                  className="styled-input"
                  placeholder="e.g. Q4 Marketing Campaign"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea
                  className="styled-textarea"
                  placeholder="What is this project about?"
                  rows={2}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                />
              </div>
              <button className="btn-gradient" disabled={submittingProject}>
                {submittingProject ? "Creating..." : "Create Project"}
              </button>
            </form>

            <form className="form-card" onSubmit={handleCreateTask}>
              <h2><span>✨</span> New Task</h2>
              <div className="input-group">
                <label>Task Name</label>
                <input
                  className="styled-input"
                  placeholder="e.g. Design landing page"
                  value={taskForm.title}
                  disabled={!selectedProjectId}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="input-group">
                  <label>Urgency</label>
                  <select
                    className="styled-select"
                    value={taskForm.urgency}
                    disabled={!selectedProjectId}
                    onChange={(e) => setTaskForm({ ...taskForm, urgency: e.target.value as TaskUrgency })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    className="styled-input"
                    value={taskForm.deadline}
                    disabled={!selectedProjectId}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Assignee</label>
                <select
                  className="styled-select"
                  value={taskForm.assignedTo}
                  disabled={!selectedProjectId}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                >
                  <option value="">Select an employee (optional)</option>
                  {employees.map(emp => (
                    <option key={emp.uid} value={emp.uid}>{emp.fullName || emp.email}</option>
                  ))}
                </select>
              </div>
              <button className="btn-gradient" disabled={submittingTask || !selectedProjectId}>
                {submittingTask ? "Adding..." : "Add Task"}
              </button>
            </form>
          </div>
        )}

        <div className="project-switcher">
          <div className="project-select-wrap">
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.5rem" }}>Select Active Project</label>
            {loadingProjects ? (
              <div className="loading-spinner" style={{ margin: "0.5rem 0", width: "20px", height: "20px" }} />
            ) : projects.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>No projects found.</p>
            ) : (
              <select
                className="styled-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )}
          </div>
          <div className="project-info-mini">
            {selectedProject && (
              <>
                <h3>{selectedProject.title}</h3>
                <p>{selectedProject.description || "No description provided for this project."}</p>
              </>
            )}
          </div>
        </div>

        <div className="kanban-grid">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className="kanban-column"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleStatusDrop(e, col.key)}
              >
                <div className="kanban-column-header">
                  <span className="column-title">
                    <span>{col.icon}</span> {col.label}
                  </span>
                  <span className="column-count">{colTasks.length}</span>
                </div>

                {loadingTasks ? (
                  <div className="loading-spinner" />
                ) : (
                  <div className="task-list">
                    {colTasks.length === 0 ? (
                      <div className="empty-state">No tasks here</div>
                    ) : (
                      colTasks.map((task) => {
                        const config = urgencyConfig[task.urgency];
                        const isClaimable = role === "employee" && !task.assignedTo;

                        return (
                          <div
                            key={task.id}
                            className="task-card"
                            draggable={canMoveTask(task)}
                            onDragStart={(e) => {
                              if (task.id) e.dataTransfer.setData("task-id", task.id);
                            }}
                          >
                            <span className="task-urgency" style={{ background: config.bg, color: config.color }}>
                              {config.label}
                            </span>
                            <h4 className="task-title">{task.title}</h4>
                            {task.description && <p className="task-desc">{task.description}</p>}

                            <div className="task-footer">
                              <div className="task-meta">
                                <div className="meta-item">
                                  <span>📅</span>
                                  <span>Due: <strong>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "Flexible"}</strong></span>
                                </div>
                                <div className="meta-item">
                                  <span>👤</span>
                                  <span>Assigned: <strong>{task.assignedToName || "Nobody"}</strong></span>
                                </div>
                              </div>
                            </div>

                            {role === "admin" ? (
                              <select
                                className="task-assignee-select"
                                value={task.assignedTo || ""}
                                onChange={(e) => handleAdminAssignmentChange(task, e.target.value)}
                              >
                                <option value="">Unassigned</option>
                                {employees.map((emp) => (
                                  <option key={emp.uid} value={emp.uid}>{emp.fullName || emp.email}</option>
                                ))}
                              </select>
                            ) : (
                              isClaimable && (
                                <button className="claim-btn" style={{ marginTop: "0.75rem", width: "100%" }} onClick={() => handleClaimTask(task)}>
                                  Claim Task
                                </button>
                              )
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
