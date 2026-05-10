"use client";

import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { ProjectLeaderboard } from "@/components/tasks/ProjectLeaderboard";

export default function AdminProjectsPage() {
  return (
    <div className="flex flex-col xl:flex-row gap-6 p-4 md:p-6 lg:p-8 min-h-screen bg-slate-50 items-start">
      <div className="flex-1 w-full min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-1">
        <KanbanBoard />
      </div>
      <ProjectLeaderboard />
    </div>
  );
}
