import React from "react";
import { FaCheckCircle } from "react-icons/fa";

const SuccessMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-6 sm:mb-8 relative group">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>

      {/* Main container */}
      <div className="relative bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-emerald-100/50">
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-green-400 p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="w-full h-full bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 rounded-2xl"></div>
        </div>

        <div className="relative flex items-center gap-4">
          {/* Icon with animation */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-green-500 p-2 rounded-full shadow-lg">
              <FaCheckCircle className="text-white text-xl sm:text-2xl drop-shadow-sm" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Success</span>
              <div className="w-8 h-px bg-gradient-to-r from-emerald-400 to-transparent"></div>
            </div>
            <p className="text-emerald-900 font-medium text-sm sm:text-base leading-relaxed">{message}</p>
          </div>

          {/* Decorative element */}
          <div className="hidden sm:flex flex-col gap-1 opacity-30">
            <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
            <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
            <div className="w-1 h-1 bg-green-400 rounded-full"></div>
          </div>
        </div>

        {/* Progress bar animation */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-200 rounded-b-2xl overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-green-400 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;