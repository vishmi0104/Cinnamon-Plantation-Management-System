// src/features/PlantationMonitoringReporting/Batches/Batches.jsx
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

const allowOnlyNumbers = (value) => /^[0-9]*$/.test(value);
const allowTodayOnly = () => new Date().toISOString().split("T")[0];

export default function Batches() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [plots, setPlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const today = allowTodayOnly();

  const [formData, setFormData] = useState({
    harvestId: "",
    farmerId: "",
    plotid: "",
    harvestDate: today,
    weightKg: "",
    status: "Pending",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bRes, pRes, aRes] = await Promise.all([
        getWithRetry("/batches", 3),
        getWithRetry("/plots", 3),
        getWithRetry("/assignments", 3),
      ]);
      setBatches(bRes.data);
      setPlots(pRes.data);
      setAssignments(aRes.data);
    } catch (err) {
      console.error("❌ Failed to fetch:", err.message);
    }
  };

  const handleSave = async () => {
    const newErrors = {};

    if (!formData.plotid) newErrors.plotid = " Plot is required";
    if (!formData.farmerId) newErrors.farmerId = " Farmer is required";
    if (!formData.weightKg) newErrors.weightKg = " Weight is required";
    if (!formData.status) newErrors.status = " Status is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const payload = {
      farmerId: Number(formData.farmerId),
      plotid: Number(formData.plotid),
      harvestDate: today,
      weightKg: Number(formData.weightKg),
      status: formData.status,
    };

    if (formData._id) {
      await http.put(`/batches/${formData._id}`, payload);
    } else {
      await http.post("/batches", payload);
    }
    fetchData();
    setModalOpen(false);
    setFormData({
      harvestId: "",
      farmerId: "",
      plotid: "",
      harvestDate: today,
      weightKg: "",
      status: "Pending",
    });
    setErrors({});
  };

  const handleDelete = async (id) => {
    await http.delete(`/batches/${id}`);
    fetchData();
  };

  const handleEdit = (row) => {
    setFormData({ ...row, harvestDate: today });
    setModalOpen(true);
  };

  const handleReport = () => {
    generateReport(
      "Harvest Batches Report",
      ["Harvest ID", "Farmer ID", "Plot ID", "Harvest Date", "Weight (Kg)", "Status"],
      batches.map((b) => [
        b.harvestId,
        b.farmerId,
        b.plotid,
        b.harvestDate ? new Date(b.harvestDate).toISOString().split("T")[0] : "",
        b.weightKg,
        b.status,
      ]),
      "BatchesReport.pdf"
    );
  };

  const filtered = batches
    .filter(
      (b) =>
        b.harvestId?.toLowerCase().includes(search.toLowerCase()) ||
        b.plotid.toString().includes(search) ||
        b.farmerId.toString().includes(search) ||
        b.status?.toLowerCase().includes(search.toLowerCase())
    )
    .map((row) => ({
      ...row,
      actions: (
        <>
          <button
            onClick={() => handleEdit(row)}
            className="px-3 py-1 border rounded bg-blue-100 text-blue-700"
          >
            EDIT
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="px-3 py-1 border rounded bg-red-100 text-red-700"
          >
            DELETE
          </button>
        </>
      ),
    }));

  const columns = [
    { key: "harvestId", label: "Harvest ID" },
    { key: "farmerId", label: "Farmer ID" },
    { key: "plotid", label: "Plot ID" },
    {
      key: "harvestDate",
      label: "Harvest Date",
      render: (v) => (v ? new Date(v).toISOString().split("T")[0] : ""),
    },
    { key: "weightKg", label: "Weight (Kg)" },
    { key: "status", label: "Status" },
  ];

  const chartData = batches.map((b) => ({
    name: `Farmer ${b.farmerId}`,
    value: b.weightKg,
  }));
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD"];

  return (
    <>
      <CrudPanel
        title="Harvest Batches"
        description="Manage harvest batch records"
        columns={columns}
        data={filtered}
      >
        <input
          type="text"
          placeholder="Search by Harvest ID, Farmer ID, Plot ID or Status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-1/3"
        />
        <div className="space-x-2 flex items-center">
          <button
            onClick={handleReport}
            className="flex items-center gap-2 px-4 py-2 border rounded bg-red-100 text-red-700"
          >
            <FaFilePdf /> PDF Report
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-black text-white rounded"
          >
            + Add
          </button>
        </div>
      </CrudPanel>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">
            Harvest Weight by Farmer (Pie)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v} Kg`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-bold mb-4">
            Harvest Weight by Farmer (Bar)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => `${v} Kg`} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal Form */}
      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title="Harvest Batch"
      >
        {formData.harvestId && (
          <input
            className="border w-full px-3 py-2 mb-2 rounded bg-gray-100"
            value={formData.harvestId}
            readOnly
          />
        )}

        {/* Plot Select */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.plotid}
          onChange={(e) =>
            setFormData({ ...formData, plotid: e.target.value, farmerId: "" })
          }
        >
          <option value="">Select Plot</option>
          {plots.map((p) => (
            <option key={p._id} value={p.plotid}>
              {p.plotid} - {p.location}
            </option>
          ))}
        </select>
        {errors.plotid && <p className="text-red-500 text-sm">{errors.plotid}</p>}

        {/* Farmer Select */}
        {formData.plotid && (
          <>
            <select
              className="border w-full px-3 py-2 mb-1 rounded"
              value={formData.farmerId}
              onChange={(e) =>
                setFormData({ ...formData, farmerId: e.target.value })
              }
            >
              <option value="">Select Farmer</option>
              {assignments
                .filter((a) => a.plotid.toString() === formData.plotid.toString())
                .map((a) => (
                  <option key={a._id} value={a.farmerId}>
                    {a.farmerId} - {a.farmerName}
                  </option>
                ))}
            </select>
            {errors.farmerId && (
              <p className="text-red-500 text-sm">{errors.farmerId}</p>
            )}
          </>
        )}

        {/* Harvest Date */}
        <input
          type="text"
          className="border w-full px-3 py-2 mb-2 rounded bg-gray-100"
          value={today}
          readOnly
        />

        {/* Weight */}
        <input
          type="text"
          className="border w-full px-3 py-2 mb-1 rounded"
          placeholder="Weight (Kg)"
          value={formData.weightKg}
          onChange={(e) => {
            if (allowOnlyNumbers(e.target.value))
              setFormData({ ...formData, weightKg: e.target.value });
          }}
        />
        {errors.weightKg && (
          <p className="text-red-500 text-sm">{errors.weightKg}</p>
        )}

        {/* Status */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.status}
          onChange={(e) =>
            setFormData({ ...formData, status: e.target.value })
          }
        >
          <option value="">Select Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Processed</option>
        </select>
        {errors.status && (
          <p className="text-red-500 text-sm">{errors.status}</p>
        )}
      </ModalForm>
    </>
  );
}
