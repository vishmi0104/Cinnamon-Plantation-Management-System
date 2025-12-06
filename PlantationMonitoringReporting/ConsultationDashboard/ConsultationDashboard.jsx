import React, { useState, useEffect } from "react";
import { generateReport } from "../../../components/Report";
import {
  getWithRetry,
  postWithRetry,
  putWithRetry,
  deleteWithRetry,
} from "../../../api/retry";
import http from "../../../api/http";
import { FaFilePdf, FaEdit, FaTrash, FaSearch, FaReply, FaEye, FaUserMd, FaCheckCircle, FaSignOutAlt, FaBox, FaPlus, FaExclamationTriangle, FaTimesCircle, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ConsultationDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [responses, setResponses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("consultations"); // consultations or inventory
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("all");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isResponseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [responseFormData, setResponseFormData] = useState({
    responseText: "",
  });
  const [errors, setErrors] = useState({});
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // Get current user info
  const currentUserRole = localStorage.getItem("role");
  const currentUserId = (() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      }
    } catch (e) {
      console.error("Error decoding token:", e);
    }
    return null;
  })();

  // Permission checking functions
  const canEditResponse = (response) => {
    if (currentUserRole === "support") return true; // Support managers can edit any response
    if (currentUserRole === "consultation") {
      // Consultation managers can only edit their own responses
      return response.respondedBy === currentUserId;
    }
    return false;
  };

  const canDeleteResponse = (response) => {
    if (currentUserRole === "support") return true; // Support managers can delete any response
    if (currentUserRole === "consultation") {
      // Consultation managers can only delete their own responses
      return response.respondedBy === currentUserId;
    }
    return false;
  };

  const canAddResponse = () => {
    // Only consultation managers can add responses (support managers provide responses through other means)
    return currentUserRole === "consultation";
  };

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  const fetchData = async () => {
    try {
      const [iRes, rRes, invRes] = await Promise.all([
        getWithRetry("/issues", 3),
        getWithRetry("/responses", 3),
        getWithRetry("/inventory", 3),
      ]);
      setIssues(iRes.data);
      setResponses(rRes.data);
      setInventory(invRes.data);
    } catch (err) {
      console.error("❌ Failed to fetch:", err.message);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await http.get("/health");
        await fetchData();
      } catch {
        setTimeout(fetchData, 1000);
      }
    })();
  }, []);

  const handleAddResponse = (issue) => {
    setSelectedIssue(issue);
    setResponseFormData({ responseText: "" });
    setResponseModalOpen(true);
  };

  const handleEditResponse = (response) => {
    setSelectedIssue(response.issueId);
    setResponseFormData({ responseText: response.responseText, _id: response._id });
    setResponseModalOpen(true);
  };

  const handleSaveResponse = async () => {
    const newErrors = {};

    // Comprehensive validation
    const responseText = responseFormData.responseText.trim();

    if (!responseText) {
      newErrors.responseText = "⚠️ Consultation response is required";
    } else if (responseText.length < 10) {
      newErrors.responseText = "⚠️ Consultation response must be at least 10 characters";
    } else if (responseText.length > 1000) {
      newErrors.responseText = "⚠️ Consultation response cannot exceed 1000 characters";
    } else if (!/[a-zA-Z]/.test(responseText)) {
      newErrors.responseText = "⚠️ Consultation response must contain at least one letter";
    } else if (/^\d+$/.test(responseText)) {
      newErrors.responseText = "⚠️ Consultation response cannot be only numbers";
    } else if (responseText.split(' ').length < 3) {
      newErrors.responseText = "⚠️ Consultation response must contain at least 3 words";
    }

    // Check for meaningful content
    const commonPhrases = ['test', 'asdf', 'qwerty', 'lorem ipsum'];
    const lowerText = responseText.toLowerCase();
    if (commonPhrases.some(phrase => lowerText.includes(phrase))) {
      newErrors.responseText = "⚠️ Please provide a meaningful consultation response";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (responseFormData._id) {
        await putWithRetry(`/responses/${responseFormData._id}`, {
          responseText: responseText,
        });
      } else {
        await postWithRetry("/responses", {
          issueId: selectedIssue._id,
          responseText: responseText,
        });
      }
      await fetchData();
      setResponseModalOpen(false);
      setResponseFormData({ responseText: "" });
      setErrors({});
      // Navigate to consultation dashboard after successful consultation addition
      navigate('/consultation-dashboard');
    } catch (err) {
      console.error("❌ Error saving consultation response:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || "Failed to save consultation response";
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResponse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this consultation response?")) return;
    setIsDeleting(id);
    try {
      await deleteWithRetry(`/responses/${id}`);
      await fetchData();
      setSuccessMessage('Consultation response deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("❌ Error deleting consultation response:", err);
      setErrors({ submit: 'Failed to delete consultation response. Please try again.' });
      setTimeout(() => setErrors({}), 3000);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleReport = () => {
    generateReport(
      "Consultation Dashboard Report",
      ["Issue ID", "Plot ID", "Issue Type", "Status", "Consultation Responses"],
      issues.map((i) => [
        i.plantIssueid,
        i.plotid,
        i.issueType,
        i.status,
        responses.filter((r) => r.issueId && r.issueId._id === i._id).length,
      ]),
      "ConsultationDashboardReport.pdf"
    );
  };

  const toggleExpanded = (issueId) => {
    setExpandedIssue(expandedIssue === issueId ? null : issueId);
  };

  const filteredIssues = issues.filter(
    (i) =>
      i.plantIssueid?.toLowerCase().includes(search.toLowerCase()) ||
      i.plotid?.toString().includes(search) ||
      i.issueType?.toLowerCase().includes(search.toLowerCase())
  ).filter((i) => {
    if (statusFilter === "all") return true;
    return i.status === statusFilter;
  }).filter((i) => {
    if (issueTypeFilter === "all") return true;
    return i.issueType === issueTypeFilter;
  }).filter((i) => {
    if (responseFilter === "all") return true;
    const issueResponses = responses.filter((r) => r.issueId._id === i._id);
    if (responseFilter === "has-responses") return issueResponses.length > 0;
    if (responseFilter === "no-responses") return issueResponses.length === 0;
    if (responseFilter === "my-responses") {
      return issueResponses.some((r) => r.respondedBy === currentUserId || currentUserRole === "support");
    }
    return true;
  }).filter((i) => {
    if (dateFilter === "all") return true;
    const issueDate = new Date(i.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - issueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (dateFilter === "today") return diffDays === 1;
    if (dateFilter === "week") return diffDays <= 7;
    if (dateFilter === "month") return diffDays <= 30;
    return true;
  });

  const filteredInventory = inventory.filter(
    (item) =>
      item.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.category?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(inventorySearch.toLowerCase())
  ).filter((item) => {
    if (inventoryFilter === "all") return true;
    return item.status === inventoryFilter;
  }).filter((item) => {
    if (inventoryCategoryFilter === "all") return true;
    return item.category === inventoryCategoryFilter;
  });

  const getStatusColor = (status) => {
    return status === "Open" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
  };

  const getIssueTypeColor = (type) => {
    const colors = {
      Pest: "bg-orange-100 text-orange-800",
      Disease: "bg-red-100 text-red-800",
      "Soil Problem": "bg-yellow-100 text-yellow-800",
      "Water Stress": "bg-blue-100 text-blue-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getInventoryStatusColor = (status) => {
    return status === "Available" ? "bg-green-100 text-green-800" :
           status === "Low Stock" ? "bg-yellow-100 text-yellow-800" :
           "bg-red-100 text-red-800";
  };

  const getCategoryColor = (category) => {
    const colors = {
      harvest: "bg-green-100 text-green-800",
      resource: "bg-blue-100 text-blue-800",
      "final product": "bg-purple-100 text-purple-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 p-4 sm:p-6 rounded-2xl backdrop-blur-sm bg-white/30 border border-white/20 shadow-lg gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-lg opacity-30"></div>
                <div className="relative p-2 sm:p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
                  <FaUserMd className="text-xl sm:text-2xl text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                  Consultation Dashboard
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Expert Consultation Hub</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full border border-white/30 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${
                  currentUserRole === 'support' ? 'bg-amber-500' : 'bg-orange-500'
                } animate-pulse`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {currentUserRole === 'support' ? 'Support Manager' : 'Consultation Manager'}
                </span>
              </div>
              <div className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-md ${
                currentUserRole === 'support'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
              }`}>
                <div className="flex items-center gap-1 sm:gap-2">
                  <FaUserMd className="text-xs" />
                  <span className="hidden xs:inline">{currentUserRole === 'support' ? 'Support' : 'Consultation'}</span>
                </div>
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
        </div>
        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-6">
          <div className="flex bg-white/50 rounded-xl p-1 shadow-sm border border-white/30 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("consultations")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                activeTab === "consultations"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaUserMd className="text-sm" />
                <span>Consultations</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                activeTab === "inventory"
                  ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <FaBox className="text-sm" />
                <span>Inventory</span>
              </div>
            </button>
          </div>
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
        {activeTab === "consultations" && (
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col gap-4">
              {/* Search and Report Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-full sm:max-w-md">
                  <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-amber-400" />
                  <input
                    type="text"
                    placeholder="Search consultations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm hover:border-amber-300 transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
                <button
                  onClick={handleReport}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 text-sm sm:text-base whitespace-nowrap"
                >
                  <FaFilePdf className="flex-shrink-0" />
                  <span className="hidden xs:inline">Generate Report</span>
                  <span className="xs:hidden">Report</span>
                </button>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaSearch className="text-amber-500" />
                  <span>Filters:</span>
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm hover:border-amber-300 transition-all duration-200 text-sm bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="Open">Open Issues</option>
                  <option value="Closed">Closed Issues</option>
                </select>

                {/* Issue Type Filter */}
                <select
                  value={issueTypeFilter}
                  onChange={(e) => setIssueTypeFilter(e.target.value)}
                  className="px-3 py-2 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm hover:border-amber-300 transition-all duration-200 text-sm bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="Pest">Pest</option>
                  <option value="Disease">Disease</option>
                  <option value="Soil Problem">Soil Problem</option>
                  <option value="Water Stress">Water Stress</option>
                  <option value="Other">Other</option>
                </select>

                {/* Response Filter */}
                <select
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value)}
                  className="px-3 py-2 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm hover:border-amber-300 transition-all duration-200 text-sm bg-white"
                >
                  <option value="all">All Issues</option>
                  <option value="has-responses">Has Responses</option>
                  <option value="no-responses">No Responses</option>
                  <option value="my-responses">My Responses</option>
                </select>

                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border-2 border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm hover:border-amber-300 transition-all duration-200 text-sm bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                {/* Clear Filters Button */}
                {(statusFilter !== "all" || issueTypeFilter !== "all" || responseFilter !== "all" || dateFilter !== "all") && (
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setIssueTypeFilter("all");
                      setResponseFilter("all");
                      setDateFilter("all");
                    }}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200 text-sm flex items-center gap-1"
                  >
                    <FaTimes className="text-xs" />
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Filter Results Summary */}
              <div className="flex items-center justify-between text-sm text-gray-600 border-t border-amber-100 pt-3">
                <div className="flex items-center gap-4">
                  <span>Showing <strong>{filteredIssues.length}</strong> of <strong>{issues.length}</strong> consultations</span>
                  {(statusFilter !== "all" || issueTypeFilter !== "all" || responseFilter !== "all" || dateFilter !== "all") && (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 font-medium">Active filters:</span>
                      <div className="flex flex-wrap gap-1">
                        {statusFilter !== "all" && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            Status: {statusFilter}
                          </span>
                        )}
                        {issueTypeFilter !== "all" && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            Type: {issueTypeFilter}
                          </span>
                        )}
                        {responseFilter !== "all" && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            {responseFilter === "has-responses" ? "Has Responses" :
                             responseFilter === "no-responses" ? "No Responses" :
                             "My Responses"}
                          </span>
                        )}
                        {dateFilter !== "all" && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            {dateFilter === "today" ? "Today" :
                             dateFilter === "week" ? "This Week" :
                             "This Month"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Controls */}
        {activeTab === "inventory" && (
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-green-400" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-green-300 transition-all duration-200 text-sm sm:text-base"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={inventoryFilter}
                  onChange={(e) => setInventoryFilter(e.target.value)}
                  className="px-3 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-green-300 transition-all duration-200 text-sm sm:text-base"
                >
                  <option value="all">All Items</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Available">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
                <select
                  value={inventoryCategoryFilter}
                  onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  className="px-3 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:border-green-300 transition-all duration-200 text-sm sm:text-base"
                >
                  <option value="all">All Categories</option>
                  <option value="harvest">Harvest</option>
                  <option value="resource">Resource</option>
                  <option value="final product">Final Product</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Consultations Content */}
        {activeTab === "consultations" && (
          <>
            {/* Issues Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIssues.map((issue) => {
                const issueResponses = responses.filter((r) => r.issueId && r.issueId._id === issue._id);
                const supportResponses = issueResponses.filter((r) => r.respondedBy !== currentUserId && currentUserRole === "consultation");
                const ownResponses = issueResponses.filter((r) => r.respondedBy === currentUserId || currentUserRole === "support");
                const isExpanded = expandedIssue === issue._id;

                return (
                  <div key={issue._id} className="bg-white rounded-xl shadow-sm border border-amber-100 hover:shadow-lg hover:border-amber-200 transition-all duration-200">
                    <div className="p-4 sm:p-6">
                      {/* Issue Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{issue.plantIssueid}</h3>
                          <p className="text-sm text-gray-500">Plot {issue.plotid}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>
                      </div>

                      {/* Issue Type */}
                      <div className="mb-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getIssueTypeColor(issue.issueType)}`}>
                          {issue.issueType}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 mb-4 line-clamp-3 text-sm sm:text-base">{issue.description}</p>

                      {/* Official Support Responses - Displayed outside the expandable section */}
                      {supportResponses.length > 0 && (
                        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-100 border-2 border-amber-200 rounded-xl shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-amber-600 rounded-full flex-shrink-0">
                              <FaUserMd className="text-white text-sm" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-amber-900 truncate">Official Support Response</h4>
                              <p className="text-xs text-amber-700">Expert guidance from support team</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {supportResponses.slice(0, 2).map((resp) => (
                              <div key={resp._id} className="bg-white bg-opacity-70 p-3 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-900 leading-relaxed mb-2 font-medium break-words whitespace-pre-wrap">
                                  {resp.responseText}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-amber-700">
                                  <span className="truncate">Response ID: {resp.responseId}</span>
                                  <span className="flex-shrink-0">{new Date(resp.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                            {supportResponses.length > 2 && (
                              <p className="text-xs text-amber-600 font-medium">
                                +{supportResponses.length - 2} more official response{supportResponses.length - 2 !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {canAddResponse() && (
                          <button
                            onClick={() => handleAddResponse(issue)}
                            className="group relative flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 overflow-hidden text-sm sm:text-base"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                            <FaReply className="text-sm relative z-10 flex-shrink-0" />
                            <span className="relative z-10 truncate">Add Consultation</span>
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpanded(issue._id)}
                          className={`group relative flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 overflow-hidden text-sm sm:text-base ${
                            ownResponses.length > 0
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                          }`}
                        >
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-200 ${
                            ownResponses.length > 0
                              ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                              : 'bg-gradient-to-r from-gray-50 to-gray-100'
                          }`}></div>
                          <FaEye className="text-sm relative z-10 flex-shrink-0" />
                          <span className="relative z-10 truncate">
                            {ownResponses.length} Consultation{ownResponses.length !== 1 ? 's' : ''}
                          </span>
                          {ownResponses.length > 0 && (
                            <span className="relative z-10 ml-1 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs font-bold flex-shrink-0">
                              {ownResponses.length}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Responses Section - Only shows own responses for consultation managers */}
                    {isExpanded && (
                      <div className="border-t border-amber-100 bg-gradient-to-b from-amber-50 to-white px-4 sm:px-6 py-4">
                        {ownResponses.length === 0 ? (
                          <p className="text-amber-500 text-sm font-medium">No consultation responses yet</p>
                        ) : (
                          <div className="space-y-3">
                            {ownResponses.map((resp) => {
                              const isOwnResponse = resp.respondedBy === currentUserId;

                              return (
                                <div key={resp._id} className={`p-3 sm:p-4 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ${
                                  isOwnResponse
                                    ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-white'
                                    : 'border-amber-100'
                                }`}>
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className={`p-2 rounded-full flex-shrink-0 ${
                                      isOwnResponse
                                        ? 'bg-amber-100'
                                        : 'bg-orange-100'
                                    }`}>
                                      <FaUserMd className={`text-sm ${
                                        isOwnResponse
                                          ? 'text-amber-600'
                                          : 'text-orange-600'
                                      }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`leading-relaxed mb-2 text-sm sm:text-base ${isOwnResponse ? 'text-gray-800' : 'text-gray-800'}`}>
                                        {resp.responseText}
                                      </p>
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500">
                                        <span className="truncate">Response ID: {resp.responseId}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="flex-shrink-0">{new Date(resp.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        isOwnResponse
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-orange-50 text-orange-600'
                                      }`}>
                                        {isOwnResponse ? 'Your Response' : 'Consultation Response'}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      {canEditResponse(resp) && (
                                        <button
                                          onClick={() => handleEditResponse(resp)}
                                          className="group relative p-2 text-amber-600 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition-all duration-200 transform hover:scale-110"
                                          title="Edit Consultation Response"
                                        >
                                          <FaEdit className="text-sm" />
                                        </button>
                                      )}
                                      {canDeleteResponse(resp) && (
                                        <button
                                          onClick={() => handleDeleteResponse(resp._id)}
                                          disabled={isDeleting === resp._id}
                                          className="group relative p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Delete Consultation Response"
                                        >
                                          {isDeleting === resp._id ? (
                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                          ) : (
                                            <FaTrash className="text-sm" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredIssues.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="text-amber-400 mb-4">
                  <FaUserMd className="mx-auto text-3xl sm:text-4xl" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No consultations found</h3>
                <p className="text-gray-500 text-sm sm:text-base">Try adjusting your search criteria</p>
              </div>
            )}
          </>
        )}

        {/* Inventory Content */}
        {activeTab === "inventory" && (
          <>
            {/* Inventory Stats */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-green-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                    <FaBox className="text-green-600 text-lg sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredInventory.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-yellow-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                    <FaExclamationTriangle className="text-yellow-600 text-lg sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Low Stock</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {filteredInventory.filter(item => item.status === "Low Stock").length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                    <FaCheckCircle className="text-blue-600 text-lg sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">In Stock</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {filteredInventory.filter(item => item.status === "Available").length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                    <FaTimesCircle className="text-red-600 text-lg sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Out of Stock</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {filteredInventory.filter(item => item.status === "Out of Stock").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredInventory.map((item) => (
                <div key={item._id} className="bg-white rounded-xl shadow-sm border border-green-100 hover:shadow-lg hover:border-green-200 transition-all duration-200">
                  <div className="p-4 sm:p-6">
                    {/* Item Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.itemId}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="text-lg font-bold text-gray-900">{item.quantity}</p>
                        <p className="text-xs text-gray-500">{item.unit}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Supplier</p>
                        <p className="text-lg font-bold text-gray-900">{item.supplier || 'N/A'}</p>
                        <p className="text-xs text-gray-500">vendor</p>
                      </div>
                    </div>

                    {/* Reorder Level */}
                    {item.reorderLevel && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <FaExclamationTriangle className="text-blue-600 text-sm" />
                          <div>
                            <p className="text-sm font-medium text-blue-800">Reorder Level</p>
                            <p className="text-xs text-blue-600">Alert when quantity drops below {item.reorderLevel}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-gray-700 mb-4 line-clamp-2 text-sm sm:text-base">{item.description}</p>

                    {/* Last Updated */}
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(item.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredInventory.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="text-green-400 mb-4">
                  <FaBox className="mx-auto text-3xl sm:text-4xl" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
                <p className="text-gray-500 text-sm sm:text-base">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </>
        )}

        {/* Response Modal */}
        {isResponseModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-amber-100 transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-amber-100 rounded-full flex-shrink-0">
                  <FaUserMd className="text-amber-600 text-lg sm:text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {responseFormData._id ? "Edit Consultation Response" : "Add Consultation Response"}
                  </h2>
                  <p className="text-gray-600 text-sm">Share your expert insights</p>
                </div>
              </div>

              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 mb-1">
                  <FaUserMd className="text-amber-600 text-sm flex-shrink-0" />
                  <p className="text-sm font-medium text-amber-800 truncate">Issue Details</p>
                </div>
                <p className="text-sm text-amber-700 truncate">
                  <strong>{selectedIssue?.plantIssueid}</strong> - {selectedIssue?.issueType}
                </p>
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Consultation Response
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none shadow-sm transition-all duration-200 text-sm sm:text-base"
                  placeholder="Provide your expert consultation response..."
                  value={responseFormData.responseText}
                  onChange={(e) =>
                    setResponseFormData({ ...responseFormData, responseText: e.target.value })
                  }
                  rows={4}
                  maxLength={1000}
                />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 gap-2">
                  <div className="text-xs text-gray-500">
                    {responseFormData.responseText.length}/1000 characters
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      responseFormData.responseText.split(' ').filter(word => word.length > 0).length >= 3
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {responseFormData.responseText.split(' ').filter(word => word.length > 0).length} words
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      /[a-zA-Z]/.test(responseFormData.responseText)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Has letters ✓
                    </span>
                  </div>
                </div>
              </div>

              {errors.responseText && (
                <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs">⚠</span>
                    </div>
                    <p className="text-red-700 text-sm font-medium">{errors.responseText}</p>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs">⚠</span>
                    </div>
                    <p className="text-red-700 text-sm font-medium">{errors.submit}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
                <button
                  onClick={() => setResponseModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveResponse}
                  disabled={isSubmitting}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      {responseFormData._id ? "Update Response" : "Add Consultation"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationDashboard;