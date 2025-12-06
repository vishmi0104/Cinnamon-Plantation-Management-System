// src/features/PlantationMonitoringReporting/Fertilizes/Fertilizes.jsx
import React, { useState, useEffect } from "react";
import CrudPanel from "../../../components/CrudPanel";
import ModalForm from "../../../components/ModalForm";
import { generateReport } from "../../../components/Report";
import http from "../../../api/http";
import { getWithRetry } from "../../../api/retry";
import { FaFilePdf } from "react-icons/fa";

//  Charts
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const allowOnlyNumbers = (e) => {
  if (!/[0-9]/.test(e.key)) e.preventDefault();
};

// Utility: get today
const getToday = () => new Date().toISOString().split("T")[0];

export default function Fertilizes() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [fertilizes, setFertilizes] = useState([]);
  const [plots, setPlots] = useState([]);
  const [allFarmers, setAllFarmers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    farmerId: "",
    farmerName: "",
    plotid: "",
    type: "",
    units: "",
    distributedDate: getToday(),
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fRes, pRes, aRes] = await Promise.all([
        getWithRetry("/fertilizes", 3),
        getWithRetry("/plots", 3),
        getWithRetry("/assignments", 3),
      ]);
      setFertilizes(fRes.data);
      setPlots(pRes.data);
      setAllFarmers(aRes.data);
    } catch (err) {
      console.error(" Failed to fetch:", err.message);
    }
  };

  const handlePlotChange = (plotid) => {
    setFormData({
      ...formData,
      plotid,
      farmerId: "",
      farmerName: "",
    });
    const filtered = allFarmers.filter((f) => f.plotid === Number(plotid));
    setFarmers(filtered);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.plotid) newErrors.plotid = "Plot selection is required.";
    if (!formData.farmerId) newErrors.farmerId = "Farmer is required.";
    if (!formData.type) newErrors.type = "Type is required.";
    if (!formData.units) newErrors.units = "Units are required.";
    if (!formData.distributedDate)
      newErrors.distributedDate = "Distributed Date is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = {
      farmerId: Number(formData.farmerId),
      plotid: Number(formData.plotid),
      type: formData.type,
      units: Number(formData.units),
      distributedDate: formData.distributedDate,
    };

    if (formData._id) await http.put(`/fertilizes/${formData._id}`, payload);
    else await http.post("/fertilizes", payload);

    fetchData();
    setModalOpen(false);
    setFormData({
      farmerId: "",
      farmerName: "",
      plotid: "",
      type: "",
      units: "",
      distributedDate: getToday(),
    });
    setErrors({});
    setFarmers([]);
  };

  const handleDelete = async (id) => {
    await http.delete(`/fertilizes/${id}`);
    fetchData();
  };

  const handleEdit = (row) => {
    setFormData(row);
    setErrors({});
    setModalOpen(true);
  };

  const handleReport = () => {
    generateReport(
      "Fertilizer Distribution Report",
      [
        "Distribution ID",
        "Farmer ID",
        "Plot ID",
        "Type",
        "Units",
        "Distributed Date",
      ],
      fertilizes.map((f) => [
        f.distributionId,
        f.farmerId,
        f.plotid,
        f.type,
        f.units,
        new Date(f.distributedDate).toISOString().split("T")[0],
      ]),
      "FertilizeReport.pdf"
    );
  };

  const filtered = fertilizes
    .filter(
      (f) =>
        f.distributionId?.toLowerCase().includes(search.toLowerCase()) ||
        f.farmerId.toString().includes(search) ||
        f.plotid.toString().includes(search) ||
        f.type.toLowerCase().includes(search.toLowerCase())
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
    { key: "distributionId", label: "Distribution ID" },
    { key: "farmerId", label: "Farmer ID" },
    { key: "plotid", label: "Plot ID" },
    { key: "type", label: "Type" },
    { key: "units", label: "Units" },
    {
      key: "distributedDate",
      label: "Distributed Date",
      render: (v) => (v ? new Date(v).toISOString().split("T")[0] : ""),
    },
  ];

  //  Aggregate fertilizer units by TYPE (instead of Farmer)
  const typeChartData = Object.values(
    fertilizes.reduce((acc, f) => {
      if (!acc[f.type]) {
        acc[f.type] = { type: f.type, value: 0 };
      }
      acc[f.type].value += Number(f.units) || 0;
      return acc;
    }, {})
  );

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#FF6666",
    "#FFB6C1",
  ];

  return (
    <>
      <CrudPanel
        title="Fertilize Distribution"
        description="Manage fertilize distribution to farmers"
        columns={columns}
        data={filtered}
      >
        <input
          type="text"
          placeholder="Search distributions..."
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

      {/*  Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Pie Chart by Type */}
        <div className="p-4 border rounded shadow">
          <h3 className="text-lg font-semibold mb-2">
            Fertilizer Units by Type (Pie)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeChartData}
                dataKey="value"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {typeChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart by Type */}
        <div className="p-4 border rounded shadow">
          <h3 className="text-lg font-semibold mb-2">
            Fertilizer Units by Type (Bar)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeChartData}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
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
        title="Fertilizer Distribution"
      >
        {/* Plot ID */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.plotid}
          onChange={(e) => handlePlotChange(Number(e.target.value))}
        >
          <option value="">Select Plot</option>
          {plots.map((p) => (
            <option key={p._id} value={p.plotid}>
              {p.plotid} - {p.location}
            </option>
          ))}
        </select>
        {errors.plotid && (
          <p className="text-red-500 text-sm mb-2">{errors.plotid}</p>
        )}

        {/* Farmer Dropdown */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.farmerId}
          onChange={(e) => {
            const selectedFarmer = farmers.find(
              (f) => f.farmerId === Number(e.target.value)
            );
            setFormData({
              ...formData,
              farmerId: e.target.value,
              farmerName: selectedFarmer ? selectedFarmer.farmerName : "",
            });
          }}
          disabled={!farmers.length}
        >
          <option value="">Select Farmer</option>
          {farmers.map((f) => (
            <option key={f.farmerId} value={f.farmerId}>
              {f.farmerId} - {f.farmerName}
            </option>
          ))}
        </select>
        {errors.farmerId && (
          <p className="text-red-500 text-sm mb-2">{errors.farmerId}</p>
        )}

        {/* Fertilizer Type */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="">Select Fertilizer Type</option>
          <option value="Compost">Compost</option>
          <option value="Biofertilizers">Biofertilizers</option>
          <option value="Nitrogen">Nitrogen</option>
          <option value="Green manure">Green manure</option>
          <option value="Phosphorus">Phosphorus</option>
          <option value="Farmyard manure (FYM)">
            Farmyard manure (FYM)
          </option>
        </select>
        {errors.type && (
          <p className="text-red-500 text-sm mb-2">{errors.type}</p>
        )}

        {/* Units */}
        <input
          className="border w-full px-3 py-2 mb-1 rounded"
          placeholder="Units"
          value={formData.units}
          onKeyPress={allowOnlyNumbers}
          onChange={(e) => setFormData({ ...formData, units: e.target.value })}
        />
        {errors.units && (
          <p className="text-red-500 text-sm mb-2">{errors.units}</p>
        )}

        {/* Date (fixed today, no calendar icon) */}
        <input
          type="text"
          className="border w-full px-3 py-2 mb-1 rounded bg-gray-100 cursor-not-allowed"
          value={getToday()}
          readOnly
        />
        {errors.distributedDate && (
          <p className="text-red-500 text-sm mb-2">
            {errors.distributedDate}
          </p>
        )}
      </ModalForm>
    </>
  );
}
