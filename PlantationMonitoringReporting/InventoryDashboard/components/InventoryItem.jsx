import React from "react";
import { FaBox, FaEdit, FaTrash, FaExclamationTriangle, FaShoppingCart, FaCalendarAlt, FaClock } from "react-icons/fa";

const InventoryItem = ({
  item,
  getStatusColor,
  getCategoryColor,
  handleEditItem,
  handleDeleteItem,
  handleAllocateToResponse
}) => {
  const isExpired = item.expireDate && new Date(item.expireDate) < new Date();
  const isLowStock = item.status === 'Low Stock';

  return (
    <div className="group relative">
      {/* Background glow effect */}
      <div className={`absolute -inset-1 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500 ${
        isLowStock ? 'bg-gradient-to-r from-[#d87706] via-[#b5530a] to-[#d87706]' :
        isExpired ? 'bg-gradient-to-r from-[#b5530a] via-[#d87706] to-[#b5530a]' :
        'bg-gradient-to-r from-[#d87706] via-[#b5530a] to-[#d87706]'
      }`}></div>

      {/* Main card */}
      <div className="relative bg-gradient-to-br from-white via-orange-50/50 to-white backdrop-blur-sm border border-white/60 rounded-2xl shadow-xl shadow-orange-200/50 hover:shadow-2xl hover:shadow-orange-300/60 transition-all duration-500 overflow-hidden">
        {/* Animated border */}
        <div className={`absolute inset-0 rounded-2xl p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isLowStock ? 'bg-gradient-to-r from-[#d87706] via-[#b5530a] to-[#d87706]' :
          isExpired ? 'bg-gradient-to-r from-[#b5530a] via-[#d87706] to-[#b5530a]' :
          'bg-gradient-to-r from-[#d87706] via-[#b5530a] to-[#d87706]'
        }`}>
          <div className="w-full h-full bg-gradient-to-br from-white via-orange-50/50 to-white rounded-2xl"></div>
        </div>

        <div className="relative p-5 sm:p-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl shadow-lg ${
                  isLowStock ? 'bg-gradient-to-br from-[#d87706] to-[#b5530a]' :
                  isExpired ? 'bg-gradient-to-br from-[#b5530a] to-[#d87706]' :
                  'bg-gradient-to-br from-[#d87706] to-[#b5530a]'
                }`}>
                  <FaBox className="text-white text-lg" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate group-hover:text-slate-800 transition-colors duration-300">
                    {item.name}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">{item.supplier}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold text-center shadow-sm ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-center ${getCategoryColor(item.category)}`}>
                {item.category}
              </span>
            </div>
          </div>

          {/* Quantity Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Current Stock</span>
                <span className={`text-2xl font-bold ${
                  isLowStock ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  {item.quantity} <span className="text-sm font-medium text-slate-600">{item.unit}</span>
                </span>
              </div>
              {isLowStock && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <FaExclamationTriangle className="text-sm animate-pulse" />
                    <span className="text-sm font-medium">Low Stock Alert</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FaShoppingCart className="text-amber-600 text-sm" />
                      <span className="text-xs font-semibold text-amber-800">RECOMMENDED ORDER</span>
                    </div>
                    <span className="text-sm font-bold text-amber-900">
                      {Math.max(0, parseFloat(item.reorderLevel) - parseFloat(item.quantity) + 5)} {item.unit}
                    </span>
                    <span className="text-xs text-amber-700 ml-2">(+5 unit buffer)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="mb-6">
              <p className="text-slate-700 text-sm leading-relaxed bg-white/50 rounded-lg p-3 border border-slate-200/30">
                {item.description}
              </p>
            </div>
          )}

          {/* Date Cards */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50 rounded-xl p-4 group/date hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <FaCalendarAlt className="text-[#d87706] text-sm" />
                <span className="text-xs font-bold text-[#b5530a] uppercase tracking-wide">Manufacture</span>
              </div>
              <div className="text-sm font-semibold text-orange-900">
                {item.manufactureDate ? new Date(item.manufactureDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'Not specified'}
              </div>
            </div>

            <div className={`border rounded-xl p-4 group/date hover:shadow-md transition-all duration-300 ${
              isExpired
                ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200/50'
                : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200/50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <FaClock className={`text-sm ${isExpired ? 'text-red-600' : 'text-[#d87706]'}`} />
                <span className={`text-xs font-bold uppercase tracking-wide ${isExpired ? 'text-red-800' : 'text-[#b5530a]'}`}>
                  Expiry
                </span>
              </div>
              <div className={`text-sm font-semibold ${isExpired ? 'text-red-900' : 'text-orange-900'}`}>
                {item.expireDate ? new Date(item.expireDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'Not specified'}
                {isExpired && (
                  <span className="ml-2 text-xs text-red-600 font-bold animate-pulse">(EXPIRED)</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleEditItem(item)}
                className="group/btn relative overflow-hidden bg-gradient-to-r from-[#d87706] to-[#b5530a] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-3 px-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#b5530a] to-[#d87706] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <FaEdit className="text-sm" />
                  <span className="text-sm">Edit</span>
                </div>
              </button>

              <button
                onClick={() => handleDeleteItem(item._id)}
                className="group/btn relative overflow-hidden bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-3 px-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <FaTrash className="text-sm" />
                  <span className="text-sm">Delete</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => handleAllocateToResponse(item)}
              className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-[#b5530a] to-[#d87706] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 py-3 px-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#d87706] to-[#b5530a] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-2">
                <FaBox className="text-sm" />
                <span className="text-sm">Allocate to Response</span>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
          isLowStock ? 'from-[#d87706] via-[#b5530a] to-[#d87706]' :
          isExpired ? 'from-[#b5530a] via-[#d87706] to-[#b5530a]' :
          'from-[#d87706] via-[#b5530a] to-[#d87706]'
        }`}></div>
      </div>
    </div>
  );
};

export default InventoryItem;