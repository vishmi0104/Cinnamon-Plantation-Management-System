import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaTruck, FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaTimes, FaReply, FaUser, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useDeliveryIssues } from './useDeliveryIssues';
import DeliveryIssueModal from './DeliveryIssueModal';

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

const DeliveryIssueManagement = ({ orders }) => {
  const {
    filteredDeliveryIssues,
    isLoadingDeliveryIssues,
    deliveryIssuesSearch,
    setDeliveryIssuesSearch,
    successMessage,
    errorMessage,
    fetchDeliveryIssues,
    fetchDeliveryResponses,
    addDeliveryIssue,
    updateDeliveryIssue,
    deleteDeliveryIssue,
    addDeliveryResponse,
    getResponsesForIssue,
  } = useDeliveryIssues();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [expandedResponses, setExpandedResponses] = useState({});
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedIssueForResponse, setSelectedIssueForResponse] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchDeliveryIssues();
    fetchDeliveryResponses();
  }, []);

  const handleAddIssue = () => {
    setEditingIssue(null);
    setIsModalOpen(true);
  };

  const handleEditIssue = (issue) => {
    setEditingIssue(issue);
    setIsModalOpen(true);
  };

  const handleDeleteIssue = async (issue) => {
    if (!window.confirm(`Are you sure you want to delete delivery issue "${issue.deliveryIssueId}"? This action cannot be undone.`)) return;

    try {
      await deleteDeliveryIssue(issue._id);
    } catch (err) {
      console.error('Error deleting delivery issue:', err);
    }
  };

  const handleSaveIssue = async (formData, issueId) => {
    try {
      if (issueId) {
        await updateDeliveryIssue(issueId, formData);
      } else {
        await addDeliveryIssue(formData);
      }
    } catch (err) {
      console.error('Error saving delivery issue:', err);
      throw err;
    }
  };

  const toggleResponses = (issueId) => {
    setExpandedResponses(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

  const handleAddResponse = (issue) => {
    setSelectedIssueForResponse(issue);
    setResponseText('');
    setResponseModalOpen(true);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      setIsSubmittingResponse(true);
      const formData = new FormData();
      formData.append('deliveryIssueId', selectedIssueForResponse._id);
      formData.append('responseText', responseText);
      formData.append('respondedBy', 'Factory Manager');

      await addDeliveryResponse(formData);
      setResponseModalOpen(false);
      setSelectedIssueForResponse(null);
      setResponseText('');
    } catch (err) {
      console.error('Error submitting response:', err);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      {/* Success/Error Messages */}
      {(successMessage || errorMessage) && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 shadow-lg flex items-center gap-3 animate-in slide-in-from-right">
              <FaCheckCircle className="text-emerald-600" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="bg-red-50 text-red-800 p-4 rounded-2xl border border-red-200 shadow-lg flex items-center gap-3 animate-in slide-in-from-right">
              <FaExclamationTriangle className="text-red-600" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Delivery Issues Section - Outside the Box */}
      <div className="w-full max-w-7xl mx-auto mb-8">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-l-4 border-orange-400 overflow-hidden"
             style={{
               boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(255, 165, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)",
               animation: "scaleIn 0.5s ease-out forwards"
             }}>

          {/* Modern Header Section */}
          <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 p-8 relative">
            <div className="absolute top-0 left-0 right-0 h-24 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptLTE4LTE2aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptOS0xMmg0djFoLTR2LTF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
            
            <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 opacity-10 blur-xl"></div>
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 opacity-10 blur-xl"></div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl backdrop-blur-sm shadow-xl"
                     style={{animation: "glow 2s ease-in-out infinite alternate"}}>
                  <FaTruck className="text-white text-4xl" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-1 tracking-tight">Delivery Issues</h2>
                    <span className="ml-3 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">MANAGEMENT</span>
                  </div>
                  <p className="text-orange-50 text-base md:text-lg font-medium opacity-90">Track and resolve delivery concerns with precision</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 flex items-center gap-3 shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse shadow-md shadow-white/50"></div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{filteredDeliveryIssues.length}</p>
                    <p className="text-xs text-orange-50 uppercase tracking-wider font-medium">Issues Logged</p>
                  </div>
                </div>

                <button
                  onClick={handleAddIssue}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-orange-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-white/30"
                >
                  <FaPlus className="text-base" />
                  <span>New Issue</span>
                </button>
              </div>
            </div>

            <div className="w-full h-1 bg-gradient-to-r from-orange-300/50 via-amber-200/80 to-orange-300/50 mt-8 rounded-full"></div>
          </div>

          {/* Modern Search and Filters */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-orange-50/90 to-amber-50/90 border-b border-orange-100 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between">
              <div className="flex-1 max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-1.5 rounded-sm bg-gradient-to-b from-orange-500 to-amber-500"></div>
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wider">Smart Search</label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 bg-gradient-to-r from-orange-100 to-amber-100 p-2.5 rounded-xl shadow-sm">
                    <FaSearch className="text-sm" />
                  </div>
                  <input
                    type="text"
                    placeholder="Find by ID, order, person, type, description, status..."
                    value={deliveryIssuesSearch}
                    onChange={(e) => setDeliveryIssuesSearch(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white/90 hover:bg-white transition-all duration-200 shadow-sm placeholder-gray-400 text-gray-700"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-gradient-to-br from-white to-orange-50/70 px-6 py-4 rounded-xl border border-orange-100 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">Open Issues</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {filteredDeliveryIssues.filter(issue => issue.status === 'Open').length}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-white to-emerald-50/70 px-6 py-4 rounded-xl border border-emerald-100 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">Resolved</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {filteredDeliveryIssues.filter(issue => issue.status !== 'Open').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Issues Table */}
          <div className="overflow-x-auto">
            {isLoadingDeliveryIssues ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-orange-600 font-medium">Loading delivery issues...</span>
              </div>
            ) : filteredDeliveryIssues.length === 0 ? (
              <div className="py-16 bg-gradient-to-b from-white/0 to-orange-50/30 relative">
                <div className="absolute w-64 h-64 top-12 left-1/2 -translate-x-1/2 bg-gradient-to-br from-orange-100/40 to-amber-100/40 rounded-full blur-xl"></div>
                
                <div className="relative">
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <div className="absolute -inset-6 bg-gradient-to-r from-orange-200/40 to-amber-200/40 rounded-full blur-lg"></div>
                      <div className="relative bg-gradient-to-r from-orange-200 to-amber-300 p-6 rounded-xl inline-block shadow-lg">
                        <FaTruck className="mx-auto text-5xl text-white" />
                      </div>
                    </div>
                    
                    <div className="text-center max-w-md mx-auto">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-3">No Delivery Issues Reported</h3>
                      <p className="text-gray-600 text-lg mb-8 px-6">Your delivery operations are running smoothly. Report any issues when they arise to track and resolve them efficiently.</p>
                      
                      <button
                        onClick={handleAddIssue}
                        className="inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-600 transform hover:translate-y-[-2px] transition-all duration-300"
                      >
                        <div className="p-1.5 bg-white/20 rounded-lg">
                          <FaPlus className="text-sm" />
                        </div>
                        <span>Report New Issue</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50/90 to-slate-50/90 border-b border-gray-200 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Issue ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Delivery Person</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Responses</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/70 backdrop-blur-sm divide-y divide-gray-100">
                  {filteredDeliveryIssues.map((issue) => {
                    const responses = getResponsesForIssue(issue._id);
                    return (
                      <React.Fragment key={issue._id}>
                        <tr className="hover:bg-gradient-to-r hover:from-orange-50/40 hover:to-amber-50/40 transition-all duration-200 group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-2 h-7 bg-gradient-to-b from-orange-400 to-amber-500 rounded-md mr-3"></div>
                              <span className="text-sm font-bold text-gray-800">#{issue.deliveryIssueId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-medium px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100/70 border border-blue-100 rounded-md text-blue-700 shadow-sm">
                              #{issue.orderId}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-medium shadow-sm ${
                              issue.issueType === 'Delayed Delivery' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100/70 text-yellow-800 border border-yellow-100' :
                              issue.issueType === 'Damaged Goods' ? 'bg-gradient-to-r from-red-50 to-red-100/70 text-red-800 border border-red-100' :
                              issue.issueType === 'Incomplete Order' ? 'bg-gradient-to-r from-purple-50 to-purple-100/70 text-purple-800 border border-purple-100' :
                              issue.issueType === 'Wrong Address' ? 'bg-gradient-to-r from-orange-50 to-orange-100/70 text-orange-800 border border-orange-100' :
                              issue.issueType === 'Customer Complaint' ? 'bg-gradient-to-r from-pink-50 to-pink-100/70 text-pink-800 border border-pink-100' :
                              'bg-gradient-to-r from-gray-50 to-gray-100/70 text-gray-800 border border-gray-100'
                            }`}>
                              {issue.issueType === 'Delayed Delivery' && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2"></div>}
                              {issue.issueType === 'Damaged Goods' && <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></div>}
                              {issue.issueType === 'Incomplete Order' && <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>}
                              {issue.issueType === 'Wrong Address' && <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2"></div>}
                              {issue.issueType === 'Customer Complaint' && <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2"></div>}
                              {issue.issueType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm max-w-xs">
                            <div className="text-gray-700 truncate font-medium" title={issue.description}>
                              {issue.description}
                            </div>
                            <div className="mt-1 text-xs text-gray-400">{new Date(issue.createdAt || Date.now()).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-sm ${
                              issue.status === 'Open' ? 'bg-gradient-to-r from-red-50 to-red-100/70 text-red-700 border border-red-100' : 'bg-gradient-to-r from-emerald-50 to-emerald-100/70 text-emerald-700 border border-emerald-100'
                            }`}>
                              <div className={`w-2 h-2 ${issue.status === 'Open' ? 'bg-red-500' : 'bg-emerald-500'} rounded-full mr-2 shadow-sm`}></div>
                              {issue.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-slate-50/70 px-3 py-1.5 rounded-md border border-gray-100 shadow-sm">
                              <div className="p-1 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full">
                                <FaUser className="text-orange-500 text-xs" />
                              </div>
                              <span className="font-medium text-gray-700 text-xs">{issue.deliveryPerson}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleResponses(issue._id)}
                              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50/70 text-indigo-700 rounded-md hover:from-indigo-100 hover:to-blue-100/70 transition-colors text-xs font-medium border border-indigo-100 shadow-sm"
                            >
                              <FaReply className="text-xs" />
                              <span className="font-bold">{responses.length}</span>
                              <FaEye className={`text-xs transition-transform ${expandedResponses[issue._id] ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button
                                onClick={() => handleEditIssue(issue)}
                                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-md hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Edit issue"
                              >
                                <FaEdit className="mr-1.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteIssue(issue)}
                                className="inline-flex items-center px-2 py-1.5 text-red-600 hover:bg-red-500 hover:text-white text-xs font-medium rounded-md border border-red-200 hover:border-red-500 transition-all duration-200 shadow-sm hover:shadow-md"
                                title="Delete issue"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Responses Row */}
                        {expandedResponses[issue._id] && responses.length > 0 && (
                          <tr className="bg-gradient-to-r from-slate-50/80 to-indigo-50/80">
                            <td colSpan="8" className="px-6 py-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-6 w-1 bg-gradient-to-b from-indigo-400 to-blue-500 rounded-full"></div>
                                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-md text-xs">
                                      {responses.length} Responses
                                    </span>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-gray-600">Communication History</span>
                                  </h4>
                                </div>
                                <div className="space-y-3 max-h-60 overflow-y-auto rounded-lg border border-indigo-100 bg-white/60 p-3">
                                  {responses.map((response, index) => (
                                    <div key={response._id || index} className={`p-4 rounded-lg border shadow-sm ${response.respondedBy === 'Support Manager' ? 'bg-gradient-to-r from-orange-50 to-amber-50/60 border-orange-200' : 'bg-gradient-to-r from-white to-indigo-50/60 border-indigo-100'}`}>
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-indigo-50">
                                            <div className={`p-1.5 rounded-lg shadow-sm ${response.respondedBy === 'Support Manager' ? 'bg-gradient-to-r from-orange-100 to-amber-100' : 'bg-gradient-to-r from-indigo-100 to-blue-100'}`}>
                                              <FaUser className={`text-xs ${response.respondedBy === 'Support Manager' ? 'text-orange-600' : 'text-indigo-600'}`} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`text-sm font-medium ${response.respondedBy === 'Support Manager' ? 'text-orange-800' : 'text-indigo-800'}`}>
                                                {response.respondedBy || 'Support Team'}
                                              </span>
                                              {response.respondedBy === 'Support Manager' && (
                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full border border-orange-200">
                                                  Support Response
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md ml-auto">
                                              <FaClock className="text-gray-500 text-xs" />
                                              <span className="text-xs text-gray-600">
                                                {new Date(response.createdAt).toLocaleString()}
                                              </span>
                                            </div>
                                          </div>
                                          <p className={`text-sm leading-relaxed pl-2 border-l-2 ${response.respondedBy === 'Support Manager' ? 'text-gray-700 border-orange-300' : 'text-gray-700 border-indigo-200'}`}>{response.response}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Issue Modal */}
      <DeliveryIssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        issueData={editingIssue}
        onSave={handleSaveIssue}
        orders={orders}
      />

      {/* Response Modal */}
      {responseModalOpen && selectedIssueForResponse && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[100]"
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 setResponseModalOpen(false);
                 setSelectedIssueForResponse(null);
                 setResponseText('');
               }
             }}>
          <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-indigo-300"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
                  <FaReply className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                    Add Response
                  </h2>
                  <p className="text-gray-600 font-medium">Issue #{selectedIssueForResponse.deliveryIssueId}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setResponseModalOpen(false);
                  setSelectedIssueForResponse(null);
                  setResponseText('');
                }}
                className="p-3 rounded-2xl hover:bg-gray-100 transition-all duration-200 group"
              >
                <FaTimes className="text-gray-600 text-xl group-hover:text-indigo-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitResponse} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Your Response <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response to this delivery issue..."
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/90 backdrop-blur-sm transition-all duration-200 text-gray-900 resize-none shadow-sm"
                  rows={6}
                  required
                  minLength={10}
                />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-gray-500 font-medium">{responseText.length} characters (minimum 10)</p>
                  <div className={`w-3 h-3 rounded-full shadow-sm ${responseText.length >= 10 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setResponseModalOpen(false);
                    setSelectedIssueForResponse(null);
                    setResponseText('');
                  }}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResponse || !responseText.trim() || responseText.length < 10}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmittingResponse ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FaReply />
                      <span>Submit Response</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryIssueManagement;