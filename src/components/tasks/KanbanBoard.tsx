"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { Project, ProjectTask, TaskStatus, TaskUrgency, User } from "@/types";

const STATUS_COLUMNS: Array<{ key: TaskStatus; label: string }> = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" }
];

const urgencyClasses: Record<TaskUrgency, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-700"
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
    employees.forEach((employee) => {
      map.set(employee.uid, employee);
    });
    return map;
  }, [employees]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoadingProjects(true);
      try {
        const [projectList, employeeList] = await Promise.all([
          firebaseHelpers.getAllProjects(),
          firebaseHelpers.getEmployees()
        ]);

        setProjects(projectList);
        setEmployees(employeeList);

        if (!selectedProjectId && projectList.length > 0) {
          setSelectedProjectId(projectList[0].id || "");
        }

        if (projectList.length === 0) {
          setSelectedProjectId("");
        }
        setErrorMessage(null);
      } catch (error) {
        console.error("Error loading projects:", error);
        setErrorMessage("Could not load projects.");
      } finally {
        setLoadingProjects(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedProjectId, user?.uid]);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoadingTasks(true);
      try {
        const projectTasks = await firebaseHelpers.getProjectTasks(selectedProjectId);
        setTasks(projectTasks);
        setErrorMessage(null);
      } catch (error) {
        console.error("Error loading tasks:", error);
        setErrorMessage("Could not load tasks for this project.");
      } finally {
        setLoadingTasks(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedProjectId]);

  const refreshTasks = async () => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }

    const projectTasks = await firebaseHelpers.getProjectTasks(selectedProjectId);
    setTasks(projectTasks);
  };

  const handleCreateProject = async (event: FormEvent) => {
    event.preventDefault();
    if (role !== "admin" || !user?.uid || !projectForm.title.trim()) {
      return;
    }

    setSubmittingProject(true);
    try {
      await firebaseHelpers.createProject({
        title: projectForm.title,
        description: projectForm.description,
        createdBy: user.uid,
        createdByName: user.fullName || user.email || "Admin"
      });

      const projectList = await firebaseHelpers.getAllProjects();
      setProjects(projectList);
      if (projectList.length > 0) {
        setSelectedProjectId(projectList[0].id || "");
      }
      setProjectForm({ title: "", description: "" });
      setErrorMessage(null);
    } catch (error) {
      console.error("Error creating project:", error);
      setErrorMessage("Could not create project.");
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault();
    if (role !== "admin" || !user?.uid || !selectedProjectId || !taskForm.title.trim()) {
      return;
    }

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
      setErrorMessage(null);
    } catch (error) {
      console.error("Error creating task:", error);
      setErrorMessage("Could not create task.");
    } finally {
      setSubmittingTask(false);
    }
  };

  const canMoveTask = (task: ProjectTask) => {
    if (!user?.uid) {
      return false;
    }
    if (role === "admin") {
      return true;
    }
    return task.assignedTo === user.uid;
  };

  const handleStatusDrop = async (event: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("task-id");
    if (!taskId) {
      return;
    }

    const targetTask = tasks.find((task) => task.id === taskId);
    if (!targetTask || !targetTask.id || targetTask.status === status || !canMoveTask(targetTask)) {
      return;
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status, updatedAt: new Date().toISOString() }
          : task
      )
    );

    try {
      await firebaseHelpers.updateTaskStatus(taskId, status);
      setErrorMessage(null);
    } catch (error) {
      console.error("Error updating task status:", error);
      setErrorMessage("Could not update task status.");
      await refreshTasks();
    }
  };

  const handleClaimTask = async (task: ProjectTask) => {
    if (!task.id || !user?.uid) {
      return;
    }

    try {
      await firebaseHelpers.assignTask(task.id, user.uid, user.fullName || user.email || "Employee");
      await refreshTasks();
      setErrorMessage(null);
    } catch (error) {
      console.error("Error claiming task:", error);
      setErrorMessage("Could not assign task to yourself.");
    }
  };

  const handleAdminAssignmentChange = async (task: ProjectTask, assignedUserId: string) => {
    if (role !== "admin" || !task.id) {
      return;
    }

    try {
      if (!assignedUserId) {
        await firebaseHelpers.updateTask(task.id, { assignedTo: "", assignedToName: "" });
      } else {
        const assignedEmployee = employeeById.get(assignedUserId);
        if (!assignedEmployee) {
          return;
        }

        await firebaseHelpers.assignTask(
          task.id,
          assignedUserId,
          assignedEmployee.fullName || assignedEmployee.email
        );
      }

      await refreshTasks();
      setErrorMessage(null);
    } catch (error) {
      console.error("Error updating assignee:", error);
      setErrorMessage("Could not update task assignee.");
    }
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) {
      return "No deadline";
    }

    return new Date(deadline).toLocaleDateString();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Project Tasks</h1>
        <p className="mt-2 text-slate-600">
          {role === "admin"
            ? "Create projects, assign tasks, and manage progress in Kanban view."
            : "Track projects and claim tasks assigned to you."}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {role === "admin" && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <form onSubmit={handleCreateProject} className="rounded-xl bg-white p-5 shadow">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Create Project</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={projectForm.title}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Project title"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
              <textarea
                value={projectForm.description}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Project description"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={submittingProject}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submittingProject ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>

          <form onSubmit={handleCreateTask} className="rounded-xl bg-white p-5 shadow">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Create Task</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={taskForm.title}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Task title"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={!selectedProjectId}
                required
              />
              <textarea
                value={taskForm.description}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Task description"
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={!selectedProjectId}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={taskForm.urgency}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, urgency: event.target.value as TaskUrgency }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  disabled={!selectedProjectId}
                >
                  <option value="low">Low Urgency</option>
                  <option value="medium">Medium Urgency</option>
                  <option value="high">High Urgency</option>
                  <option value="critical">Critical Urgency</option>
                </select>

                <input
                  type="date"
                  value={taskForm.deadline}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, deadline: event.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  disabled={!selectedProjectId}
                />
              </div>
              <select
                value={taskForm.assignedTo}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={!selectedProjectId}
              >
                <option value="">Unassigned</option>
                {employees.map((employee) => (
                  <option key={employee.uid} value={employee.uid}>
                    {employee.fullName || employee.email}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submittingTask || !selectedProjectId}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submittingTask ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 rounded-xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Select Project</label>
        {loadingProjects ? (
          <p className="text-sm text-slate-500">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-slate-500">No projects available yet.</p>
        ) : (
          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            className="w-full max-w-lg rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        )}
        {selectedProject?.description && (
          <p className="mt-2 text-sm text-slate-600">{selectedProject.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {STATUS_COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);
          return (
            <div
              key={column.key}
              className="min-h-[420px] rounded-xl bg-slate-100 p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => void handleStatusDrop(event, column.key)}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{column.label}</h3>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                  {columnTasks.length}
                </span>
              </div>

              {loadingTasks ? (
                <p className="rounded-lg bg-white p-3 text-sm text-slate-500">Loading tasks...</p>
              ) : columnTasks.length === 0 ? (
                <p className="rounded-lg bg-white p-3 text-sm text-slate-500">No tasks in this column.</p>
              ) : (
                <div className="space-y-3">
                  {columnTasks.map((task) => {
                    const isClaimableByEmployee =
                      role === "employee" && (!task.assignedTo || task.assignedTo === user?.uid);

                    return (
                      <article
                        key={task.id}
                        draggable={canMoveTask(task)}
                        onDragStart={(event) => {
                          if (!task.id) {
                            return;
                          }
                          event.dataTransfer.setData("task-id", task.id);
                        }}
                        className="cursor-grab rounded-lg bg-white p-4 shadow-sm active:cursor-grabbing"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-slate-900">{task.title}</h4>
                          <span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase ${urgencyClasses[task.urgency]}`}>
                            {task.urgency}
                          </span>
                        </div>

                        {task.description && (
                          <p className="mb-3 text-sm text-slate-600">{task.description}</p>
                        )}

                        <div className="space-y-1 text-xs text-slate-600">
                          <p>
                            <span className="font-semibold">Deadline:</span> {formatDeadline(task.deadline)}
                          </p>
                          <p>
                            <span className="font-semibold">Assignee:</span> {task.assignedToName || "Unassigned"}
                          </p>
                        </div>

                        {role === "admin" ? (
                          <div className="mt-3">
                            <select
                              value={task.assignedTo || ""}
                              onChange={(event) => void handleAdminAssignmentChange(task, event.target.value)}
                              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">Unassigned</option>
                              {employees.map((employee) => (
                                <option key={employee.uid} value={employee.uid}>
                                  {employee.fullName || employee.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : isClaimableByEmployee && !task.assignedTo ? (
                          <button
                            onClick={() => void handleClaimTask(task)}
                            className="mt-3 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Assign To Me
                          </button>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
