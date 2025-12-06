import React from "react";
import { FaFilePdf, FaPlus, FaSearch } from "react-icons/fa";

const SearchControls = ({ search, setSearch, handleAddItem, handleReport }) => {
  return (
    <div className="mb-6 sm:mb-8 relative group">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#d87706] via-[#b5530a] to-[#d87706] rounded-2xl blur opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>

      {/* Main container */}
      <div className="relative bg-gradient-to-br from-white via-orange-50/30 to-white backdrop-blur-sm border border-white/50 rounded-2xl p-5 sm:p-6 shadow-xl shadow-orange-100/20">
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#d87706] via-[#b5530a] to-[#d87706] p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="w-full h-full bg-gradient-to-br from-white via-orange-50/30 to-white rounded-2xl"></div>
        </div>

        <div className="relative flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between">
          {/* Search Section */}
          <div className="flex-1 max-w-full lg:max-w-lg">
            <div className="relative group/search">
              {/* Search input glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-xl blur opacity-0 group-focus-within/search:opacity-30 transition-opacity duration-300"></div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <FaSearch className="text-[#d87706] text-lg group-focus-within/search:text-[#b5530a] transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  placeholder="Search inventory items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border-2 border-orange-200/50 rounded-xl focus:ring-0 focus:border-[#d87706] focus:bg-white/90 shadow-lg hover:shadow-xl hover:border-[#b5530a] transition-all duration-300 text-sm sm:text-base font-medium placeholder-orange-400/70"
                />
                {/* Animated underline */}
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#d87706] to-[#b5530a] scale-x-0 group-focus-within/search:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            {/* Add Item Button */}
            <button
              onClick={handleAddItem}
              className="group/btn relative overflow-hidden bg-gradient-to-r from-[#d87706] to-[#b5530a] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-6 py-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#b5530a] to-[#d87706] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                <div className="p-1 bg-white/20 rounded-lg group-hover/btn:bg-white/30 transition-colors duration-300">
                  <FaPlus className="text-sm" />
                </div>
                <span className="text-sm sm:text-base">Add Item</span>
              </div>
              {/* Button shine effect */}
              <div className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
            </button>

            {/* Report Button */}
            <button
              onClick={handleReport}
              className="group/btn relative overflow-hidden bg-gradient-to-r from-[#b5530a] to-[#d87706] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-6 py-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#d87706] to-[#b5530a] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-3">
                <div className="p-1 bg-white/20 rounded-lg group-hover/btn:bg-white/30 transition-colors duration-300">
                  <FaFilePdf className="text-sm" />
                </div>
                <span className="text-sm sm:text-base">Report</span>
              </div>
              {/* Button shine effect */}
              <div className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 flex gap-1 opacity-20">
          <div className="w-1 h-1 bg-[#d87706] rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-[#b5530a] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-[#d87706] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SearchControls;