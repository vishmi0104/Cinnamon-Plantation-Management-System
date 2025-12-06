// src/features/PlantationMonitoringReporting/Issues/Issues.jsx 
import React, { useState, useEffect } from "react";
import CrudPanel from "../../../components/CrudPanel";
import ModalForm from "../../../components/ModalForm";
import { generateReport } from "../../../components/Report";
import {
  getWithRetry,
  deleteWithRetry,
} from "../../../api/retry";
import http from "../../../api/http";
import { FaFilePdf } from "react-icons/fa";

const allowDescription = (v) => /^[a-zA-Z0-9\s.,-]*$/.test(v);
const validateFile = (file) => {
  const ok = ["image/jpeg", "image/png", "image/jpg"].includes(file.type);
  if (!ok) {
    alert("❌ Only JPG and PNG files are allowed.");
    return false;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert("❌ File size must be less than 2MB.");
    return false;
  }
  return true;
};

export default function Issues() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [issues, setIssues] = useState([]);
  const [plots, setPlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    plotid: "",
    reportedBy: "",
    issueType: "Pest",
    description: "",
    status: "Open",
    photo: null,
  });

  const userRole = localStorage.getItem("role");

  const fetchData = async () => {
    try {
      const [iRes, pRes, aRes] = await Promise.all([
        getWithRetry("/issues", 3),
        getWithRetry("/plots", 3),
        getWithRetry("/assignments", 3),
      ]);
      setIssues(iRes.data);
      setPlots(pRes.data);
      setAssignments(aRes.data);
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

  const handleSave = async () => {
    const newErrors = {};

    if (!formData.plotid) newErrors.plotid = " Plot is required";
    if (!formData.reportedBy) newErrors.reportedBy = " Farmer is required";
    if (!formData.issueType) newErrors.issueType = " Issue type is required";
    if (!formData.description) newErrors.description = " Description is required";
    if (!formData.status) newErrors.status = " Status is required";
    if (!formData.photo) newErrors.photo = " Photo is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const fd = new FormData();
    fd.append("plotid", String(formData.plotid));
    fd.append("reportedBy", String(formData.reportedBy));
    fd.append("issueType", formData.issueType);
    fd.append("description", formData.description);
    fd.append("status", formData.status);
    if (formData.photo) fd.append("photo", formData.photo);

    try {
      if (formData._id) {
        await http.put(`/issues/${formData._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await http.post("/issues", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchData();
      setModalOpen(false);
      setFormData({
        plotid: "",
        reportedBy: "",
        issueType: "Pest",
        description: "",
        status: "Open",
        photo: null,
      });
      setErrors({});
    } catch (err) {
      console.error("❌ Error saving issue:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to save issue");
    }
  };

  const handleDelete = async (id) => {
    await deleteWithRetry(`/issues/${id}`);
    fetchData();
  };

  const handleEdit = (row) => {
    setFormData({ ...row, photo: null });
    setModalOpen(true);
  };

  const handleReport = () => {
    generateReport(
      "Plantation Health Issues Report",
      ["Issue ID", "Plot ID", "Reported By", "Issue Type", "Description", "Status"],
      issues.map((i) => [
        i.plantIssueid,
        i.plotid,
        i.reportedBy,
        i.issueType,
        (i.description || "").length > 50
          ? i.description.substring(0, 50) + "..."
          : i.description || "",
        i.status,
      ]),
      "IssuesReport.pdf"
    );
  };

  const filtered = issues
    .filter(
      (i) =>
        i.plantIssueid?.toLowerCase().includes(search.toLowerCase()) ||
        i.plotid?.toString().includes(search) ||
        i.reportedBy?.toString().includes(search) ||
        i.issueType?.toLowerCase().includes(search.toLowerCase())
    )
    .map((row) => ({
      ...row,
      photoUrl: row.photoUrl ? (
        <img
          src={`http://localhost:5000${row.photoUrl}`}
          alt="Issue"
          className="h-12 w-12 object-cover rounded"
        />
      ) : (
        "No photo"
      ),
      actions: (
        <>
          {userRole === "plantation" && (
            <div className="flex space-x-2">
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
            </div>
          )}
        </>
      ),
    }));

  const columns = [
    { key: "plantIssueid", label: "Issue ID" },
    { key: "plotid", label: "Plot ID" },
    { key: "reportedBy", label: "Reported By (Farmer ID)" },
    { key: "issueType", label: "Issue Type" },
    { key: "description", label: "Description" },
    { key: "status", label: "Status" },
    { key: "photoUrl", label: "Photo" },
  ];

  const farmersForPlot = assignments.filter(
    (a) => a.plotid?.toString() === formData.plotid?.toString()
  );

  return (
    <>
      <CrudPanel
        title="Plantation Health Issues"
        description="Monitor plantation health issues"
        columns={columns}
        data={filtered}
      >
        <input
          type="text"
          placeholder="Search by Issue ID, Plot ID, Farmer ID, Issue Type..."
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
          {userRole === "plantation" && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-black text-white rounded"
            >
              + Add
            </button>
          )}
        </div>
      </CrudPanel>

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title="Report Issue"
      >
        {/* Plot */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.plotid}
          onChange={(e) =>
            setFormData({ ...formData, plotid: e.target.value, reportedBy: "" })
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

        {/* Farmer */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.reportedBy}
          onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
          disabled={!formData.plotid}
        >
          <option value="">Select Farmer</option>
          {farmersForPlot.map((f) => (
            <option key={f._id} value={f.farmerId}>
              {f.farmerId} - {f.farmerName}
            </option>
          ))}
        </select>
        {errors.reportedBy && <p className="text-red-500 text-sm">{errors.reportedBy}</p>}

        {/* Issue Type */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.issueType}
          onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
        >
          <option value="">Select Issue Type</option>
          <option>Pest</option>
          <option>Disease</option>
          <option>Soil Problem</option>
          <option>Water Stress</option>
          <option>Other</option>
        </select>
        {errors.issueType && <p className="text-red-500 text-sm">{errors.issueType}</p>}

        {/* Description */}
        <textarea
          className="border w-full px-3 py-2 mb-1 rounded"
          placeholder="Description"
          value={formData.description}
          onChange={(e) => {
            if (allowDescription(e.target.value)) {
              setFormData({ ...formData, description: e.target.value });
            }
          }}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}

        {/* Status */}
        <select
          className="border w-full px-3 py-2 mb-1 rounded"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="">Select Status</option>
          <option>Open</option>
          <option>Closed</option>
        </select>
        {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}

        {/* Photo */}
        <input
          type="file"
          accept=".jpg,.jpeg,.png"
          className="border w-full px-3 py-2 mb-1 rounded"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && validateFile(file)) {
              setFormData({ ...formData, photo: file });
            }
          }}
        />
        {errors.photo && <p className="text-red-500 text-sm">{errors.photo}</p>}
      </ModalForm>
    </>
  );
}
