"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export const Sidebar = () => {
  const { role, user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/employees", label: "Employees" },
    { href: "/admin/departments", label: "Departments" },
    { href: "/admin/leave-requests", label: "Leave Requests" }
  ];

  const employeeLinks = [
    { href: "/employee/dashboard", label: "Dashboard" },
    { href: "/employee/attendance", label: "Attendance" },
    { href: "/employee/leave", label: "Leave Requests" }
  ];

  const links = role === "admin" ? adminLinks : employeeLinks;

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 p-6">
        <h1 className="text-2xl font-bold">WorkStream</h1>
        <p className="text-sm text-slate-400 mt-1">Role: {role}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-slate-700 p-4">
        <p className="text-sm text-slate-400 mb-4">{user?.email}</p>
        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
