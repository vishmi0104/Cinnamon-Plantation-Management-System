import React from "react";
import { FaSignOutAlt, FaBox } from "react-icons/fa";

const DashboardHeader = ({ currentUserRole, handleLogout }) => {
  return (
    <div className="mb-6 sm:mb-8 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 p-4 sm:p-6 rounded-2xl backdrop-blur-sm bg-white/30 border border-white/20 shadow-lg gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full blur-lg opacity-30"></div>
            <div className="relative p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
              <FaBox className="text-xl sm:text-2xl text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
              Inventory Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Manage Plantation Resources</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full border border-white/30 backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${currentUserRole === 'support' ? 'bg-orange-500' : currentUserRole === 'inventory' ? 'bg-orange-500' : 'bg-purple-500'} animate-pulse`}></div>
            <span className="text-sm font-medium text-gray-700">
              {currentUserRole === 'support' ? 'Support Manager' : currentUserRole === 'inventory' ? 'Inventory Manager' : 'Consultation Manager'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="group relative flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 text-sm"
            title="Logout"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200 rounded-xl"></div>
            <FaSignOutAlt className="text-sm relative z-10" />
            <span className="relative z-10 hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
      <p className="text-gray-600 text-center font-medium px-3 sm:px-6 text-sm sm:text-base">
        Comprehensive inventory management for plantation operations
      </p>
    </div>
  );
};

export default DashboardHeader;