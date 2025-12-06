import React, { useState, useEffect } from "react";
import { generateReport } from "../../../components/Report";
import {
  getWithRetry,
} from "../../../api/retry";
import http from "../../../api/http";
import { FaFilePdf, FaMoneyBillWave, FaArrowUp, FaArrowDown, FaCheckCircle, FaSignOutAlt, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const FinanceDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, income, expense

  const navigate = useNavigate();

  const currentUserRole = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  const fetchTransactions = async () => {
    try {
      const [transactionsRes, summaryRes] = await Promise.all([
        getWithRetry("/finance/transactions", 3),
        getWithRetry("/finance/summary", 3),
      ]);
      setTransactions(transactionsRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error("❌ Failed to fetch finance data:", err.message);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await http.get("/health");
        await fetchTransactions();
      } catch {
        setTimeout(fetchTransactions, 1000);
      }
    })();
  }, []);

  const handleReport = () => {
    generateReport(
      "Finance Dashboard Report",
      ["Transaction ID", "Type", "Description", "Amount", "Date", "Category"],
      transactions.map((transaction) => [
        transaction.transactionId,
        transaction.type,
        transaction.description,
        transaction.amount,
        new Date(transaction.date).toLocaleDateString(),
        transaction.category,
      ]),
      "FinanceDashboardReport.pdf"
    );
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      transaction.type === filter;

    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type) => {
    return type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getCategoryColor = (category) => {
    const colors = {
      harvest: "bg-green-100 text-green-800",
      resource: "bg-blue-100 text-blue-800",
      "final product": "bg-purple-100 text-purple-800",
      delivery: "bg-orange-100 text-orange-800",
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur-lg opacity-30"></div>
                <div className="relative p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl shadow-lg">
                  <FaChartLine className="text-xl sm:text-2xl text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                  Finance Dashboard
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 sm:w-8 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Track Financial Transactions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full border border-white/30 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full ${currentUserRole === 'support' ? 'bg-green-500' : currentUserRole === 'inventory' ? 'bg-blue-500' : 'bg-purple-500'} animate-pulse`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {currentUserRole === 'support' ? 'Support Manager' : currentUserRole === 'inventory' ? 'Inventory Manager' : 'Finance Manager'}
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
            Monitor financial transactions linked to inventory operations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Income</p>
                <p className="text-2xl sm:text-3xl font-bold">${summary.totalIncome?.toFixed(2) || '0.00'}</p>
              </div>
              <FaArrowUp className="text-green-200 text-2xl sm:text-3xl" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl sm:text-3xl font-bold">${summary.totalExpense?.toFixed(2) || '0.00'}</p>
              </div>
              <FaArrowDown className="text-red-200 text-2xl sm:text-3xl" />
            </div>
          </div>

          <div className={`bg-gradient-to-r ${summary.netProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-xl p-4 sm:p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-${summary.netProfit >= 0 ? 'blue' : 'orange'}-100 text-sm font-medium`}>Net Profit</p>
                <p className="text-2xl sm:text-3xl font-bold">${summary.netProfit?.toFixed(2) || '0.00'}</p>
              </div>
              <FaMoneyBillWave className={`text-${summary.netProfit >= 0 ? 'blue' : 'orange'}-200 text-2xl sm:text-3xl`} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <FaMoneyBillWave className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-blue-300 transition-all duration-200 text-sm sm:text-base"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base"
              >
                <option value="all">All Transactions</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>
            </div>
            <button
              onClick={handleReport}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
            >
              <FaFilePdf className="flex-shrink-0" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Description</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Category</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.transactionId}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(transaction.category)}`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-blue-400 mb-4">
                <FaMoneyBillWave className="mx-auto text-3xl sm:text-4xl" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500 text-sm sm:text-base">Transactions linked to inventory operations will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
