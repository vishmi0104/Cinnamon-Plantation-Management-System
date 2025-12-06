import React, { useEffect, useState } from "react";
import http from "../../../api/http";

export default function Home() {
  const [stats, setStats] = useState({
    plots: 0,
    assignments: 0,
    batches: 0,
    issues: 0,
    fertilizes: 0, // ✅ Fertilize count
    inventory: 0,
    lowStock: 0,
    financeIncome: 0,
    financeExpense: 0,
  });

  const [recent, setRecent] = useState([]);

  // Fetch stats + recent activity
  const fetchData = async () => {
    try {
      const [plotsRes, assignmentsRes, batchesRes, issuesRes, fertilizesRes, inventoryRes, financeRes, transactionsRes] =
        await Promise.all([
          http.get("/plots"),
          http.get("/assignments"),
          http.get("/batches"),
          http.get("/issues"),
          http.get("/fertilizes"), // ✅ fetch fertilize distributions
          http.get("/inventory"),
          http.get("/finance/summary"),
          http.get("/finance/transactions"), // Get all transactions
        ]);

      const inventoryData = inventoryRes.data;
      const lowStockCount = inventoryData.filter(item => item.status === 'Low Stock').length;

      setStats({
        plots: plotsRes.data.length,
        assignments: assignmentsRes.data.length,
        batches: batchesRes.data.length,
        issues: issuesRes.data.length,
        fertilizes: fertilizesRes.data.length, // ✅ count
        inventory: inventoryData.length,
        lowStock: lowStockCount,
        financeIncome: financeRes.data.totalIncome || 0,
        financeExpense: financeRes.data.totalExpense || 0,
      });

      // Collect last 3 activity records across all collections
      const allActivities = [];

      plotsRes.data.forEach((p) =>
        allActivities.push({
          type: "Plot",
          message: `New plot added: ${p.plotid} (${p.location})`,
          date: new Date(p.createdAt || p.updatedAt),
        })
      );

      assignmentsRes.data.forEach((a) =>
        allActivities.push({
          type: "Assignment",
          message: `Farmer ${a.farmerName} assigned to plot ${a.plotid}`,
          date: new Date(a.createdAt || a.updatedAt),
        })
      );

      batchesRes.data.forEach((b) =>
        allActivities.push({
          type: "Batch",
          message: `Batch harvested on plot ${b.plotid} (${b.weightKg} kg)`,
          date: new Date(b.createdAt || b.updatedAt),
        })
      );

      issuesRes.data.forEach((i) =>
        allActivities.push({
          type: "Issue",
          message: `Issue reported on plot ${i.plotid}: ${i.issueType}`,
          date: new Date(i.createdAt || i.updatedAt),
        })
      );

      fertilizesRes.data.forEach((f) =>
        allActivities.push({
          type: "Fertilize",
          message: `Distributed ${f.fertilizerUnits} units of ${f.fertilizerType} on plot ${f.plotid}`,
          date: new Date(f.createdAt || f.updatedAt),
        })
      );

      inventoryData.forEach((item) =>
        allActivities.push({
          type: "Inventory",
          message: `${item.category} item "${item.name}" ${item.status === 'Low Stock' ? 'is low on stock' : 'updated'} (${item.quantity} ${item.unit})`,
          date: new Date(item.createdAt || item.updatedAt),
        })
      );

      transactionsRes.data.slice(0, 5).forEach((transaction) =>
        allActivities.push({
          type: "Finance",
          message: `${transaction.type === 'income' ? 'Income' : 'Expense'}: ${transaction.description} ($${transaction.amount})`,
          date: new Date(transaction.date),
        })
      );

      // Sort by date, latest first, take top 3
      const latest = allActivities
        .sort((a, b) => b.date - a.date)
        .slice(0, 3);

      setRecent(latest);
    } catch (err) {
      console.error("Error fetching dashboard data:", err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center">🏡 Home</h2>
      <p className="text-gray-500">
        Welcome to the Plantation Monitoring & Reporting Dashboard.
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white shadow rounded-lg">
          <h3 className="font-bold">Active Land Plots</h3>
          <p className="text-2xl">{stats.plots}</p>
          <p className="text-gray-500">Currently active plots</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg">
          <h3 className="font-bold">Assigned Farmers</h3>
          <p className="text-2xl">{stats.assignments}</p>
          <p className="text-gray-500">Farmers working on plots</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg">
          <h3 className="font-bold">Harvest Batches</h3>
          <p className="text-2xl">{stats.batches}</p>
          <p className="text-gray-500">This month</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg">
          <h3 className="font-bold">Health Issues</h3>
          <p className="text-2xl">{stats.issues}</p>
          <p className="text-gray-500">Pending resolution</p>
        </div>
        {/* ✅ Fertilize Distribution */}
        <div className="p-4 bg-white shadow rounded-lg">
          <h3 className="font-bold">Fertilize Distribution</h3>
          <p className="text-2xl">{stats.fertilizes}</p>
          <p className="text-gray-500">Distributions made</p>
        </div>
        {/* Inventory Stats */}
        <div className="p-4 bg-white shadow rounded-lg">
          <h3 className="font-bold">Inventory Items</h3>
          <p className="text-2xl">{stats.inventory}</p>
          <p className="text-gray-500">{stats.lowStock} low stock alerts</p>
        </div>
        {/* Finance Stats */}
        <div className="p-4 bg-white shadow rounded-lg">
          <h3 className="font-bold">Total Income</h3>
          <p className="text-2xl text-green-600">${stats.financeIncome.toFixed(2)}</p>
          <p className="text-gray-500">From operations</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg">
          <h3 className="font-bold">Total Expenses</h3>
          <p className="text-2xl text-red-600">${stats.financeExpense.toFixed(2)}</p>
          <p className="text-gray-500">Resource costs</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-bold">Recent Activity</h3>
        <ul className="mt-3 space-y-2">
          {recent.length > 0 ? (
            recent.map((r, i) => (
              <li key={i}>
                {r.type === "Plot" && "📍"}
                {r.type === "Assignment" && "👩‍🌾"}
                {r.type === "Batch" && "🌾"}
                {r.type === "Issue" && "🐛"}
                {r.type === "Fertilize" && "🧪"}
                {r.type === "Inventory" && "📦"}
                {r.type === "Finance" && "💰"}{" "}
                {r.message} —{" "}
                <span className="text-gray-500 text-sm">
                  {r.date.toLocaleDateString()} {r.date.toLocaleTimeString()}
                </span>
              </li>
            ))
          ) : (
            <li className="text-gray-500">No recent activity</li>
          )}
        </ul>
      </div>
    </div>
  );
}
