import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../api/http";

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  // Fetch user orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await http.get("/orders/my-orders");
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'payment_required': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'approved': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'rejected': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'completed': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'payment_required': return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
      default: return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  const handlePayment = (orderId) => {
    navigate(`/user/payment?orderId=${orderId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading orders...</div>
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Unique Background Elements */}
      <div className="absolute inset-0 -z-10">
        {/* Modern minimal background pattern */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 right-10 w-80 h-80 bg-gradient-to-br from-amber-50 to-orange-50 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-amber-100/20 to-orange-100/20 rounded-full blur-3xl"></div>
        </div>

        {/* Subtle geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-3xl"
              style={{
                width: `${80 + Math.random() * 120}px`,
                height: `${80 + Math.random() * 120}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                opacity: 0.4
              }}
            ></div>
          ))}
        </div>

        {/* Professional grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(234, 88, 12, 0.4) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      {/* Elegant Navigation */}
      <nav className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Modern Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate("/user")}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 blur-sm opacity-60 rounded-xl"></div>
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mr-3 shadow-md relative">
                  <span className="text-white text-lg font-bold">C</span>
                </div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Cinnex
                </span>
                <div className="text-xs text-amber-800/70 -mt-1">Premium Quality</div>
              </div>
            </div>

            {/* Desktop Navigation - Simplified and Professional */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => navigate("/user")}
                className="px-4 py-2 rounded-full text-sm font-medium text-amber-800 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
              >
                Home
              </button>
              <button
                onClick={() => navigate("/user")}
                className="px-4 py-2 rounded-full text-sm font-medium text-amber-800 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
              >
                Shop
              </button>
              <button
                onClick={() => navigate("/user/orders")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  window.location.pathname === "/user/orders"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                    : "text-amber-800 hover:text-amber-600 hover:bg-amber-50"
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => navigate("/user/payments")}
                className="px-4 py-2 rounded-full text-sm font-medium text-amber-800 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
              >
                Payments
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center px-5 py-2 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-full text-sm font-medium transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="max-w-screen-xl mx-auto">
          {/* Elegant Header Section */}
          <div className="relative mb-12">
            {/* Minimal Background Elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute right-0 top-10 w-64 h-64 bg-amber-100/30 rounded-full blur-2xl"></div>
              <div className="absolute left-10 bottom-0 w-72 h-72 bg-orange-100/20 rounded-full blur-2xl"></div>
            </div>

            <div className="text-center relative max-w-3xl mx-auto py-10">
              {/* Clean, Professional Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-lg relative">
                <div className="absolute inset-0 bg-white opacity-20 rounded-2xl"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>

              {/* Clean, Professional Title */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-amber-900">
                My Orders
              </h1>

              {/* Clean Subtitle */}
              <p className="text-amber-700/80 mb-6 max-w-xl mx-auto">
                View your order history, track shipments, and manage payments in one place
              </p>
              
              {/* Simple Divider */}
              <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full"></div>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md border border-amber-100 p-12 text-center max-w-md mx-auto hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              {/* Simple background accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10"></div>
              
              <div className="inline-block p-4 bg-amber-50 rounded-full mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-amber-900 mb-3">No Orders Yet</h3>
              <p className="text-amber-700/80 mb-8 leading-relaxed">Start your shopping journey to see your orders here</p>
              
              <button
                onClick={() => navigate("/user")}
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-md shadow hover:shadow-md transition-all duration-300"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  Start Shopping
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => (
                <div key={order._id} className="group bg-white rounded-lg shadow-md border border-amber-100 overflow-hidden hover:shadow-lg transition-all duration-300 relative">
                  
                  {/* Order Header */}
                  <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-md flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-amber-900">
                            Order #{order.orderId}
                          </h3>
                          <p className="text-amber-700/80 text-sm flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(order.status)}`}>
                          <span className="mr-1">{getStatusIcon(order.status)}</span>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {order.status === 'payment_required' && (
                          <button
                            onClick={() => handlePayment(order._id)}
                            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-md font-medium text-sm transition-all duration-300"
                          >
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Pay Now
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {order.items?.filter(item => item.addedBy !== 'factory').map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50/50 to-blue-50/30 rounded-2xl border border-gray-100/50 hover:shadow-md transition-all duration-300 hover:scale-105 relative overflow-hidden group/item">
                          {/* Item glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>

                          <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform duration-300 relative z-10">
                            <span className="text-lg">
                              {item.category === "harvest" && "🌾"}
                              {item.category === "resource" && "🛠️"}
                              {item.category === "final product" && "🏷️"}
                            </span>
                          </div>
                          <div className="flex-1 relative z-10">
                            <p className="font-semibold text-gray-900 text-sm group-hover/item:text-blue-700 transition-colors duration-300">{item.name}</p>
                            <p className="text-gray-600 text-xs flex items-center">
                              <span className="mr-1">📊</span>
                              {item.quantity} {item.unit} × ${item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enhanced Order Total */}
                    <div className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-50/50 to-blue-50/30 rounded-2xl border border-gray-100/50 relative overflow-hidden group/total">
                      {/* Total glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover/total:opacity-100 transition-opacity duration-300"></div>

                      <span className="text-gray-700 font-semibold relative z-10 flex items-center">
                        <span className="mr-2">💰</span>
                        Total Amount (Your Items):
                      </span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent relative z-10 group-hover/total:scale-105 transition-transform duration-300">
                        ${order.items?.filter(item => item.addedBy !== 'factory').reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="px-8 pb-6">
                      <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-200/30 relative overflow-hidden group/notes">
                        {/* Notes glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover/notes:opacity-100 transition-opacity duration-300"></div>

                        <div className="flex items-start space-x-3 relative z-10">
                          <div className="text-blue-600 text-lg mt-0.5 group-hover/notes:scale-110 transition-transform duration-300">💬</div>
                          <div>
                            <p className="text-blue-800 font-semibold text-sm mb-1 flex items-center">
                              <span className="mr-2">📝</span>
                              Order Note
                            </p>
                            <p className="text-blue-700 text-sm leading-relaxed">{order.notes}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}