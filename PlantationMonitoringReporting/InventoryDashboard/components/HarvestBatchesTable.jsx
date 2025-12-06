import React from "react";
import { FaSeedling, FaBox, FaEye } from "react-icons/fa";

const HarvestBatchesTable = ({
  harvestBatches,
  handleProcessToInventory,
  handleViewBatch
}) => {
  return (
    <div className="mt-8 sm:mt-12">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-lg opacity-30"></div>
            <div className="relative p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
              <FaSeedling className="text-xl sm:text-2xl text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
              Harvest Batches
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Manage harvest batches and process them to inventory</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-orange-50 to-red-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest ID</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer ID</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plot ID</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest Date</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {harvestBatches.map((batch) => (
                <tr key={batch._id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.harvestId}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.farmerId}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.plotid}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(batch.harvestDate).toLocaleDateString()}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.weightKg}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      batch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      batch.status === 'processed' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {batch.status === 'pending' && (
                        <button
                          onClick={() => handleProcessToInventory(batch)}
                          className="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1"
                          title="Process to inventory"
                        >
                          <FaBox className="text-xs" />
                          <span className="hidden sm:inline">Process</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleViewBatch(batch)}
                        className="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1"
                        title="View batch details"
                      >
                        <FaEye className="text-xs" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {harvestBatches.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-orange-400 mb-4">
              <FaSeedling className="mx-auto text-3xl sm:text-4xl" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No harvest batches found</h3>
            <p className="text-gray-500 text-sm sm:text-base">Harvest batches will appear here once created</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HarvestBatchesTable;