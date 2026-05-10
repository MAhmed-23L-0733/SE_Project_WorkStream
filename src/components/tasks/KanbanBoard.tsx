"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { Project, ProjectTask, TaskStatus, TaskUrgency, User } from "@/types";

const STATUS_COLUMNS: Array<{ key: TaskStatus; label: string; icon: string }> =
  [
    { key: "todo", label: "To Do", icon: "📋" },
    { key: "in_progress", label: "In Progress", icon: "⚡" },
    { key: "done", label: "Done", icon: "✅" },
  ];

const urgencyConfig: Record<TaskUrgency, { className: string; label: string }> =
  {
    low: { className: "low", label: "Low" },
    medium: { className: "medium", label: "Medium" },
    high: { className: "high", label: "High" },
    critical: { className: "critical", label: "Critical" },
  };

export const KanbanBoard = () => {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [projectMembersDraft, setProjectMembersDraft] = useState<string[]>([]);
  const [createMemberSearch, setCreateMemberSearch] = useState("");
  const [editMemberSearch, setEditMemberSearch] = useState("");
  const [showCreateMemberPicker, setShowCreateMemberPicker] = useState(false);
  const [showEditMemberPicker, setShowEditMemberPicker] = useState(false);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [savingProjectMembers, setSavingProjectMembers] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    memberIds: [] as string[],
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    urgency: "medium" as TaskUrgency,
    deadline: "",
    assignedTo: "",
  });

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
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

  const selectedProjectMembers = useMemo(() => {
    if (!selectedProject?.memberIds || selectedProject.memberIds.length === 0)
      return [] as User[];
    return selectedProject.memberIds
      .map((memberId) => employeeById.get(memberId))
      .filter((member): member is User => Boolean(member));
  }, [selectedProject, employeeById]);

  const filteredCreateEmployees = useMemo(() => {
    const query = createMemberSearch.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) => {
      const haystack =
        `${employee.fullName || ""} ${employee.email || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [employees, createMemberSearch]);

  const filteredEditEmployees = useMemo(() => {
    const query = editMemberSearch.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) => {
      const haystack =
        `${employee.fullName || ""} ${employee.email || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [employees, editMemberSearch]);

  // Initial data load: Projects and Employees
  useEffect(() => {
    if (!user?.uid || !role) return;

    const fetchInitialData = async () => {
      setLoadingProjects(true);
      try {
        const [projectList, employeeList] = await Promise.all([
          role === "admin"
            ? firebaseHelpers.getAllProjects()
            : firebaseHelpers.getProjectsForEmployee(user.uid),
          role === "admin"
            ? firebaseHelpers.getEmployees()
            : Promise.resolve([]),
        ]);

        setProjects(projectList || []);
        setEmployees(employeeList || []);

        const hasSelected = projectList.some(
          (project) => project.id === selectedProjectId,
        );
        if (hasSelected) return;

        if (projectList.length > 0) {
          setSelectedProjectId(projectList[0].id || "");
        } else {
          setSelectedProjectId("");
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        setErrorMessage("Could not load projects or employees.");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchInitialData();
  }, [user?.uid, role]);

  useEffect(() => {
    if (!selectedProject) {
      setProjectMembersDraft([]);
      return;
    }

    setProjectMembersDraft(selectedProject.memberIds || []);
    setEditMemberSearch("");
    setShowEditMemberPicker(false);
  }, [selectedProject]);

  // Load tasks when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const projectTasks =
          await firebaseHelpers.getProjectTasks(selectedProjectId);
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
      const projectTasks =
        await firebaseHelpers.getProjectTasks(selectedProjectId);
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
      const selectedMembers = projectForm.memberIds
        .map((memberId) => employeeById.get(memberId))
        .filter((member): member is User => Boolean(member));

      await firebaseHelpers.createProject({
        title: projectForm.title,
        description: projectForm.description,
        createdBy: user.uid,
        createdByName: user.fullName || user.email || "Admin",
        memberIds: selectedMembers.map((member) => member.uid),
        memberNames: selectedMembers.map(
          (member) => member.fullName || member.email,
        ),
      });

      const projectList = await firebaseHelpers.getAllProjects();
      setProjects(projectList || []);
      setProjectForm({ title: "", description: "", memberIds: [] });
      setCreateMemberSearch("");
      setShowCreateMemberPicker(false);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("Could not create project.");
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleProjectFormMemberToggle = (employeeId: string) => {
    setProjectForm((prev) => {
      const exists = prev.memberIds.includes(employeeId);
      return {
        ...prev,
        memberIds: exists
          ? prev.memberIds.filter((id) => id !== employeeId)
          : [...prev.memberIds, employeeId],
      };
    });
  };

  const handleProjectDraftMemberToggle = (employeeId: string) => {
    setProjectMembersDraft((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      }
      return [...prev, employeeId];
    });
  };

  const handleSaveProjectMembers = async () => {
    if (role !== "admin" || !selectedProjectId) return;

    setSavingProjectMembers(true);
    try {
      const selectedMembers = projectMembersDraft
        .map((memberId) => employeeById.get(memberId))
        .filter((member): member is User => Boolean(member));

      await firebaseHelpers.updateProjectMembers(
        selectedProjectId,
        selectedMembers.map((member) => member.uid),
        selectedMembers.map((member) => member.fullName || member.email),
      );

      setProjects((prev) =>
        prev.map((project) =>
          project.id === selectedProjectId
            ? {
                ...project,
                memberIds: selectedMembers.map((member) => member.uid),
                memberNames: selectedMembers.map(
                  (member) => member.fullName || member.email,
                ),
              }
            : project,
        ),
      );

      if (
        taskForm.assignedTo &&
        !projectMembersDraft.includes(taskForm.assignedTo)
      ) {
        setTaskForm((prev) => ({ ...prev, assignedTo: "" }));
      }

      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("Could not update project members.");
    } finally {
      setSavingProjectMembers(false);
    }
  };

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault();
    if (
      role !== "admin" ||
      !user?.uid ||
      !selectedProjectId ||
      !taskForm.title.trim()
    )
      return;

    if (
      taskForm.assignedTo &&
      !(selectedProject?.memberIds || []).includes(taskForm.assignedTo)
    ) {
      setErrorMessage("Assign tasks only to members of this project.");
      return;
    }

    setSubmittingTask(true);
    try {
      const assignedEmployee = taskForm.assignedTo
        ? employeeById.get(taskForm.assignedTo)
        : null;

      await firebaseHelpers.createTask({
        projectId: selectedProjectId,
        title: taskForm.title,
        description: taskForm.description,
        urgency: taskForm.urgency,
        deadline: taskForm.deadline,
        assignedTo: taskForm.assignedTo,
        assignedToName:
          assignedEmployee?.fullName || assignedEmployee?.email || "",
        createdBy: user.uid,
        createdByName: user.fullName || user.email || "Admin",
      });

      setTaskForm({
        title: "",
        description: "",
        urgency: "medium",
        deadline: "",
        assignedTo: "",
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

  const handleStatusDrop = async (
    event: DragEvent<HTMLDivElement>,
    status: TaskStatus,
  ) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("task-id");
    if (!taskId) return;

    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === status || !canMoveTask(targetTask))
      return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
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
      await firebaseHelpers.assignTask(
        task.id,
        user.uid,
        user.fullName || user.email || "Employee",
      );
      await refreshTasks();
    } catch (error) {
      setErrorMessage("Could not assign task.");
    }
  };

  const handleAdminAssignmentChange = async (
    task: ProjectTask,
    assignedUserId: string,
  ) => {
    if (role !== "admin" || !task.id) return;
    try {
      if (
        assignedUserId &&
        !(selectedProject?.memberIds || []).includes(assignedUserId)
      ) {
        setErrorMessage("Selected employee is not a member of this project.");
        return;
      }

      if (!assignedUserId) {
        await firebaseHelpers.updateTask(task.id, {
          assignedTo: "",
          assignedToName: "",
        });
      } else {
        const emp = employeeById.get(assignedUserId);
        if (emp) {
          await firebaseHelpers.assignTask(
            task.id,
            assignedUserId,
            emp.fullName || emp.email,
          );
        }
      }
      await refreshTasks();
      setErrorMessage(null);
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

        @media (max-width: 768px) {
          .kanban-root {
            padding: 1rem;
          }
        }

        .kanban-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .kanban-header {
            margin-bottom: 1.25rem;
          }

          .kanban-title-section h1 {
            font-size: 1.4rem;
          }
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

        .member-picker {
          max-height: 170px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          background: #f8fafc;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .member-picker-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 0.75rem;
          padding: 0.62rem 0.9rem;
          font-size: 0.84rem;
          color: #334155;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .member-picker-toggle:hover {
          border-color: #c7d2fe;
          background: #f5f7ff;
        }

        .member-picker-toggle.open {
          border-color: #6366f1;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .member-picker-panel {
          margin-top: 0.55rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.85rem;
          background: #ffffff;
          padding: 0.5rem;
        }

        .member-search {
          margin-bottom: 0.5rem;
        }

        .member-search-input {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.65rem;
          padding: 0.5rem 0.7rem;
          font-size: 0.78rem;
          color: #334155;
          outline: none;
          background: #f8fafc;
        }

        .member-search-input:focus {
          border-color: #6366f1;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .member-picker-compact {
          max-height: 150px;
        }

        .member-empty {
          font-size: 0.78rem;
          color: #64748b;
          padding: 0.45rem;
        }

        .member-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #334155;
          padding: 0.45rem 0.5rem;
          border-radius: 0.55rem;
          cursor: pointer;
        }

        .member-option:hover {
          background: #eef2ff;
        }

        .member-option input {
          accent-color: #6366f1;
        }

        .member-summary {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.35rem;
          font-weight: 600;
        }

        .member-selected-preview {
          margin-top: 0.5rem;
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
        }

        .member-selected-chip {
          font-size: 0.7rem;
          font-weight: 700;
          color: #4338ca;
          background: #eef2ff;
          border-radius: 999px;
          padding: 0.2rem 0.5rem;
        }

        .error-banner {
          background: #fef2f2;
          color: #ef4444;
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          border: 1px solid #fecaca;
        }

        .form-row-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        @media (max-width: 640px) {
          .form-row-two {
            grid-template-columns: 1fr;
          }
        }

        .select-active-project-label,
        .edit-members-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .select-active-project-label {
          margin-bottom: 0.5rem;
        }

        .edit-members-label {
          margin-bottom: 0.45rem;
          margin-top: 0.8rem;
        }

        .loading-spinner-inline {
          margin: 0.5rem 0;
          width: 20px;
          height: 20px;
        }

        .no-projects-text {
          font-size: 0.85rem;
          color: #64748b;
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

        @media (max-width: 900px) {
          .project-switcher {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
        }

        .project-select-wrap {
          flex: 1;
          max-width: 400px;
        }

        @media (max-width: 900px) {
          .project-select-wrap {
            max-width: none;
          }
        }

        .project-info-mini {
          flex: 2;
          min-width: 0;
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

        .project-members-list {
          margin-top: 0.65rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .project-member-chip {
          background: #eef2ff;
          color: #4338ca;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
        }

        .project-member-chip-muted {
          background: #f1f5f9;
          color: #64748b;
        }

        .project-edit-members {
          margin-top: 0.85rem;
          max-width: 420px;
        }

        @media (max-width: 900px) {
          .project-edit-members {
            max-width: none;
          }
        }

        .save-members-btn {
          margin-top: 0.65rem;
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

        .task-urgency.low {
          background: #ecfdf5;
          color: #10b981;
        }

        .task-urgency.medium {
          background: #fffbeb;
          color: #f59e0b;
        }

        .task-urgency.high {
          background: #fff1f2;
          color: #f43f5e;
        }

        .task-urgency.critical {
          background: #fef2f2;
          color: #ef4444;
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

        .claim-btn-block {
          margin-top: 0.75rem;
          width: 100%;
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

        {errorMessage && <div className="error-banner">⚠️ {errorMessage}</div>}

        {role === "admin" && (
          <div className="admin-actions">
            <form className="form-card" onSubmit={handleCreateProject}>
              <h2>
                <span>📁</span> Create New Project
              </h2>
              <div className="input-group">
                <label>Project Title</label>
                <input
                  className="styled-input"
                  placeholder="e.g. Q4 Marketing Campaign"
                  value={projectForm.title}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, title: e.target.value })
                  }
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
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="input-group">
                <label>Project Members</label>
                <button
                  type="button"
                  className={`member-picker-toggle ${showCreateMemberPicker ? "open" : ""}`}
                  onClick={() => setShowCreateMemberPicker((prev) => !prev)}
                >
                  <span>
                    {projectForm.memberIds.length > 0
                      ? `${projectForm.memberIds.length} selected`
                      : "Select employees"}
                  </span>
                  <span>{showCreateMemberPicker ? "▲" : "▼"}</span>
                </button>

                {showCreateMemberPicker && (
                  <div className="member-picker-panel">
                    <div className="member-search">
                      <input
                        type="text"
                        className="member-search-input"
                        placeholder="Search employees by name or email"
                        value={createMemberSearch}
                        onChange={(e) => setCreateMemberSearch(e.target.value)}
                      />
                    </div>
                    <div className="member-picker member-picker-compact">
                      {filteredCreateEmployees.length === 0 ? (
                        <p className="member-empty">No matching employees.</p>
                      ) : (
                        filteredCreateEmployees.map((emp) => (
                          <label key={emp.uid} className="member-option">
                            <input
                              type="checkbox"
                              checked={projectForm.memberIds.includes(emp.uid)}
                              onChange={() =>
                                handleProjectFormMemberToggle(emp.uid)
                              }
                            />
                            <span>{emp.fullName || emp.email}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
                <p className="member-summary">
                  {projectForm.memberIds.length} selected
                </p>
                {projectForm.memberIds.length > 0 && (
                  <div className="member-selected-preview">
                    {projectForm.memberIds.slice(0, 4).map((memberId) => {
                      const member = employeeById.get(memberId);
                      if (!member) return null;
                      return (
                        <span key={member.uid} className="member-selected-chip">
                          {member.fullName || member.email}
                        </span>
                      );
                    })}
                    {projectForm.memberIds.length > 4 && (
                      <span className="member-selected-chip">
                        +{projectForm.memberIds.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button className="btn-gradient" disabled={submittingProject}>
                {submittingProject ? "Creating..." : "Create Project"}
              </button>
            </form>

            <form className="form-card" onSubmit={handleCreateTask}>
              <h2>
                <span>✨</span> New Task
              </h2>
              <div className="input-group">
                <label>Task Name</label>
                <input
                  className="styled-input"
                  placeholder="e.g. Design landing page"
                  value={taskForm.title}
                  disabled={!selectedProjectId}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-row-two">
                <div className="input-group">
                  <label>Urgency</label>
                  <select
                    className="styled-select"
                    value={taskForm.urgency}
                    disabled={!selectedProjectId}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        urgency: e.target.value as TaskUrgency,
                      })
                    }
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
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, deadline: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Assignee</label>
                <select
                  className="styled-select"
                  value={taskForm.assignedTo}
                  disabled={!selectedProjectId}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, assignedTo: e.target.value })
                  }
                >
                  <option value="">Select a project member (optional)</option>
                  {selectedProjectMembers.map((emp) => (
                    <option key={emp.uid} value={emp.uid}>
                      {emp.fullName || emp.email}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-gradient"
                disabled={submittingTask || !selectedProjectId}
              >
                {submittingTask ? "Adding..." : "Add Task"}
              </button>
            </form>
          </div>
        )}

        <div className="project-switcher">
          <div className="project-select-wrap">
            <label className="select-active-project-label">
              Select Active Project
            </label>
            {loadingProjects ? (
              <div className="loading-spinner loading-spinner-inline" />
            ) : projects.length === 0 ? (
              <p className="no-projects-text">No projects found.</p>
            ) : (
              <select
                className="styled-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="project-info-mini">
            {selectedProject && (
              <>
                <h3>{selectedProject.title}</h3>
                <p>
                  {selectedProject.description ||
                    "No description provided for this project."}
                </p>
                <div className="project-members-list">
                  {selectedProjectMembers.length > 0 ? (
                    selectedProjectMembers.map((member) => (
                      <span key={member.uid} className="project-member-chip">
                        {member.fullName || member.email}
                      </span>
                    ))
                  ) : (
                    <span className="project-member-chip project-member-chip-muted">
                      No members added
                    </span>
                  )}
                </div>

                {role === "admin" && selectedProjectId && (
                  <div className="project-edit-members">
                    <label className="edit-members-label">
                      Edit Project Members
                    </label>
                    <button
                      type="button"
                      className={`member-picker-toggle ${showEditMemberPicker ? "open" : ""}`}
                      onClick={() => setShowEditMemberPicker((prev) => !prev)}
                    >
                      <span>
                        {projectMembersDraft.length > 0
                          ? `${projectMembersDraft.length} selected`
                          : "Select employees"}
                      </span>
                      <span>{showEditMemberPicker ? "▲" : "▼"}</span>
                    </button>

                    {showEditMemberPicker && (
                      <div className="member-picker-panel">
                        <div className="member-search">
                          <input
                            type="text"
                            className="member-search-input"
                            placeholder="Search employees by name or email"
                            value={editMemberSearch}
                            onChange={(e) =>
                              setEditMemberSearch(e.target.value)
                            }
                          />
                        </div>
                        <div className="member-picker member-picker-compact">
                          {filteredEditEmployees.length === 0 ? (
                            <p className="member-empty">
                              No matching employees.
                            </p>
                          ) : (
                            filteredEditEmployees.map((emp) => (
                              <label key={emp.uid} className="member-option">
                                <input
                                  type="checkbox"
                                  checked={projectMembersDraft.includes(
                                    emp.uid,
                                  )}
                                  onChange={() =>
                                    handleProjectDraftMemberToggle(emp.uid)
                                  }
                                />
                                <span>{emp.fullName || emp.email}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    <p className="member-summary">
                      {projectMembersDraft.length} selected
                    </p>
                    <button
                      className="btn-gradient save-members-btn"
                      type="button"
                      disabled={savingProjectMembers}
                      onClick={handleSaveProjectMembers}
                    >
                      {savingProjectMembers ? "Saving..." : "Save Members"}
                    </button>
                  </div>
                )}
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
                        const isClaimable =
                          role === "employee" && !task.assignedTo;

                        return (
                          <div
                            key={task.id}
                            className="task-card"
                            draggable={canMoveTask(task)}
                            onDragStart={(e) => {
                              if (task.id)
                                e.dataTransfer.setData("task-id", task.id);
                            }}
                          >
                            <span
                              className={`task-urgency ${config.className}`}
                            >
                              {config.label}
                            </span>
                            <h4 className="task-title">{task.title}</h4>
                            {task.description && (
                              <p className="task-desc">{task.description}</p>
                            )}

                            <div className="task-footer">
                              <div className="task-meta">
                                <div className="meta-item">
                                  <span>📅</span>
                                  <span>
                                    Due:{" "}
                                    <strong>
                                      {task.deadline
                                        ? new Date(
                                            task.deadline,
                                          ).toLocaleDateString()
                                        : "Flexible"}
                                    </strong>
                                  </span>
                                </div>
                                <div className="meta-item">
                                  <span>👤</span>
                                  <span>
                                    Assigned:{" "}
                                    <strong>
                                      {task.assignedToName || "Nobody"}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {role === "admin" ? (
                              <select
                                className="task-assignee-select"
                                value={task.assignedTo || ""}
                                onChange={(e) =>
                                  handleAdminAssignmentChange(
                                    task,
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">Unassigned</option>
                                {selectedProjectMembers.map((emp) => (
                                  <option key={emp.uid} value={emp.uid}>
                                    {emp.fullName || emp.email}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              isClaimable && (
                                <button
                                  className="claim-btn claim-btn-block"
                                  onClick={() => handleClaimTask(task)}
                                >
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
