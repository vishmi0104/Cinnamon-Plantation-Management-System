import React, { useEffect, useState } from "react";
import http from "../../api/http";
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function InventoryManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "harvest",
    quantity: "",
    unit: "kg",
    price: "",
    reorderLevel: "",
    description: "",
    supplier: "",
  });

  // Prepare chart data
  const barChartData = {
    labels: items.map(item => item.name),
    datasets: [
      {
        label: 'Quantity',
        data: items.map(item => item.quantity),
        backgroundColor: 'rgba(216, 119, 6, 0.6)',
        borderColor: 'rgba(216, 119, 6, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Inventory Quantities',
      },
    },
  };

  const pieChartData = {
    labels: ['Harvest', 'Resource', 'Final Product'],
    datasets: [
      {
        data: [
          items.filter(item => item.category === 'harvest').length,
          items.filter(item => item.category === 'resource').length,
          items.filter(item => item.category === 'final product').length,
        ],
        backgroundColor: [
          'rgba(216, 119, 6, 0.8)',
          'rgba(181, 83, 10, 0.8)',
          'rgba(216, 119, 6, 0.6)',
        ],
        borderColor: [
          'rgba(216, 119, 6, 1)',
          'rgba(181, 83, 10, 1)',
          'rgba(216, 119, 6, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Items by Category',
      },
    },
  };

  // Fetch inventory items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await http.get("/inventory");
      setItems(response.data);
    } catch (err) {
      setError("Failed to load inventory items");
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "harvest",
      quantity: "",
      unit: "kg",
      price: "",
      reorderLevel: "",
      description: "",
      supplier: "",
    });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await http.post("/inventory", formData);
      setShowAddModal(false);
      resetForm();
      fetchItems();
      alert("Item added successfully!");
    } catch (err) {
      alert("Failed to add item: " + err.response?.data?.error || err.message);
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    try {
      await http.put(`/inventory/${editingItem._id}`, formData);
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
      alert("Item updated successfully!");
    } catch (err) {
      alert("Failed to update item: " + err.response?.data?.error || err.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await http.delete(`/inventory/${itemId}`);
      fetchItems();
      alert("Item deleted successfully!");
    } catch (err) {
      alert("Failed to delete item: " + err.response?.data?.error || err.message);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price || "",
      reorderLevel: item.reorderLevel,
      description: item.description,
      supplier: item.supplier,
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return '✅';
      case 'Low Stock': return '⚠️';
      case 'Out of Stock': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-orange-100 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-white text-lg font-bold">C</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Cinnex</span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => window.location.href = "/inventory"}
                className="text-[#d87706] px-4 py-2 text-sm font-semibold transition-all duration-200 border-b-2 border-[#d87706] bg-orange-50 rounded-t-lg"
              >
                📦 Inventory Management
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-[#d87706] to-[#b5530a] hover:from-[#b5530a] hover:to-[#d87706] text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="relative mb-16">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#d87706]/20 to-[#b5530a]/20 rounded-full opacity-60 blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[#b5530a]/20 to-[#d87706]/20 rounded-full opacity-60 blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#d87706]/10 to-[#b5530a]/10 rounded-full blur-3xl"></div>
            </div>

            <div className="text-center relative">
              {/* Main Icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-3xl mb-8 shadow-2xl transform hover:scale-105 transition-all duration-300 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#b5530a] to-[#d87706] rounded-3xl blur opacity-50"></div>
                <span className="text-4xl filter drop-shadow-sm relative z-10">📦</span>
              </div>

              {/* Title with gradient */}
              <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-gray-900 via-[#d87706] to-gray-900 bg-clip-text text-transparent mb-6 leading-tight">
                Inventory Management
              </h1>

              {/* Subtitle */}
              <div className="max-w-4xl mx-auto">
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  Comprehensive inventory management system for plantation operations
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-[#d87706] to-[#b5530a] mx-auto rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          {!loading && !error && items.length > 0 && (
            <div className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <div className="relative bg-white rounded-3xl shadow-xl border border-orange-100 p-8 hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-xl">
                        <span className="text-white text-lg">📊</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Inventory Quantities</h3>
                    </div>
                    <div className="h-64">
                      <Bar data={barChartData} options={barChartOptions} />
                    </div>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#b5530a] to-[#d87706] rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <div className="relative bg-white rounded-3xl shadow-xl border border-orange-100 p-8 hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-[#b5530a] to-[#d87706] rounded-xl">
                        <span className="text-white text-lg">📈</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Items by Category</h3>
                    </div>
                    <div className="h-64 flex items-center justify-center">
                      <Pie data={pieChartData} options={pieChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto mb-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Inventory</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Inventory Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {items.map((item, index) => (
                <div
                  key={item._id}
                  className="group relative transform hover:scale-105 transition-all duration-300"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Background glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  
                  <div className="relative bg-white rounded-3xl shadow-xl border border-orange-100 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#d87706] to-[#b5530a] p-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-full h-full bg-white rounded-3xl"></div>
                    </div>

                    {/* Item Header */}
                    <div className="relative p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-xl shadow-lg">
                              <span className="text-white text-lg">
                                {item.category === "harvest" && "🌾"}
                                {item.category === "resource" && "🛠️"}
                                {item.category === "final product" && "🏷️"}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#d87706] transition-colors duration-300">
                                {item.name}
                              </h3>
                              <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">
                                {item.category.replace('-', ' ')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(item.status)}`}>
                          <span className="mr-1">{getStatusIcon(item.status)}</span>
                          {item.status}
                        </span>
                      </div>

                      {/* Item Details */}
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">Item ID</span>
                            <span className="font-mono text-sm text-gray-800 bg-white px-3 py-1 rounded-lg shadow-sm">
                              {item.itemId}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">Price per {item.unit}</span>
                            <span className="font-bold text-lg text-green-600">
                              ${item.price?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">Quantity</span>
                            <span className="font-bold text-gray-900">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Reorder Level</span>
                            <span className="font-semibold text-[#d87706]">
                              {item.reorderLevel} {item.unit}
                            </span>
                          </div>
                        </div>
                        
                        {item.supplier && (
                          <div className="bg-white rounded-xl p-3 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700">Supplier</span>
                              <span className="text-sm font-medium text-gray-900">
                                {item.supplier}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="relative px-6 pb-6">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => openEditModal(item)}
                          className="flex-1 group/btn relative overflow-hidden bg-gradient-to-r from-[#d87706] to-[#b5530a] text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[#b5530a] to-[#d87706] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center justify-center gap-2">
                            <span>✏️</span>
                            <span className="text-sm">Edit</span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="flex-1 group/btn relative overflow-hidden bg-gradient-to-r from-red-500 to-rose-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center justify-center gap-2">
                            <span>🗑️</span>
                            <span className="text-sm">Delete</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d87706] to-[#b5530a]"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && items.length === 0 && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-3xl shadow-xl border border-orange-100 p-12 text-center max-w-lg mx-auto">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#d87706] to-[#b5530a] rounded-2xl mb-4 shadow-lg">
                    <span className="text-4xl">📦</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No Inventory Items Yet</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">Start building your inventory by adding your first item. Track stock levels, manage prices, and organize your plantation resources efficiently.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-[#d87706] to-[#b5530a] hover:from-[#b5530a] hover:to-[#d87706] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Add First Item
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Item</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddItem} className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="harvest">Harvest</option>
                  <option value="resource">Resource</option>
                  <option value="final product">Final Product</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per {formData.unit} *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="Item description"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Edit Item</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditItem} className="p-6 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="harvest">Harvest</option>
                  <option value="resource">Resource</option>
                  <option value="final product">Final Product</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per {formData.unit} *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({...formData, reorderLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="Item description"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
