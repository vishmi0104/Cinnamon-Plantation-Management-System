// src/features/PlantationMonitoringReporting/Plots/Plots.jsx
import React, { useState, useEffect } from "react";
import CrudPanel from "../../../components/CrudPanel";
import ModalForm from "../../../components/ModalForm";
import { generateReport } from "../../../components/Report";
import http from "../../../api/http";
import { getWithRetry } from "../../../api/retry";
import { FaFilePdf } from "react-icons/fa";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const allowPlotId = (e, currentValue) => {
  if (!/[0-9]/.test(e.key) || currentValue.length >= 3) e.preventDefault();
};
const allowLocation = (e) => { if (!/[a-zA-Z\s]/.test(e.key)) e.preventDefault(); };
const allowSize = (e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); };

export default function Plots() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [plots, setPlots] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ plotid: "", location: "", size: "", status: "" });
  const [errors, setErrors] = useState({}); //  validation errors

  const fetchPlots = async () => {
    try {
      const res = await getWithRetry("/plots", 3);
      setPlots(res.data);
    } catch (err) { console.error("❌ Failed to fetch plots:", err.message); }
  };

  useEffect(() => {
    (async () => {
      try {
        await http.get("/health");
        await fetchPlots();
      } catch {
        setTimeout(fetchPlots, 1000);
      }
    })();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.plotid) {
      newErrors.plotid = "Plot ID is required.";
    } else {
      // ✅ Duplicate check
      const duplicate = plots.find(
        (p) =>
          p.plotid.toString() === formData.plotid.toString() &&
          p._id !== formData._id // allow same record when editing
      );
      if (duplicate) {
        newErrors.plotid = "This Plot ID already exists.";
      }
    }

    if (!formData.location) newErrors.location = "Location is required.";
    if (!formData.size) newErrors.size = "Size is required.";
    if (!formData.status) newErrors.status = "Status is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return; // stop if validation fails

    const payload = {
      plotid: Number(formData.plotid),
      location: formData.location,
      size: Number(formData.size),
      status: formData.status,
    };

    try {
      if (formData._id) {
        await http.put(`/plots/${formData._id}`, payload);
      } else {
        await http.post("/plots", payload);
      }
      fetchPlots();
      setModalOpen(false);
      setFormData({ plotid: "", location: "", size: "", status: "" });
      setErrors({});
    } catch (err) {
      console.error("❌ Error saving plot:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to save plot");
    }
  };

  const handleDelete = async (id) => { await http.delete(`/plots/${id}`); fetchPlots(); };
  const handleEdit = (row) => { setFormData(row); setErrors({}); setModalOpen(true); };
  const handleReport = () => {
    generateReport(
      "Land Plots Report",
      ["Plot ID", "Location", "Size (ha)", "Status"],
      plots.map((p) => [p.plotid, p.location, p.size, p.status]),
      "PlotsReport.pdf"
    );
  };

  const filtered = plots
    .filter((p) => p.plotid.toString().includes(search) || p.location.toLowerCase().includes(search.toLowerCase()))
    .map((row) => ({
      ...row,
      actions: (
        <>
          <button onClick={() => handleEdit(row)} className="px-3 py-1 border rounded bg-blue-100 text-blue-700">EDIT</button>
          <button onClick={() => handleDelete(row._id)} className="px-3 py-1 border rounded bg-red-100 text-red-700">DELETE</button>
        </>
      ),
    }));

  const columns = [
    { key: "plotid", label: "Plot ID" },
    { key: "location", label: "Location" },
    { key: "size", label: "Size (ha)" },
    { key: "status", label: "Status" },
  ];

  const chartData = plots.map((p) => ({ name: p.location, value: p.size }));
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"];

  return (
    <>
      <CrudPanel title="Land Plots" description="Manage all land plots" columns={columns} data={filtered}>
        <input type="text" placeholder="Search plots..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded px-3 py-2 w-1/3" />
        <div className="space-x-2 flex items-center">
          <button onClick={handleReport} className="flex items-center gap-2 px-4 py-2 border rounded bg-red-100 text-red-700"><FaFilePdf /> PDF Report</button>
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-black text-white rounded">+ Add</button>
        </div>
      </CrudPanel>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">Plot Size Distribution (Pie)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">Plot Size by Location (Bar)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ModalForm isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} title="Land Plot">
        {/* Plot ID */}
        <input
          className="border w-full px-3 py-2 mb-1 rounded"
          placeholder="Plot ID (3 digits)"
          value={formData.plotid}
          onKeyPress={(e) => allowPlotId(e, formData.plotid)}
          onChange={(e) => setFormData({ ...formData, plotid: e.target.value })}
        />
        {errors.plotid && <p className="text-red-500 text-sm mb-2">{errors.plotid}</p>}

        {/* Location */}
        <input
          className="border w-full px-3 py-2 mb-1 rounded"
          placeholder="Location"
          value={formData.location}
          onKeyPress={allowLocation}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
        {errors.location && <p className="text-red-500 text-sm mb-2">{errors.location}</p>}

        {/* Size */}
        <input
          className="border w-full px-3 py-2 mb-1 rounded"
          placeholder="Size (ha)"
          value={formData.size}
          onKeyPress={allowSize}
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
        />
        {errors.size && <p className="text-red-500 text-sm mb-2">{errors.size}</p>}

        {/* Status */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="">Select Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        {errors.status && <p className="text-red-500 text-sm mb-2">{errors.status}</p>}
      </ModalForm>
    </>
  );
}
