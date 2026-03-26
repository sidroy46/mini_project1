import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { username, role, logout } = useAuth();

  const navClassName = ({ isActive }) =>
    [
      "rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150",
      isActive
        ? "bg-gradient-to-r from-indigo-500/35 to-cyan-500/25 text-white ring-1 ring-cyan-300/40"
        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
    ].join(" ");

  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="w-72 border-r border-slate-700/70 bg-slate-950/60 p-6 backdrop-blur-xl">
          <Link to="/dashboard" className="mb-8 block bg-gradient-to-r from-indigo-200 via-cyan-200 to-fuchsia-200 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            FaceAttend Pro
          </Link>

          <nav className="space-y-2">
            <NavLink to="/dashboard" className={navClassName}>Dashboard</NavLink>
            <NavLink to="/students" className={navClassName}>Student Details</NavLink>
            {role === "ADMIN" && <NavLink to="/subjects" className={navClassName}>Subjects</NavLink>}
            <NavLink to="/attendance" className={navClassName}>Attendance</NavLink>
            <NavLink to="/reports" className={navClassName}>Reports</NavLink>
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.5)]">
            <p className="truncate text-sm font-semibold text-slate-100">{username}</p>
            <span className="mt-1 inline-block rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium tracking-wide text-cyan-200">
              {role}
            </span>
            <button
              onClick={logout}
              className="app-btn-secondary mt-4 w-full"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
