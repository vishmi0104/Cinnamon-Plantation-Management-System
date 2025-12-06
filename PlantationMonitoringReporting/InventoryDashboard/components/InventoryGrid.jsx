import React from "react";
import { FaBox, FaSearch, FaPlus } from "react-icons/fa";
import InventoryItem from "./InventoryItem";

const InventoryGrid = ({
  filteredInventory,
  getStatusColor,
  getCategoryColor,
  handleEditItem,
  handleDeleteItem,
  handleAllocateToResponse
}) => {
  return (
    <div className="relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/20 to-white"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#d87706] rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#b5530a] rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#d87706] rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {filteredInventory.length > 0 ? (
          <>
            {/* Grid header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-xl blur-lg opacity-20"></div>
                  <div className="relative p-3 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-xl shadow-lg">
                    <FaBox className="text-white text-xl" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Inventory Items
                  </h2>
                  <p className="text-sm text-gray-600 font-medium">
                    {filteredInventory.length} item{filteredInventory.length !== 1 ? 's' : ''} in stock
                  </p>
                </div>
              </div>
              <div className="w-full h-px bg-gradient-to-r from-[#d87706]/20 via-[#b5530a]/20 to-transparent"></div>
            </div>

            {/* Inventory grid */}
            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredInventory.map((item, index) => (
                <div
                  key={item._id}
                  className="transform hover:scale-105 transition-all duration-300"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <InventoryItem
                    item={item}
                    getStatusColor={getStatusColor}
                    getCategoryColor={getCategoryColor}
                    handleEditItem={handleEditItem}
                    handleDeleteItem={handleDeleteItem}
                    handleAllocateToResponse={handleAllocateToResponse}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Enhanced empty state */
          <div className="relative">
            {/* Empty state background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/30 to-white rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#d87706]/5 via-transparent to-[#b5530a]/5 rounded-3xl"></div>

            {/* Empty state content */}
            <div className="relative bg-white/80 backdrop-blur-sm border border-orange-100/50 rounded-3xl p-8 sm:p-12 text-center shadow-xl">
              {/* Animated icon */}
              <div className="relative mb-6 sm:mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#d87706] to-[#b5530a] rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300">
                  <FaBox className="text-white text-3xl sm:text-4xl" />
                </div>
                {/* Floating elements */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#d87706] rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-[#b5530a] rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  No Inventory Items Found
                </h3>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                  Your inventory is currently empty. Start by adding your first item to begin managing your plantation resources effectively.
                </p>

                {/* Action suggestions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
                  <div className="flex items-center gap-2 text-[#d87706] font-medium">
                    <FaSearch className="text-sm" />
                    <span className="text-sm">Try adjusting your search</span>
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-orange-200"></div>
                  <div className="flex items-center gap-2 text-[#b5530a] font-medium">
                    <FaPlus className="text-sm" />
                    <span className="text-sm">Add new items</span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-20">
                <div className="w-2 h-2 bg-[#d87706] rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-[#b5530a] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-2 h-2 bg-[#d87706] rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default InventoryGrid;