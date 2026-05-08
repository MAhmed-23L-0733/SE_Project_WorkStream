import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Sidebar } from "@/components/shared/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-slate-50">
        <aside className="w-64 overflow-y-auto">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
