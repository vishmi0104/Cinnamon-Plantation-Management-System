import React, { useState, useEffect } from 'react';
import { FaTruck, FaExclamationTriangle, FaSearch, FaTimes, FaReply, FaCheckCircle, FaUser } from 'react-icons/fa';
import DeliveryResponseModal from './DeliveryResponseModal';
import { useDeliveryIssues } from '../FactoryManagerDashboard/useDeliveryIssues';

const DeliveryIssuesSupportPanel = () => {
  const {
    deliveryIssues,
    deliveryResponses,
    filteredDeliveryIssues,
    isLoadingDeliveryIssues,
    deliveryIssuesSearch,
    setDeliveryIssuesSearch,
    successMessage,
    errorMessage,
    fetchDeliveryIssues,
    fetchDeliveryResponses,
    addDeliveryResponse,
    getResponsesForIssue,
  } = useDeliveryIssues();

  const [isResponseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [expandedIssue, setExpandedIssue] = useState(null);

  // Fetch delivery issues and responses on component mount
  useEffect(() => {
    fetchDeliveryIssues();
    fetchDeliveryResponses();
  }, []);

  const openResponseModal = (issue) => {
    setSelectedIssue(issue);
    setResponseModalOpen(true);
  };

  const handleSaveResponse = async (formData) => {
    await addDeliveryResponse(formData);
    setResponseModalOpen(false);
  };

  const toggleExpandIssue = (id) => {
    setExpandedIssue(expandedIssue === id ? null : id);
  };

  const getIssueTypeColor = (type) => {
    const colors = {
      'Delayed Delivery': 'bg-amber-100 text-amber-800 border border-amber-200',
      'Damaged Goods': 'bg-rose-100 text-rose-800 border border-rose-200',
      'Incomplete Order': 'bg-orange-100 text-orange-800 border border-orange-200',
      'Wrong Address': 'bg-purple-100 text-purple-800 border border-purple-200',
      'Customer Complaint': 'bg-red-100 text-red-800 border border-red-200',
      'Other': 'bg-gray-100 text-gray-800 border border-gray-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getStatusColor = (status) => {
    return status === "Open"
      ? "bg-red-100 text-red-800 border border-red-200"
      : "bg-emerald-100 text-emerald-800 border border-emerald-200";
  };

  const getStatusBadge = (issue) => {
    const responses = getResponsesForIssue(issue._id);
    if (responses.length === 0) {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm bg-red-100 text-red-800 border border-red-200">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></div>
          No Response
        </span>
      );
    }
    
    const lastResponse = responses[responses.length - 1];
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
        lastResponse.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
        lastResponse.status === 'In Progress' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
        'bg-[#d87706]/10 text-[#d87706] border border-[#d87706]/20'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
          lastResponse.status === 'Resolved' ? 'bg-emerald-400' :
          lastResponse.status === 'In Progress' ? 'bg-amber-400' :
          'bg-[#d87706]'
        }`}></div>
        {lastResponse.status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Panel Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-[#d87706]/20 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#d87706] to-[#b55309] p-6 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptLTE4LTE2aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptOS0xMmg0djFoLTR2LTF6bTAgMmg0di0xaC00djF6bTAgMmg4di0xaC00djF6bTAgMmg4di0xaC00djF6bTAgMmg4di0xaC00djF6bTAgMmg4di0xaC00djF6bTAgMmg4di0xaC00djF6bTAgMmg8di0xaC00djF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                <FaTruck className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Delivery Issues Support</h2>
                <p className="text-white/80">Respond to delivery issues reported by factory managers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#d87706] bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <FaSearch className="text-white" />
                </div>
                <input
                  type="text"
                  placeholder="Search delivery issues..."
                  value={deliveryIssuesSearch}
                  onChange={(e) => setDeliveryIssuesSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-white/70 shadow-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Messages Section */}
        {successMessage && (
          <div className="mx-6 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <FaCheckCircle className="text-emerald-600 text-lg" />
              </div>
              <p className="text-emerald-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <FaExclamationTriangle className="text-red-600 text-lg" />
              </div>
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Issues Table Container */}
        <div className="p-6">
          <div className="bg-gradient-to-r from-[#d87706]/10 to-[#b55309]/10 rounded-2xl p-6 border border-[#d87706]/20 shadow-sm">
            <h3 className="text-lg font-semibold text-[#d87706] mb-4 flex items-center gap-2">
              <FaTruck className="text-[#d87706]" />
              Delivery Issues List
            </h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-[#d87706]/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
          <thead className="bg-gradient-to-r from-[#d87706]/10 to-[#b55309]/10 border-b border-[#d87706]/20">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#d87706] uppercase tracking-wider">Issue ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#d87706] uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#d87706] uppercase tracking-wider">Issue Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#d87706] uppercase tracking-wider">Delivery Person</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#d87706] uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#d87706] uppercase tracking-wider">Support Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#d87706] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white/70 backdrop-blur-sm divide-y divide-[#d87706]/10">
            {filteredDeliveryIssues.map((issue) => {
              const issueResponses = getResponsesForIssue(issue._id);
              return (
                <React.Fragment key={issue._id}>
                  <tr className="hover:bg-[#d87706]/5 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-[#d87706] rounded-full mr-3"></div>
                        <span className="text-sm font-bold text-gray-900">#{issue.deliveryIssueId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium px-2.5 py-1 bg-[#d87706]/10 border border-[#d87706]/20 rounded-md text-[#d87706]">
                        #{issue.orderId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${getIssueTypeColor(issue.issueType)}`}>
                        {issue.issueType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {issue.deliveryPerson}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs">
                      <div className="text-gray-900 truncate font-medium" title={issue.description}>
                        {issue.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(issue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleExpandIssue(issue._id)}
                          className={`inline-flex items-center px-3 py-1.5 ${
                            expandedIssue === issue._id 
                              ? 'bg-[#d87706] text-white' 
                              : 'bg-[#d87706]/10 text-[#d87706] hover:bg-[#d87706]/20'
                          } text-xs font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md`}
                          title="View details"
                        >
                          {expandedIssue === issue._id ? 'Hide Details' : 'View Details'}
                        </button>
                        
                        <button
                          onClick={() => openResponseModal(issue)}
                          className="inline-flex items-center px-3 py-1.5 bg-[#d87706] text-white text-xs font-medium rounded-lg hover:bg-[#b55309] transition-colors duration-200 shadow-sm hover:shadow-md"
                          title="Respond to issue"
                        >
                          <FaReply className="mr-1.5" />
                          Respond
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Section */}
                  {expandedIssue === issue._id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gradient-to-r from-[#d87706]/5 to-[#b55309]/5">
                        <div className="rounded-xl border border-[#d87706]/20 overflow-hidden bg-white">
                          <div className="bg-[#d87706] text-white px-4 py-3 flex justify-between items-center">
                            <span className="font-medium">Delivery Issue Details</span>
                            <button
                              onClick={() => setExpandedIssue(null)}
                              className="p-1 hover:bg-[#b55309] rounded"
                            >
                              <FaTimes />
                            </button>
                          </div>
                          
                          <div className="p-4">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium text-gray-500 mb-1">Issue Details</h4>
                                  <div className="bg-[#d87706]/5 rounded-lg p-4 border border-[#d87706]/20">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <p className="text-gray-500 mb-1">Issue ID:</p>
                                        <p className="font-medium text-gray-900">#{issue.deliveryIssueId}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 mb-1">Order ID:</p>
                                        <p className="font-medium text-gray-900">#{issue.orderId}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 mb-1">Issue Type:</p>
                                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${getIssueTypeColor(issue.issueType)}`}>
                                          {issue.issueType}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 mb-1">Status:</p>
                                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(issue.status)}`}>
                                          {issue.status}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 mb-1">Delivery Person:</p>
                                        <p className="font-medium text-gray-900">{issue.deliveryPerson}</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-500 mb-1">Reported On:</p>
                                        <p className="font-medium text-gray-900">{new Date(issue.createdAt).toLocaleString()}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-gray-500 mb-1">Description:</p>
                                        <p className="font-medium text-gray-900">{issue.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {issue.photoUrl && (
                                  <div>
                                    <h4 className="font-medium text-gray-500 mb-1">Issue Photo</h4>
                                    <div className="border border-[#d87706]/20 rounded-lg overflow-hidden shadow-sm">
                                      <img 
                                        src={`${process.env.REACT_APP_API_URL}/${issue.photoUrl}`} 
                                        alt="Issue Photo" 
                                        className="w-full h-auto max-h-64 object-contain bg-[#d87706]/5"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-500 mb-1">Response History</h4>
                                {issueResponses.length === 0 ? (
                                  <div className="bg-[#d87706]/5 rounded-lg p-4 border border-[#d87706]/20 text-center">
                                    <p className="text-gray-500">No responses yet.</p>
                                    <button
                                      onClick={() => openResponseModal(issue)}
                                      className="mt-3 inline-flex items-center px-4 py-2 bg-[#d87706] text-white text-sm font-medium rounded-lg hover:bg-[#b55309] transition-colors duration-200"
                                    >
                                      <FaReply className="mr-2" />
                                      Add First Response
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {issueResponses.map((response) => (
                                      <div key={response._id} className="bg-[#d87706]/5 rounded-lg p-4 border border-[#d87706]/20">
                                        <div className="flex justify-between items-start mb-3">
                                          <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-[#d87706]/10 rounded-lg">
                                              <FaUser className="text-[#d87706] text-xs" />
                                            </div>
                                            <span className="text-sm font-medium text-[#d87706]">
                                              {response.respondedBy || 'Unknown User'}
                                            </span>
                                            <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ml-2 ${
                                              response.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                              response.status === 'In Progress' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                              'bg-[#d87706]/10 text-[#d87706] border border-[#d87706]/20'
                                            }`}>
                                              {response.status}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {new Date(response.createdAt).toLocaleString()}
                                          </div>
                                        </div>
                                        <p className="text-gray-700 mb-2">{response.responseText}</p>
                                        {response.actionTaken && (
                                          <div className="mt-3 pt-2 border-t border-[#d87706]/20">
                                            <p className="text-gray-500 text-sm">Action Taken:</p>
                                            <p className="text-gray-700">{response.actionTaken}</p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="mt-4">
                                  <button
                                    onClick={() => openResponseModal(issue)}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-[#d87706] text-white text-sm font-medium rounded-lg hover:bg-[#b55309] transition-colors duration-200"
                                  >
                                    <FaReply className="mr-2" />
                                    {issueResponses.length > 0 ? 'Add Another Response' : 'Add Response'}
                                  </button>
                                </div>
                              </div>
                            </div>
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
              </div>

              {filteredDeliveryIssues.length === 0 && (
                <div className="text-center py-16 bg-gradient-to-b from-white/0 to-[#d87706]/10">
                  <div className="bg-[#d87706]/10 p-4 rounded-full inline-block mb-4">
                    <FaTruck className="mx-auto text-4xl text-[#d87706]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#d87706] mb-2">No delivery issues found</h3>
                  <p className="text-[#d87706]/70">Delivery issues reported by factory managers will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Response Modal */}
      <DeliveryResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        issue={selectedIssue}
        onSave={handleSaveResponse}
      />
    </div>
  );
};

export default DeliveryIssuesSupportPanel;