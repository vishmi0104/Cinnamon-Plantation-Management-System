// src/components/Header.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Header({ role }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("role");
    navigate("/");
    window.location.reload();
  };

  const getHomePath = () => {
    switch (role) {
      case "plantation":
        return "/overview";
      case "consultation":
        return "/consultation-dashboard";
      case "inventory":
        return "/inventory-dashboard";
      case "support":
        return "/support-dashboard";
      default:
        return "/";
    }
  };

  return (
    <header className="bg-amber-600 text-white py-6 shadow-md">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        {/* Logo + Title */}
        <div className="flex items-center gap-4">
          {/* ✅ Using logo from public folder */}
          <img src="/logo_trans2.png" alt="Cinnex Logo" className="h-16 w-16" />
          <h1 className="text-3xl font-extrabold tracking-wide">
            Plantation Monitoring & Reporting
          </h1>
        </div>

        {/* Navigation + Logout */}
        <div className="flex items-center gap-8 text-lg font-semibold">
          <nav className="space-x-10">
            <a href={getHomePath()} className="hover:underline">
              Home
            </a>
          </nav>

          {role && (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
