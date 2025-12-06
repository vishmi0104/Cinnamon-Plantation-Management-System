import React, { useState, useEffect } from "react";
import { generateReport } from "../../../components/Report";
import {
  getWithRetry,
  postWithRetry,
} from "../../../api/retry";
import http from "../../../api/http";
import { FaFilePdf, FaPlus, FaBox, FaCheckCircle, FaTimes, FaExclamationTriangle, FaSignOutAlt, FaTruck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ProductionDeliveryDashboard = () => {
  const [finalProducts, setFinalProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "kg",
    reorderLevel: "",
    description: "",
    batchId: "",
    amount: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const currentUserRole = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  const fetchFinalProducts = async () => {
    try {
      const res = await getWithRetry("/inventory", 3);
      // Filter only final products
      const products = res.data.filter(item => item.category === "final product");
      setFinalProducts(products);
    } catch (err) {
      console.error("❌ Failed to fetch final products:", err.message);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await http.get("/health");
        await fetchFinalProducts();
      } catch {
        setTimeout(fetchFinalProducts, 1000);
      }
    })();
  }, []);

  const handleAddProduct = () => {
    setFormData({
      name: "",
      quantity: "",
      unit: "kg",
      reorderLevel: "",
      description: "",
      batchId: "",
      amount: "",
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "⚠️ Product name is required";
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "⚠️ Quantity must be greater than 0";
    }
    if (!formData.reorderLevel || formData.reorderLevel < 0) {
      newErrors.reorderLevel = "⚠️ Reorder level cannot be negative";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await postWithRetry("/inventory/final-product", formData);
      await fetchFinalProducts();
      setModalOpen(false);
      setFormData({
        name: "",
        quantity: "",
        unit: "kg",
        reorderLevel: "",
        description: "",
        batchId: "",
        amount: "",
      });
      setErrors({});
      setSuccessMessage('Final product added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("❌ Error adding final product:", err.response?.data || err.message);
      setErrors({ submit: err.response?.data?.error || "Failed to add final product" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = () => {
    generateReport(
      "Production & Delivery Dashboard Report",
      ["Product Name", "Quantity", "Unit", "Status", "Batch ID", "Description"],
      finalProducts.map((product) => [
        product.name,
        product.quantity,
        product.unit,
        product.status,
        product.relatedBatchId || "N/A",
        product.description || "",
      ]),
      "ProductionDeliveryDashboardReport.pdf"
    );
  };

  const filteredProducts = finalProducts.filter(
    (product) =>
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase()) ||
      product.relatedBatchId?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    return status === "Available" ? "bg-green-100 text-green-800" :
           status === "Low Stock" ? "bg-yellow-100 text-yellow-800" :
           "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 p-4 sm:p-6 rounded-2xl backdrop-blur-sm bg-white/30 border border-white/20 shadow-lg gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-30"></div>
                <div className="relative p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <FaTruck className="text-xl sm:text-2xl text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                  Production & Delivery Dashboard
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Manage Final Products & Deliveries</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full border border-white/30 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${currentUserRole === 'support' ? 'bg-green-500' : currentUserRole === 'inventory' ? 'bg-blue-500' : 'bg-purple-500'} animate-pulse`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {currentUserRole === 'support' ? 'Support Manager' : currentUserRole === 'inventory' ? 'Inventory Manager' : 'Production Manager'}
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
            Track final products from production and manage deliveries
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <FaCheckCircle className="text-green-600 text-lg sm:text-xl flex-shrink-0" />
              <p className="text-green-800 font-medium text-sm sm:text-base">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <FaBox className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                placeholder="Search final products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:border-purple-300 transition-all duration-200 text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddProduct}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
              >
                <FaPlus className="flex-shrink-0" />
                <span>Add Product</span>
              </button>
              <button
                onClick={handleReport}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
              >
                <FaFilePdf className="flex-shrink-0" />
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-purple-100 hover:shadow-lg hover:border-purple-200 transition-all duration-200">
              <div className="p-4 sm:p-6">
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500">Batch: {product.relatedBatchId || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                </div>

                {/* Quantity */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <FaBox className="text-purple-500" />
                    <span className="text-lg font-bold text-gray-900">{product.quantity} {product.unit}</span>
                  </div>
                  {product.status === 'Low Stock' && (
                    <div className="flex items-center gap-2 mt-2">
                      <FaExclamationTriangle className="text-yellow-500" />
                      <span className="text-sm text-yellow-700">Reorder level: {product.reorderLevel} {product.unit}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-gray-700 mb-4 line-clamp-2 text-sm">{product.description}</p>
                )}

                {/* Date */}
                <div className="text-xs text-gray-500">
                  Added: {new Date(product.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-purple-400 mb-4">
              <FaTruck className="mx-auto text-3xl sm:text-4xl" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No final products found</h3>
            <p className="text-gray-500 text-sm sm:text-base">Final products from production will appear here</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-purple-100 transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
                <FaTruck className="text-purple-600 text-lg sm:text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  Add Final Product
                </h2>
                <p className="text-gray-600 text-sm">Add product from production to inventory</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                  {errors.quantity && (
                    <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="pieces">pieces</option>
                    <option value="boxes">boxes</option>
                    <option value="bags">bags</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reorder Level *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter reorder level"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                />
                {errors.reorderLevel && (
                  <p className="text-red-600 text-sm mt-1">{errors.reorderLevel}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch ID
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter batch ID"
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Revenue)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter revenue amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none shadow-sm transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter product description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {errors.submit && (
              <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <FaTimes className="text-red-600 text-sm flex-shrink-0" />
                  <p className="text-red-700 text-sm font-medium">{errors.submit}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
              <button
                onClick={() => setModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isSubmitting}
                className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    Add Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionDeliveryDashboard;
