import React from "react";
import { FaComments, FaBox, FaEdit, FaTrash } from "react-icons/fa";

const ConsultationsTable = ({
  responses,
  allocatedInventory,
  getIssueTypeColor,
  handleEditAllocation,
  handleDeleteAllocation
}) => {
  return (
    <div className="mt-8 sm:mt-12">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full blur-lg opacity-30"></div>
            <div className="relative p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
              <FaComments className="text-xl sm:text-2xl text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
              All Consultation Responses
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Plantation issues and expert responses - Create consultations and submit responses</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-orange-100">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response ID</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue ID</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plot ID</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated Inventory</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {responses.map((response) => (
                <tr key={response._id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{response.responseId}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{response.issueId?.plantIssueid || 'N/A'}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIssueTypeColor(response.issueId?.issueType)}`}>
                      {response.issueId?.issueType || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{response.issueId?.plotid || 'N/A'}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={response.responseText}>
                    {response.responseText.length > 50 ? `${response.responseText.substring(0, 50)}...` : response.responseText}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">
                    {allocatedInventory[response._id] && allocatedInventory[response._id].length > 0 ? (
                      <div className="space-y-2">
                        {allocatedInventory[response._id].map((item, index) => (
                          <div key={item._id} className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <FaBox className="text-orange-500 text-xs flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-orange-800 truncate">{item.name}</span>
                                <span className="text-xs text-orange-600">({item.quantity}{item.unit})</span>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleEditAllocation(response._id, item)}
                                className="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-2 py-1 rounded text-xs transition-colors duration-200"
                                title="Edit allocation"
                              >
                                <FaEdit className="text-xs" />
                              </button>
                              <button
                                onClick={() => handleDeleteAllocation(response._id, item)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded text-xs transition-colors duration-200"
                                title="Delete allocation"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FaBox className="text-gray-400 text-xs flex-shrink-0" />
                        <span className="text-xs text-gray-600">No items allocated</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(response.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {responses.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-orange-400 mb-4">
              <FaComments className="mx-auto text-3xl sm:text-4xl" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No consultation responses found</h3>
            <p className="text-gray-500 text-sm sm:text-base">Responses will appear here once submitted to issues</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationsTable;