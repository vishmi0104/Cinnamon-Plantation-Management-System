import { useState, useEffect } from "react";
import { getWithRetry } from "../../../../api/retry";

export const useConsultations = () => {
  const [responses, setResponses] = useState([]);
  const [issues, setIssues] = useState([]);

  const fetchIssues = async () => {
    try {
      const res = await getWithRetry("/issues", 3);
      setIssues(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch issues:", err.message);
    }
  };

  const fetchResponses = async () => {
    try {
      const res = await getWithRetry("/responses", 3);
      setResponses(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch responses:", err.message);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchResponses();
  }, []);

  const getIssueStatusColor = (status) => {
    return status === "Open" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800";
  };

  const getIssueTypeColor = (type) => {
    const colors = {
      Pest: "bg-orange-100 text-orange-800",
      Disease: "bg-red-100 text-red-800",
      "Soil Problem": "bg-yellow-100 text-yellow-800",
      "Water Stress": "bg-orange-100 text-orange-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return {
    responses,
    setResponses,
    issues,
    setIssues,
    fetchIssues,
    fetchResponses,
    getIssueStatusColor,
    getIssueTypeColor,
  };
};