import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Sidebar } from "@/components/shared/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div style={{ display: "flex", height: "100vh", background: "#f5f7ff" }}>
        <aside style={{ width: "240px", flexShrink: 0, overflow: "hidden" }}>
          <Sidebar />
        </aside>
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
