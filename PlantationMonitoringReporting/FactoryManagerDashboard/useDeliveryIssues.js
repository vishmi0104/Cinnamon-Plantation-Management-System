import React, { useState, useEffect } from 'react';
import http from '../../../api/http';

// Custom hook for managing delivery issues
export const useDeliveryIssues = () => {
  const [deliveryIssues, setDeliveryIssues] = useState([]);
  const [deliveryResponses, setDeliveryResponses] = useState([]);
  const [isLoadingDeliveryIssues, setIsLoadingDeliveryIssues] = useState(false);
  const [deliveryIssuesSearch, setDeliveryIssuesSearch] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch delivery issues from API
  const fetchDeliveryIssues = async () => {
    try {
      setIsLoadingDeliveryIssues(true);
      const res = await http.get("/delivery-issues");
      setDeliveryIssues(res.data);
      return res.data;
    } catch (err) {
      console.error("❌ Failed to fetch delivery issues:", err.message);
      setErrorMessage("Failed to fetch delivery issues");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsLoadingDeliveryIssues(false);
    }
  };

  // Fetch delivery responses from API
  const fetchDeliveryResponses = async () => {
    try {
      const res = await http.get("/delivery-responses");
      setDeliveryResponses(res.data);
      return res.data;
    } catch (err) {
      console.error("❌ Failed to fetch delivery responses:", err.message);
    }
  };

  // Add a new delivery issue
  const addDeliveryIssue = async (formData) => {
    try {
      const res = await http.post("/delivery-issues", formData);
      await fetchDeliveryIssues();
      setSuccessMessage("Delivery issue reported successfully");
      setTimeout(() => setSuccessMessage(""), 5000);
      return res.data;
    } catch (err) {
      console.error("❌ Failed to add delivery issue:", err.message);
      setErrorMessage(err.response?.data?.error || "Failed to add delivery issue");
      setTimeout(() => setErrorMessage(""), 5000);
      throw err;
    }
  };

  // Update an existing delivery issue
  const updateDeliveryIssue = async (id, formData) => {
    try {
      const res = await http.put(`/delivery-issues/${id}`, formData);
      await fetchDeliveryIssues();
      setSuccessMessage("Delivery issue updated successfully");
      setTimeout(() => setSuccessMessage(""), 5000);
      return res.data;
    } catch (err) {
      console.error("❌ Failed to update delivery issue:", err.message);
      setErrorMessage(err.response?.data?.error || "Failed to update delivery issue");
      setTimeout(() => setErrorMessage(""), 5000);
      throw err;
    }
  };

  // Delete a delivery issue
  const deleteDeliveryIssue = async (id) => {
    try {
      await http.delete(`/delivery-issues/${id}`);
      await fetchDeliveryIssues();
      setSuccessMessage("Delivery issue deleted successfully");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("❌ Failed to delete delivery issue:", err.message);
      setErrorMessage(err.response?.data?.error || "Failed to delete delivery issue");
      setTimeout(() => setErrorMessage(""), 5000);
      throw err;
    }
  };

  // Filter delivery issues based on search term
  const filteredDeliveryIssues = deliveryIssues.filter(
    (issue) =>
      String(issue.deliveryIssueId || '').toLowerCase().includes(deliveryIssuesSearch.toLowerCase()) ||
      String(issue.orderId || '').toLowerCase().includes(deliveryIssuesSearch.toLowerCase()) ||
      String(issue.issueType || '').toLowerCase().includes(deliveryIssuesSearch.toLowerCase()) ||
      String(issue.description || '').toLowerCase().includes(deliveryIssuesSearch.toLowerCase()) ||
      String(issue.status || '').toLowerCase().includes(deliveryIssuesSearch.toLowerCase()) ||
      String(issue.deliveryPerson || '').toLowerCase().includes(deliveryIssuesSearch.toLowerCase()) ||
      String(issue.customerName || '').toLowerCase().includes(deliveryIssuesSearch.toLowerCase())
  );

  // Get delivery responses for a specific issue
  const getResponsesForIssue = (issueId) => {
    return deliveryResponses.filter(response => 
      response.deliveryIssueId && 
      (response.deliveryIssueId._id === issueId || response.deliveryIssueId === issueId)
    );
  };

  // Add a delivery response
  const addDeliveryResponse = async (formData) => {
    try {
      const res = await http.post("/delivery-responses", formData);
      await fetchDeliveryResponses();
      setSuccessMessage("Response submitted successfully");
      setTimeout(() => setSuccessMessage(""), 5000);
      return res.data;
    } catch (err) {
      console.error("❌ Failed to submit response:", err.message);
      setErrorMessage(err.response?.data?.error || "Failed to submit response");
      setTimeout(() => setErrorMessage(""), 5000);
      throw err;
    }
  };

  return {
    deliveryIssues,
    deliveryResponses,
    filteredDeliveryIssues,
    isLoadingDeliveryIssues,
    deliveryIssuesSearch,
    setDeliveryIssuesSearch,
    successMessage,
    errorMessage,
    fetchDeliveryIssues,
    fetchDeliveryResponses,
    addDeliveryIssue,
    updateDeliveryIssue,
    deleteDeliveryIssue,
    addDeliveryResponse,
    getResponsesForIssue,
  };
};