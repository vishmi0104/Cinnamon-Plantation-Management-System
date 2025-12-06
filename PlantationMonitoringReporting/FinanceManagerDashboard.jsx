import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// 🔹 Helper: load an image from /public and return as Base64
async function loadImageAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch logo: " + url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export default function FinanceManagerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeSection, setActiveSection] = useState('orders');
  const navigate = useNavigate();

  // Prepare chart data
  const getOrderStatusData = () => {
    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      approved: orders.filter(o => o.status === 'approved').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
      completed: orders.filter(o => o.status === 'completed').length,
      payment_required: orders.filter(o => o.status === 'payment_required').length,
    };

    return {
      labels: ['Pending', 'Approved', 'Rejected', 'Completed', 'Payment Required'],
      datasets: [{
        data: [statusCounts.pending, statusCounts.approved, statusCounts.rejected, statusCounts.completed, statusCounts.payment_required],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)', // amber
          'rgba(34, 197, 94, 0.8)',  // green
          'rgba(239, 68, 68, 0.8)',  // red
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(147, 51, 234, 0.8)', // purple
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(147, 51, 234, 1)',
        ],
        borderWidth: 2,
      }],
    };
  };

  const getRevenueData = () => {
    // Group orders by month for the last 6 months
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        month: date.getMonth(),
        year: date.getFullYear(),
      });
    }

    const revenueData = last6Months.map(({ month, year }) => {
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === month && orderDate.getFullYear() === year;
      });
      return monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    });

    return {
      labels: last6Months.map(m => m.label),
      datasets: [{
        label: 'Revenue ($)',
        data: revenueData,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        fill: true,
      }],
    };
  };

  const getOrderTrendsData = () => {
    // Daily orders for the last 30 days
    const last30Days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      last30Days.push(date);
    }

    const orderCounts = last30Days.map(date => {
      return orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      }).length;
    });

    return {
      labels: last30Days.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Orders per Day',
        data: orderCounts,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }],
    };
  };

  const getTopItemsData = () => {
    // Count item sales across all orders
    const itemCounts = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.addedBy !== 'factory') { // Only count user items
          const key = item.name;
          itemCounts[key] = (itemCounts[key] || 0) + item.quantity;
        }
      });
    });

    const sortedItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      labels: sortedItems.map(([name]) => name),
      datasets: [{
        label: 'Units Sold',
        data: sortedItems.map(([, count]) => count),
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      }],
    };
  };

  // Report generation functions
  const generatePDFReport = async () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;

    // ✅ Load logo from public/logo_trans2.png
    try {
      const logo = await loadImageAsBase64("/logo_trans2.png");
      doc.addImage(logo, "PNG", 14, 10, 25, 25);
    } catch (err) {
      console.warn("⚠️ Logo not loaded:", err.message);
    }

    // 🔹 CINNEX Header with enhanced styling
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(218, 165, 32); // CINNEX gold
    doc.text("CINNEX (Pvt) Ltd", 45, 18);

    doc.setFontSize(14);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(139, 69, 19); // Brown
    doc.text("Golden Taste of Nature", 45, 26);

    // 🔹 Decorative line under header
    doc.setDrawColor(218, 165, 32);
    doc.setLineWidth(0.5);
    doc.line(14, 35, 200, 35);

    // 🔹 Report Title with modern styling
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Financial Performance Report", 14, 50);

    // 🔹 Report metadata
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Report ID: FIN-${Date.now().toString().slice(-8)}`, 200, 50, { align: "right" });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 58);
    doc.text(`Period: Last ${Math.min(6, Math.ceil((new Date() - new Date(Math.min(...orders.map(o => new Date(o.createdAt))))) / (1000 * 60 * 60 * 24)))} months`, 14, 65);

    // 🔹 Executive Summary Box
    doc.setDrawColor(218, 165, 32);
    doc.setFillColor(255, 248, 220); // Light gold background
    doc.roundedRect(14, 75, 180, 35, 3, 3, 'FD');

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Executive Summary", 20, 85);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const completedOrders = orders.filter(o => o.status === 'completed').length;

    doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 20, 95);
    doc.text(`Total Orders: ${orders.length}`, 20, 102);
    doc.text(`Completed Orders: ${completedOrders}`, 110, 95);
    doc.text(`Average Order Value: $${avgOrderValue.toFixed(2)}`, 110, 102);

    // 🔹 Order Status Breakdown with visual indicators
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Order Status Analysis", 14, 125);

    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      approved: orders.filter(o => o.status === 'approved').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
      completed: orders.filter(o => o.status === 'completed').length,
      payment_required: orders.filter(o => o.status === 'payment_required').length,
    };

    let statusY = 135;
    const statusColors = {
      pending: [255, 193, 7],
      approved: [40, 167, 69],
      rejected: [220, 53, 69],
      completed: [0, 123, 255],
      payment_required: [102, 16, 242]
    };

    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : 0;

      // Status indicator box
      doc.setFillColor(...statusColors[status]);
      doc.rect(14, statusY - 3, 4, 4, 'F');

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}: ${count} orders (${percentage}%)`, 22, statusY);
      statusY += 8;
    });

    // 🔹 Revenue Trends Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Revenue Trends", 14, statusY + 10);

    // Calculate monthly revenue for last 6 months
    const monthlyRevenue = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
      });
      const revenue = monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      monthlyRevenue.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: revenue
      });
    }

    let revenueY = statusY + 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    monthlyRevenue.forEach(item => {
      doc.text(`${item.month}: $${item.revenue.toFixed(2)}`, 14, revenueY);
      revenueY += 7;
    });

    // 🔹 Orders Table with enhanced styling
    const tableData = orders.map(order => [
      order.orderId,
      order.user?.username || 'Unknown',
      order.items?.length || 0,
      `$${order.totalAmount?.toFixed(2)}`,
      order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' '),
      new Date(order.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: revenueY + 10,
      head: [['Order ID', 'Customer', 'Items', 'Total Amount', 'Status', 'Date']],
      body: tableData,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [218, 165, 32], // CINNEX gold
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Light gray for alternate rows
      },
      columnStyles: {
        3: { halign: 'right' }, // Right align total amount
        4: { halign: 'center' } // Center align status
      }
    });

    // 🔹 Performance Insights Section
    const finalY = doc.lastAutoTable.finalY + 20;

    // Check if we have enough space for Performance Insights (about 50 units needed)
    const footerStartY = pageHeight - 95; // Where footer begins

    if (finalY + 50 < footerStartY) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Performance Insights", 14, finalY);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const insights = [
        `• Highest revenue month: ${monthlyRevenue.reduce((max, item) => item.revenue > max.revenue ? item : max, monthlyRevenue[0])?.month || 'N/A'}`,
        `• Order completion rate: ${orders.length > 0 ? ((completedOrders / orders.length) * 100).toFixed(1) : 0}%`,
        `• Total items sold: ${orders.reduce((sum, order) => sum + (order.items?.length || 0), 0)}`,
        `• Average items per order: ${orders.length > 0 ? (orders.reduce((sum, order) => sum + (order.items?.length || 0), 0) / orders.length).toFixed(1) : 0}`
      ];

      let insightY = finalY + 10;
      insights.forEach(insight => {
        doc.text(insight, 14, insightY);
        insightY += 7;
      });
    }

    // 🔹 Footer with enhanced styling

    // Signature section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Finance Manager Signature", 140, pageHeight - 95);
    doc.text("____________________", 140, pageHeight - 85);

    // Decorative elements
    doc.setDrawColor(218, 165, 32);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 75, 200, pageHeight - 75);

    // Contact information with better layout
    const leftX = 14;
    const rightX = 110;
    const baseY = pageHeight - 65;

    doc.setFont("helvetica", "bold");
    doc.text("Our Office:", leftX, baseY);
    doc.text("Business Hours:", rightX, baseY);

    doc.setFont("helvetica", "normal");
    doc.text("117, Sir Chittampalam A Gardinar Mawatha,", leftX, baseY + 6);
    doc.text("Mon - Fri: 8.00 AM - 5.00 PM", rightX, baseY + 6);
    doc.text("Colombo 02, Sri Lanka", leftX, baseY + 12);
    doc.text("Sat - Sun: Closed", rightX, baseY + 12);
    doc.text("cinnex@gmail.com | +94 11 2695279", leftX, baseY + 18);

    // Enhanced copyright
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `© ${new Date().getFullYear()} CINNEX — Golden Taste of Nature. All rights reserved.`,
      14,
      pageHeight - 8
    );

    // Add page number
    doc.setFontSize(8);
    doc.text(`Page 1 of 1`, 200, pageHeight - 8, { align: "right" });

    doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
    window.location.reload();
  };

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await http.get("/orders");
      setOrders(response.data);
    } catch (err) {
      setError("Failed to load orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await http.put(`/orders/${orderId}/status`, { status });
      fetchOrders(); // Refresh orders

      if (status === 'approved' && response.data.requiresPayment) {
        alert('Order approved! The user will now be redirected to complete payment.');
      } else {
        setShowModal(false);
        setSelectedOrder(null);
      }
    } catch (err) {
      alert("Failed to update order status");
      console.error("Error updating order:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'completed': return '🏁';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Professional Header Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div className="flex items-center space-x-4">
            <div className="bg-orange-500 p-3 rounded-xl shadow-sm">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Finance Manager Dashboard
              </h1>
              <p className="text-gray-600 text-sm">
                Manage orders and financial operations
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* Stats Cards */}
            <div className="flex space-x-4">
              <div className="bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                <div className="text-center">
                  <p className="text-orange-700 text-xs font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-orange-800">{orders.length}</p>
                </div>
              </div>
              <div className="bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                <div className="text-center">
                  <p className="text-orange-700 text-xs font-medium">Pending</p>
                  <p className="text-2xl font-bold text-orange-800">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
              </div>
              <div className="bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                <div className="text-center">
                  <p className="text-orange-700 text-xs font-medium">Approved</p>
                  <p className="text-2xl font-bold text-orange-800">{orders.filter(o => o.status === 'approved').length}</p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveSection('orders')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeSection === 'orders'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            📋 Order Management
          </button>
          <button
            onClick={() => setActiveSection('reports')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeSection === 'reports'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            📊 Financial Reports
          </button>
        </div>
      </div>

      {/* Orders Management Section */}
      {activeSection === 'orders' && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.user?.username || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.items?.length || 0} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">${order.totalAmount?.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <span className="mr-1">{getStatusIcon(order.status)}</span>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowModal(true);
                        }}
                        className="text-amber-600 hover:text-amber-900 mr-4"
                      >
                        View Details
                      </button>
                      {order.status === 'pending' && (
                        <div className="inline-flex space-x-2">
                          <button
                            onClick={() => updateOrderStatus(order._id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order._id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>
      )}

      {/* Financial Reports Section */}
      {activeSection === 'reports' && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 p-3 rounded-xl shadow-sm">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Financial Reports</h2>
                <p className="text-gray-600 text-sm">Comprehensive analytics and insights</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={generatePDFReport}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2"
              >
                <span>📄</span>
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Order Status Distribution */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📈</span>
                Order Status Distribution
              </h3>
              <div className="h-80">
                <Pie
                  data={getOrderStatusData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Revenue Trends */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💰</span>
                Revenue Trends (Last 6 Months)
              </h3>
              <div className="h-80">
                <Bar
                  data={getRevenueData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Revenue: $${context.parsed.y.toFixed(2)}`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `$${value}`
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Order Trends */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Daily Order Trends (Last 30 Days)
              </h3>
              <div className="h-80">
                <Line
                  data={getOrderTrendsData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        }
                      }
                    },
                    interaction: {
                      intersect: false,
                      mode: 'index'
                    }
                  }}
                />
              </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🏆</span>
                Top Selling Items
              </h3>
              <div className="h-80">
                <Bar
                  data={getTopItemsData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed Orders</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pending Orders</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Order Value</p>
                  <p className="text-2xl font-bold">
                    ${orders.length > 0 ? (orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Order Details - {selectedOrder.orderId}</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
                  <p className="text-gray-600">{selectedOrder.user?.username || 'Unknown'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Order Date</h3>
                  <p className="text-gray-600">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    <span className="mr-1">{getStatusIcon(selectedOrder.status)}</span>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Total Amount</h3>
                  <p className="text-gray-600 font-semibold">${selectedOrder.totalAmount?.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.category} • {item.quantity} {item.unit} • ${item.price} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {selectedOrder.status === 'pending' && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'approved')}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    ✅ Approve Order
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'rejected')}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    ❌ Reject Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}