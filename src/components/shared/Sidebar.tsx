"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { NotificationBell } from "./NotificationBell";

const AdminIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const ProjectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const EmployeesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const DeptIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const LeaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MessagesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const AttendanceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", Icon: AdminIcon },
  { href: "/admin/projects", label: "Projects", Icon: ProjectIcon },
  { href: "/admin/employees", label: "Employees", Icon: EmployeesIcon },
  { href: "/admin/departments", label: "Departments", Icon: DeptIcon },
  { href: "/admin/leave-requests", label: "Leave Requests", Icon: LeaveIcon },
  { href: "/admin/messages", label: "Messages", Icon: MessagesIcon },
];

const employeeLinks = [
  { href: "/employee/dashboard", label: "Dashboard", Icon: AdminIcon },
  { href: "/employee/projects", label: "Projects", Icon: ProjectIcon },
  { href: "/employee/attendance", label: "Attendance", Icon: AttendanceIcon },
  { href: "/employee/leave", label: "Leave Requests", Icon: LeaveIcon },
  { href: "/employee/messages", label: "Messages", Icon: MessagesIcon },
];

export const Sidebar = () => {
  const { role, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const links = role === "admin" ? adminLinks : employeeLinks;
  const profileHref = role === "admin" ? "/admin/profile" : "/employee/profile";
  const initials = ((user as any)?.fullName?.[0] || (role === "admin" ? "A" : "E")).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .sidebar-wrap {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
          border-right: 1px solid #e8eaf0;
          font-family: 'Inter', sans-serif;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1.25rem 1.25rem 1rem;
          border-bottom: 1px solid #f1f3f8;
        }

        .sidebar-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-logo-text {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.01em;
        }

        .sidebar-logo-text span {
          color: #6366f1;
        }

        .sidebar-profile {
          text-decoration: none;
          display: block;
        }

        .sidebar-profile-inner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border-radius: 0.75rem;
          transition: background 0.2s;
        }

        .sidebar-profile-inner:hover {
          background: #f8faff;
        }

        .sidebar-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
          object-fit: cover;
        }

        .sidebar-profile-text {
          flex: 1;
          min-width: 0;
        }

        .sidebar-profile-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-profile-role {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 1px;
          text-transform: capitalize;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0.75rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          overflow-y: auto;
        }

        .sidebar-nav-label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          padding: 0.35rem 0.75rem 0.5rem;
          margin-top: 0.25rem;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.85rem;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }

        .sidebar-link:hover {
          background: #f5f7ff;
          color: #6366f1;
        }

        .sidebar-link.active {
          background: #eef0ff;
          color: #6366f1;
          font-weight: 600;
        }

        .sidebar-link.active .sidebar-link-icon {
          color: #6366f1;
        }

        .sidebar-link-icon {
          flex-shrink: 0;
          opacity: 0.75;
        }

        .sidebar-link.active .sidebar-link-icon {
          opacity: 1;
        }

        .sidebar-footer {
          padding: 0.85rem 1rem 1.25rem;
          border-top: 1px solid #f1f3f8;
        }

        .sidebar-logout {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 0.85rem;
          border-radius: 0.625rem;
          border: none;
          background: transparent;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          font-family: 'Inter', sans-serif;
          text-align: left;
        }

        .sidebar-logout:hover {
          background: #fff1f2;
          color: #ef4444;
        }
      `}</style>

      <div className="sidebar-wrap">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="20" height="14" viewBox="0 0 32 22" fill="none">
              <path d="M2 16 Q8 4 14 11 Q20 18 26 6 Q29 1 30 8" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M2 19 Q8 7 14 14 Q20 21 26 9 Q29 4 30 11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">Work<span>Stream</span></span>
        </div>

        {/* Profile */}
        <div className="sidebar-profile-container flex items-center justify-between border-b border-[#f1f3f8] px-4 py-3">
          <Link href={profileHref} className="sidebar-profile flex-1 min-w-0 mr-2">
            <div className="sidebar-profile-inner">
              {(user as any)?.profileImage ? (
                <img
                  src={(user as any).profileImage}
                  alt={(user as any).fullName || "User"}
                  className="sidebar-avatar"
                />
              ) : (
                <div className="sidebar-avatar">{initials}</div>
              )}
              <div className="sidebar-profile-text">
                <p className="sidebar-profile-name">{(user as any)?.fullName || (role === "admin" ? "Admin" : "Employee")}</p>
                <p className="sidebar-profile-role">{(user as any)?.position || role}</p>
              </div>
            </div>
          </Link>
          <div className="shrink-0">
            <NotificationBell />
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="sidebar-nav-label">Main Menu</p>
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${pathname === href || pathname.startsWith(href + "/") ? " active" : ""}`}
            >
              <span className="sidebar-link-icon"><Icon /></span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogoutIcon />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
};
