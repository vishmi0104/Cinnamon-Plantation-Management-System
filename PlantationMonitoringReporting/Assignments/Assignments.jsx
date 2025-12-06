// src/features/PlantationMonitoringReporting/Assignments/Assignments.jsx
import React, { useState, useEffect } from "react";
import CrudPanel from "../../../components/CrudPanel";
import ModalForm from "../../../components/ModalForm";
import { generateReport } from "../../../components/Report";
import http from "../../../api/http";
import { getWithRetry } from "../../../api/retry";
import { FaFilePdf } from "react-icons/fa";

const allowOnlyText = (e) => {
  if (!/[a-zA-Z\s]/.test(e.key)) e.preventDefault();
};

//  Utility to get today's date
const getToday = () => new Date().toISOString().split("T")[0];

export default function Assignments() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [plots, setPlots] = useState([]);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    farmerId: "",
    farmerName: "",
    plotid: "",
    assignedDate: getToday(), //  default to today
  });
  const [errors, setErrors] = useState({}); //  validation errors

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aRes, pRes] = await Promise.all([
        getWithRetry("/assignments", 3),
        getWithRetry("/plots", 3),
      ]);
      setAssignments(aRes.data);
      setPlots(pRes.data);
    } catch (err) {
      console.error(" Failed to fetch:", err.message);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.farmerId) {
      newErrors.farmerId = "Farmer ID is required.";
    } else {
      //  Duplicate check
      const duplicate = assignments.find(
        (a) =>
          a.farmerId.toString() === formData.farmerId.toString() &&
          a._id !== formData._id // allow same record when editing
      );
      if (duplicate) {
        newErrors.farmerId = "This Farmer ID is already assigned.";
      }
    }
    if (!formData.farmerName) newErrors.farmerName = "Farmer Name is required.";
    if (!formData.plotid) newErrors.plotid = "Plot selection is required.";
    if (!formData.assignedDate)
      newErrors.assignedDate = "Assigned Date is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return; // stop if validation fails

    const payload = {
      farmerId: Number(formData.farmerId),
      farmerName: formData.farmerName,
      plotid: Number(formData.plotid),
      assignedDate: formData.assignedDate,
    };

    if (formData._id) {
      await http.put(`/assignments/${formData._id}`, payload);
    } else {
      await http.post("/assignments", payload);
    }
    fetchData();
    setModalOpen(false);
    setFormData({
      farmerId: "",
      farmerName: "",
      plotid: "",
      assignedDate: getToday(), //  reset to today
    });
    setErrors({});
  };

  const handleDelete = async (id) => {
    await http.delete(`/assignments/${id}`);
    fetchData();
  };

  const handleEdit = (row) => {
    setFormData(row);
    setErrors({});
    setModalOpen(true);
  };

  const handleReport = () => {
    generateReport(
      "Farmer Assignments Report",
      ["Farmer ID", "Farmer Name", "Plot ID", "Assigned Date"],
      assignments.map((a) => [
        a.farmerId,
        a.farmerName,
        a.plotid,
        new Date(a.assignedDate).toISOString().split("T")[0],
      ]),
      "AssignmentsReport.pdf"
    );
  };

  const filtered = assignments
    .filter(
      (a) =>
        a.farmerId.toString().includes(search) ||
        a.farmerName.toLowerCase().includes(search.toLowerCase()) ||
        a.plotid.toString().includes(search)
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
    { key: "farmerId", label: "Farmer ID" },
    { key: "farmerName", label: "Farmer Name" },
    { key: "plotid", label: "Plot ID" },
    {
      key: "assignedDate",
      label: "Assigned Date",
      render: (v) => (v ? new Date(v).toISOString().split("T")[0] : ""),
    },
  ];

  return (
    <>
      <CrudPanel
        title="Farmer Assignments"
        description="Assign farmers to land plots"
        columns={columns}
        data={filtered}
      >
        <input
          type="text"
          placeholder="Search assignments..."
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

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title="Assign Farmer"
      >
        {/* Farmer ID */}
        <input
          type="text"
          className="border w-full px-3 py-2 mb-1 rounded"
          placeholder="Farmer ID"
          value={formData.farmerId}
          onChange={(e) => {
            if (/^[0-9]*$/.test(e.target.value))
              setFormData({ ...formData, farmerId: e.target.value });
          }}
        />
        {errors.farmerId && (
          <p className="text-red-500 text-sm mb-2">{errors.farmerId}</p>
        )}

        {/* Farmer Name */}
        <input
          className="border w-full px-3 py-2 mb-1 rounded"
          placeholder="Farmer Name"
          value={formData.farmerName}
          onKeyPress={allowOnlyText}
          onChange={(e) =>
            setFormData({ ...formData, farmerName: e.target.value })
          }
        />
        {errors.farmerName && (
          <p className="text-red-500 text-sm mb-2">{errors.farmerName}</p>
        )}

        {/* Plot Select */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.plotid}
          onChange={(e) =>
            setFormData({ ...formData, plotid: e.target.value })
          }
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

        {/* Date (auto today, not editable) */}
        <input
          type="date"
          className="border w-full px-3 py-2 mb-1 rounded bg-gray-100 cursor-not-allowed"
          value={formData.assignedDate}
          min={getToday()}
          max={getToday()}
          readOnly
        />
        {errors.assignedDate && (
          <p className="text-red-500 text-sm mb-2">{errors.assignedDate}</p>
        )}
      </ModalForm>
    </>
  );
}
