import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTruck, FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaTimes } from 'react-icons/fa';
import http from '../../../api/http';

// Add styles for animations
const styles = `
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    100% { transform: translateY(-10px); }
  }
  
  @keyframes glow {
    0% { box-shadow: 0 0 20px 5px rgba(255, 165, 0, 0.2); }
    100% { box-shadow: 0 0 30px 10px rgba(255, 165, 0, 0.4); }
  }
`;

const DeliveryIssueModal = ({ isOpen, onClose, issueData, onSave, orders }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    issueType: '',
    description: '',
    status: 'Open',
    deliveryPerson: '',
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when editing an existing issue
  useEffect(() => {
    if (issueData) {
      setFormData({
        orderId: issueData.orderId || '',
        issueType: issueData.issueType || '',
        description: issueData.description || '',
        status: issueData.status || 'Open',
        deliveryPerson: issueData.deliveryPerson || '',
        customerName: issueData.customerName || '',
        orderDate: issueData.orderDate ? new Date(issueData.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        orderId: '',
        issueType: '',
        description: '',
        status: 'Open',
        deliveryPerson: '',
        customerName: '',
        orderDate: new Date().toISOString().split('T')[0]
      });
    }
    setError('');
  }, [issueData]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.orderId || !formData.issueType || !formData.description.trim() || !formData.deliveryPerson.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create FormData object for file upload
      const submitData = new FormData();
      submitData.append('orderId', formData.orderId);
      submitData.append('issueType', formData.issueType);
      submitData.append('description', formData.description);
      submitData.append('status', formData.status);
      submitData.append('deliveryPerson', formData.deliveryPerson);
      submitData.append('customerName', formData.customerName);
      submitData.append('orderDate', formData.orderDate);
      
      // Add the reportedBy field if available from localStorage
      const userId = localStorage.getItem('userId') || localStorage.getItem('id') || '1';
      submitData.append('reportedBy', userId);

      await onSave(submitData, issueData?._id);
      onClose();
    } catch (err) {
      console.error('Error saving delivery issue:', err);
      setError(err.response?.data?.error || 'Failed to save delivery issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle order selection - prefill delivery person and customer name if available
  const handleOrderChange = (e) => {
    const orderId = e.target.value;
    setFormData({
      ...formData,
      orderId,
    });

    // Find selected order and prefill info if available
    const selectedOrder = orders.find(order => order.orderId === orderId);
    if (selectedOrder) {
      setFormData(prev => ({
        ...prev,
        orderId,
        deliveryPerson: selectedOrder.deliveryAssignee || prev.deliveryPerson,
        customerName: selectedOrder.user?.username || prev.customerName,
        orderDate: selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toISOString().split('T')[0] : prev.orderDate
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{styles}</style>
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white/95 backdrop-blur-md rounded-3xl max-w-4xl w-full p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-4 border-orange-300 max-h-[92vh] overflow-y-auto"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 40px 5px rgba(255, 165, 0, 0.1), 0 0 80px 20px rgba(255, 126, 0, 0.15)",
          animation: "scaleIn 0.3s ease-out forwards, float 3s ease-in-out infinite alternate"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-10">
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-orange-300 to-red-300 rounded-full opacity-20 blur-xl"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-lg" 
                   style={{animation: "glow 2s ease-in-out infinite alternate"}}>
                <FaTruck className="text-white text-3xl" />
              </div>
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-1">
                  {issueData ? 'Edit Delivery Issue' : 'Report Delivery Issue'}
                </h2>
                <p className="text-gray-600 font-medium text-lg">Delivery management system</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3.5 rounded-2xl hover:bg-gray-100 transition-all duration-200 group absolute -top-2 -right-2 border border-gray-200 shadow-sm"
              type="button"
            >
              <FaTimes className="text-gray-600 text-xl group-hover:text-orange-600" />
            </button>
          </div>
          
          <div className="w-full h-1 bg-gradient-to-r from-orange-400 via-amber-300 to-orange-400 mt-8 rounded-full"></div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
            <FaExclamationTriangle className="text-red-600" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Form Fields Container */}
          <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-8 rounded-3xl border-2 border-orange-200 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-orange-200">
              <h3 className="text-xl font-bold text-orange-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md">
                  <FaTruck className="text-white text-lg" />
                </div>
                Delivery Issue Details
              </h3>
              <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-xl font-medium text-sm">
                Required Fields *
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Order Selection Section */}
              <div className="bg-white/80 p-6 rounded-2xl border border-orange-100 shadow-sm">
                <h4 className="text-md font-semibold text-orange-700 mb-4 flex items-center gap-2">
                  📋 Order Information
                </h4>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Order ID <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.orderId}
                    onChange={handleOrderChange}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/90 backdrop-blur-sm transition-all duration-200 text-gray-900 font-medium shadow-sm"
                    required
                  >
                    <option value="">Select an order</option>
                    {orders.map((order) => (
                      <option key={order._id} value={order.orderId}>
                        #{order.orderId} - {order.user?.username || 'Customer'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Issue Details Section */}
              <div className="bg-white/80 p-6 rounded-2xl border border-orange-100 shadow-sm">
                <h4 className="text-md font-semibold text-orange-700 mb-4 flex items-center gap-2">
                  🚨 Issue Details
                </h4>
                
                {/* Issue Type */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Issue Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.issueType}
                    onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/90 backdrop-blur-sm transition-all duration-200 text-gray-900 font-medium shadow-sm"
                    required
                  >
                    <option value="">Select issue type</option>
                    <option value="Delayed Delivery">🕒 Delayed Delivery</option>
                    <option value="Damaged Goods">📦 Damaged Goods</option>
                    <option value="Incomplete Order">📋 Incomplete Order</option>
                    <option value="Wrong Address">🗺️ Wrong Address</option>
                    <option value="Customer Complaint">😞 Customer Complaint</option>
                    <option value="Other">❓ Other</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the delivery issue in detail..."
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/90 backdrop-blur-sm transition-all duration-200 text-gray-900 resize-none shadow-sm"
                    rows={5}
                    required
                    minLength={10}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-gray-500 font-medium">{formData.description.length} characters (minimum 10)</p>
                    <div className={`w-3 h-3 rounded-full shadow-sm ${formData.description.length >= 10 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-white/80 p-6 rounded-2xl border border-orange-100 shadow-sm">
                
                {/* Two-column layout for additional fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Delivery Person */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Delivery Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.deliveryPerson}
                      onChange={(e) => setFormData({ ...formData, deliveryPerson: e.target.value })}
                      placeholder="Enter delivery person's name"
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/90 backdrop-blur-sm transition-all duration-200 text-gray-900 shadow-sm"
                      required
                    />
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="Enter customer name"
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/90 backdrop-blur-sm transition-all duration-200 text-gray-900 shadow-sm"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/90 backdrop-blur-sm transition-all duration-200 text-gray-900 font-medium shadow-sm"
                    >
                      <option value="Open">🔴 Open</option>
                      <option value="Closed">🟢 Closed</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.orderId || !formData.issueType || !formData.description.trim() || !formData.deliveryPerson.trim()}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaTruck />
                    <span>{issueData ? 'Update Issue' : 'Report Issue'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default DeliveryIssueModal;