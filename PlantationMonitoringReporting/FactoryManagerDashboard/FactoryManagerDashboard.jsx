import React, { useState, useEffect } from "react";
import { generateReport } from "../../../components/Report";
import {
  getWithRetry,
  postWithRetry,
} from "../../../api/retry";
import http from "../../../api/http";
import { FaFilePdf, FaIndustry, FaSeedling, FaEye, FaBox, FaCheckCircle, FaSignOutAlt, FaSearch, FaExclamationTriangle, FaPlus, FaTrash, FaEdit, FaTools, FaUserCheck, FaDollarSign, FaCamera, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DeliveryIssueManagement from './DeliveryIssueManagement';

const FactoryManagerDashboard = () => {
  const [harvestBatches, setHarvestBatches] = useState([]);
  const [harvestBatchesSearch, setHarvestBatchesSearch] = useState("");
  const [isLoadingHarvestBatches, setIsLoadingHarvestBatches] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isBatchDetailsModalOpen, setIsBatchDetailsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Issues state
  const [issues, setIssues] = useState([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [issuesSearch, setIssuesSearch] = useState("");
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [issueFormData, setIssueFormData] = useState({
    plotid: '',
    issueType: '',
    description: '',
    status: 'Open'
  });
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [landPlots, setLandPlots] = useState([]);

  // Add Items modal state
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
  const [orderForItems, setOrderForItems] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [itemsToAdd, setItemsToAdd] = useState([]); // { itemId, name, unit, available, quantity, price }
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Manage Items modal state
  const [isManageItemsOpen, setIsManageItemsOpen] = useState(false);
  const [orderForManage, setOrderForManage] = useState(null);
  const [manageDraft, setManageDraft] = useState({}); // itemId -> quantity
  const [isSubmittingManage, setIsSubmittingManage] = useState(false);
  
  // Delivery Issues state
  const [showDeliveryIssuesSection, setShowDeliveryIssuesSection] = useState(true);

  // Assign Delivery modal
  const [isAssignDeliveryOpen, setIsAssignDeliveryOpen] = useState(false);
  const [orderForDelivery, setOrderForDelivery] = useState(null);
  const [deliveryName, setDeliveryName] = useState("");
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  const navigate = useNavigate();
  const currentUserRole = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };

  const fetchHarvestBatches = async () => {
    try {
      setIsLoadingHarvestBatches(true);
      const res = await getWithRetry("/batches", 3);
      setHarvestBatches(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch harvest batches:", err.message);
    } finally {
      setIsLoadingHarvestBatches(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await http.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err.message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await http.get("/inventory");
      setInventory(res.data.filter(i => i.status !== 'Out of Stock'));
    } catch (err) {
      console.error("❌ Failed to fetch inventory:", err.message);
    }
  };

  const fetchIssues = async () => {
    try {
      setIsLoadingIssues(true);
      const res = await getWithRetry("/issues", 3);
      setIssues(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch issues:", err.message);
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const fetchLandPlots = async () => {
    try {
      const res = await http.get("/plots");
      setLandPlots(res.data || []);
      console.log('Land plots fetched:', res.data?.length || 0);
    } catch (err) {
      console.error("❌ Failed to fetch land plots:", err.message);
      // Set some dummy plots for testing if API fails
      setLandPlots([
        { _id: '1', plotid: 1, location: 'Test Plot 1' },
        { _id: '2', plotid: 2, location: 'Test Plot 2' },
        { _id: '3', plotid: 3, location: 'Test Plot 3' }
      ]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await http.get("/health");
        await Promise.all([fetchHarvestBatches(), fetchOrders(), fetchIssues(), fetchLandPlots()]);
      } catch {
        setTimeout(() => {
          fetchHarvestBatches();
          fetchOrders();
          fetchIssues();
          fetchLandPlots();
        }, 1000);
      }
    })();
  }, []);

  const handleProcessToInventory = async (batch) => {
    if (!window.confirm(`Are you sure you want to process harvest batch "${batch.harvestId}" to inventory? This will add ${batch.weightKg}kg of cinnamon to inventory.`)) return;

    try {
      await postWithRetry(`/batches/${batch._id}/process-to-inventory`);
      await fetchHarvestBatches();
      setSuccessMessage(`Harvest batch "${batch.harvestId}" processed to inventory successfully.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error("❌ Error processing batch to inventory:", err);
    }
  };

  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    setIsBatchDetailsModalOpen(true);
  };

  const openAddItemsModal = async (order) => {
    setOrderForItems(order);
    setItemsToAdd([]);
    await fetchInventory();
    setIsAddItemsOpen(true);
  };

  const openManageItemsModal = (order) => {
    setOrderForManage(order);
    const draft = {};
    (order.items || []).forEach(it => { draft[it.itemId] = it.quantity; });
    setManageDraft(draft);
    setIsManageItemsOpen(true);
  };

  const addItemCandidate = (invItem) => {
    if (itemsToAdd.find(i => i.itemId === invItem.itemId)) return;
    const safeAvailable = Number.isFinite(Number(invItem.quantity)) ? Number(invItem.quantity) : 0;
    const safePrice = Number.isFinite(Number(invItem.price)) && Number(invItem.price) >= 0 ? Number(invItem.price) : 0;
    setItemsToAdd(prev => ([...prev, {
      itemId: invItem.itemId,
      name: invItem.name,
      unit: invItem.unit,
      available: safeAvailable,
      quantity: 1,
      price: safePrice,
    }]));
  };

  const updateItemField = (itemId, field, value) => {
    // keep numbers controlled; coerce invalid to 0 but allow positive ints for qty
    setItemsToAdd(prev => prev.map(i =>
      i.itemId === itemId
        ? {
            ...i,
            [field]: field === 'quantity'
              ? (Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0)
              : (Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0)
          }
        : i
    ));
  };

  const removeItemCandidate = (itemId) => {
    setItemsToAdd(prev => prev.filter(i => i.itemId !== itemId));
  };

  const submitAddItems = async () => {
    if (!orderForItems || itemsToAdd.length === 0) {
      setIsAddItemsOpen(false);
      return;
    }

    for (const i of itemsToAdd) {
      const qty = Number(i.quantity);
      const price = Number(i.price);
      if (!Number.isFinite(qty) || qty <= 0) {
        alert(`Quantity for ${i.name} must be greater than 0`);
        return;
      }
      if (qty > Number(i.available)) {
        alert(`Not enough stock for ${i.name}. Available: ${i.available} ${i.unit}`);
        return;
      }
      if (!Number.isFinite(price) || price < 0) {
        alert(`Price for ${i.name} must be a non-negative number`);
        return;
      }
    }

    try {
      setIsSubmittingAdd(true);
      await http.post(`/orders/${orderForItems._id}/items`, {
        items: itemsToAdd.map(i => ({ itemId: i.itemId, quantity: Number(i.quantity), price: Number(i.price) }))
      });
      setIsAddItemsOpen(false);
      setOrderForItems(null);
      setItemsToAdd([]);
      await fetchOrders();
      setSuccessMessage('Items added to order successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.msg || err.message;
      alert(`Failed to add items to order: ${serverMsg}`);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const submitManageItemUpdate = async (itemId, currentQuantity) => {
    try {
      setIsSubmittingManage(true);
      const newQty = Number(manageDraft[itemId]);
      if (!Number.isFinite(newQty) || newQty < 0) {
        alert('Quantity must be a non-negative number');
        return;
      }
      if (newQty === currentQuantity) return;
      await http.put(`/orders/${orderForManage._id}/items/${itemId}`, { quantity: newQty });
      await fetchOrders();
      setOrderForManage(prev => ({ ...prev, items: (orders.find(o => o._id === prev._id)?.items) || prev.items }));
      setSuccessMessage('Order item updated successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.msg || err.message;
      alert(`Failed to update item: ${serverMsg}`);
    } finally {
      setIsSubmittingManage(false);
    }
  };

  const submitManageItemDelete = async (itemId) => {
    if (!window.confirm('Remove this item from the order?')) return;
    try {
      setIsSubmittingManage(true);
      await http.delete(`/orders/${orderForManage._id}/items/${itemId}`);
      await fetchOrders();
      setOrderForManage(prev => ({ ...prev, items: (orders.find(o => o._id === prev._id)?.items) || prev.items }));
      setSuccessMessage('Order item removed successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.msg || err.message;
      alert(`Failed to remove item: ${serverMsg}`);
    } finally {
      setIsSubmittingManage(false);
    }
  };

  const openAssignDeliveryModal = (order) => {
    setOrderForDelivery(order);
    setDeliveryName(order.deliveryAssignee || "");
    setIsAssignDeliveryOpen(true);
  };

  const submitAssignDelivery = async () => {
    if (!orderForDelivery) return;
    if (!deliveryName.trim()) {
      alert('Please enter a delivery name');
      return;
    }

    // Validate delivery name - only letters and spaces allowed
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(deliveryName.trim())) {
      alert('Delivery person name can only contain letters and spaces. No numbers or symbols allowed.');
      return;
    }

    try {
      setIsSubmittingDelivery(true);
      await http.put(`/orders/${orderForDelivery._id}/delivery`, { deliveryAssignee: deliveryName.trim() });
      await fetchOrders();
      setIsAssignDeliveryOpen(false);
      setOrderForDelivery(null);
      setDeliveryName("");
      setSuccessMessage('Delivery assigned successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.msg || err.message;
      alert(`Failed to assign delivery: ${serverMsg}`);
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const submitUnassignDelivery = async () => {
    if (!orderForDelivery) return;
    try {
      setIsSubmittingDelivery(true);
      await http.delete(`/orders/${orderForDelivery._id}/delivery`);
      await fetchOrders();
      setIsAssignDeliveryOpen(false);
      setOrderForDelivery(null);
      setDeliveryName("");
      setSuccessMessage('Delivery unassigned.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.msg || err.message;
      alert(`Failed to unassign delivery: ${serverMsg}`);
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  // Issue Management Functions
  const openIssueModal = (issue = null) => {
    setEditingIssue(issue);
    if (issue) {
      setIssueFormData({
        plotid: issue.plotid?.toString() || '',
        issueType: issue.issueType || '',
        description: issue.description || '',
        status: issue.status || 'Open'
      });
    } else {
      setIssueFormData({
        plotid: '',
        issueType: '',
        description: '',
        status: 'Open'
      });
    }
    setIssuePhoto(null);
    setIsIssueModalOpen(true);
    console.log('Opening issue modal:', { issue, isOpen: true }); // Debug log
  };

  const closeIssueModal = () => {
    setIsIssueModalOpen(false);
    setEditingIssue(null);
    setIssueFormData({
      plotid: '',
      issueType: '',
      description: '',
      status: 'Open'
    });
    setIssuePhoto(null);
    console.log('Closing issue modal'); // Debug log
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!issueFormData.plotid || !issueFormData.issueType || !issueFormData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if plot exists
    const plotExists = landPlots.some(plot => plot.plotid.toString() === issueFormData.plotid.toString());
    if (!plotExists) {
      alert('Invalid Plot ID. Please select a valid plot.');
      return;
    }

    try {
      setIsSubmittingIssue(true);
      const formData = new FormData();
      formData.append('plotid', issueFormData.plotid);
      
      // Get user ID from localStorage or default to 1 for factory manager
      const userId = localStorage.getItem('userId') || localStorage.getItem('id') || '1';
      formData.append('reportedBy', userId);
      
      formData.append('issueType', issueFormData.issueType);
      formData.append('description', issueFormData.description);
      formData.append('status', issueFormData.status);
      
      if (issuePhoto) {
        formData.append('photo', issuePhoto);
      }

      console.log('Submitting issue:', {
        plotid: issueFormData.plotid,
        reportedBy: userId,
        issueType: issueFormData.issueType,
        description: issueFormData.description,
        status: issueFormData.status,
        hasPhoto: !!issuePhoto
      });

      if (editingIssue) {
        await http.put(`/issues/${editingIssue._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Issue updated successfully!');
      } else {
        await http.post('/issues', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Issue created successfully!');
      }
      
      await fetchIssues();
      closeIssueModal();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('❌ Error saving issue:', err);
      const serverMsg = err?.response?.data?.error || err?.response?.data?.msg || err.message;
      alert(`Failed to save issue: ${serverMsg}`);
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleDeleteIssue = async (issue) => {
    if (!window.confirm(`Are you sure you want to delete issue "${issue.plantIssueid}"? This action cannot be undone.`)) return;

    try {
      await http.delete(`/issues/${issue._id}`);
      await fetchIssues();
      setSuccessMessage('Issue deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('❌ Error deleting issue:', err);
      const serverMsg = err?.response?.data?.error || err?.response?.data?.msg || err.message;
      alert(`Failed to delete issue: ${serverMsg}`);
    }
  };

  const filteredHarvestBatches = harvestBatches.filter(
    (batch) =>
      String(batch.harvestId || '').toLowerCase().includes(harvestBatchesSearch.toLowerCase()) ||
      String(batch.farmerId || '').toLowerCase().includes(harvestBatchesSearch.toLowerCase()) ||
      String(batch.plotid || '').toLowerCase().includes(harvestBatchesSearch.toLowerCase()) ||
      new Date(batch.harvestDate).toLocaleDateString().toLowerCase().includes(harvestBatchesSearch.toLowerCase()) ||
      String(batch.weightKg || '').toLowerCase().includes(harvestBatchesSearch.toLowerCase())
  );

  const filteredIssues = issues.filter(
    (issue) =>
      String(issue.plantIssueid || '').toLowerCase().includes(issuesSearch.toLowerCase()) ||
      String(issue.plotid || '').toLowerCase().includes(issuesSearch.toLowerCase()) ||
      String(issue.issueType || '').toLowerCase().includes(issuesSearch.toLowerCase()) ||
      String(issue.description || '').toLowerCase().includes(issuesSearch.toLowerCase()) ||
      String(issue.status || '').toLowerCase().includes(issuesSearch.toLowerCase())
  );

  const handleReport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Load logo
    try {
      const logoResponse = await fetch('/logo_trans2.png');
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });
        doc.addImage(logoBase64, 'PNG', 14, 10, 25, 25);
      }
    } catch (err) {
      console.warn('Logo not loaded:', err.message);
    }

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 69, 19); // Saddle brown
    doc.text('CINNEX (Pvt) Ltd', 45, 20);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(160, 82, 45); // Sienna
    doc.text('Golden Taste of Nature', 45, 28);

    // Report Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Factory Manager Dashboard Report', 14, 50);

    // Report Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 60);
    doc.text(`Report Period: ${new Date().toLocaleDateString()}`, 14, 67);

    // Executive Summary Box
    doc.setDrawColor(218, 165, 32); // Gold
    doc.setLineWidth(0.5);
    doc.roundedRect(14, 75, pageWidth - 28, 50, 3, 3, 'S');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 69, 19);
    doc.text('EXECUTIVE SUMMARY', 20, 85);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const totalBatches = harvestBatches.length;
    const pendingBatches = harvestBatches.filter(b => b.status === 'pending').length;
    const processedBatches = harvestBatches.filter(b => b.status === 'processed').length;
    const totalWeight = harvestBatches.reduce((sum, b) => sum + (b.weightKg || 0), 0);
    const processedWeight = harvestBatches.filter(b => b.status === 'processed').reduce((sum, b) => sum + (b.weightKg || 0), 0);
    const openIssues = issues.filter(i => i.status === 'Open').length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Calculate enhanced metrics
    const qualityScore = totalBatches > 0 ? Math.max(0, Math.min(100, ((processedBatches / totalBatches) * 100) - (openIssues * 2))) : 100;
    const processingEfficiency = totalBatches > 0 ? (processedBatches / totalBatches) * 100 : 0;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const orderFulfillmentRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const issueResolutionRate = issues.length > 0 ? ((issues.length - openIssues) / issues.length) * 100 : 0;
    const supplyHealthScore = totalBatches > 0 ? Math.max(0, 100 - (pendingBatches / totalBatches * 50)) : 100;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const criticalIssues = issues.filter(i => i.issueType === 'Disease' && i.status === 'Open').length;

    doc.text(`• Total Harvest Batches: ${totalBatches} (${pendingBatches} pending, ${processedBatches} processed)`, 20, 95);
    doc.text(`• Total Weight: ${totalWeight.toFixed(1)} kg (${processedWeight.toFixed(1)} kg processed)`, 20, 102);
    doc.text(`• Active Orders: ${totalOrders} (Revenue: $${totalRevenue.toFixed(2)})`, 20, 109);
    doc.text(`• Open Issues: ${openIssues} (${criticalIssues} critical)`, 20, 116);
    doc.text(`• Quality Score: ${qualityScore.toFixed(1)}% | Processing Efficiency: ${processingEfficiency.toFixed(1)}%`, 20, 123);

    let yPosition = 135;

    // Key Performance Indicators Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text('KEY PERFORMANCE INDICATORS', 14, yPosition);
    yPosition += 15;

    // KPI Metrics Table
    const kpiData = [
      ['Quality Score', `${qualityScore.toFixed(1)}%`, 'Target: >85%', qualityScore >= 85 ? '✅' : '⚠️'],
      ['Processing Efficiency', `${processingEfficiency.toFixed(1)}%`, 'Target: >80%', processingEfficiency >= 80 ? '✅' : '⚠️'],
      ['Order Fulfillment', `${orderFulfillmentRate.toFixed(1)}%`, 'Target: >90%', orderFulfillmentRate >= 90 ? '✅' : '⚠️'],
      ['Issue Resolution', `${issueResolutionRate.toFixed(1)}%`, 'Target: >80%', issueResolutionRate >= 80 ? '✅' : '⚠️'],
      ['Supply Chain Health', `${supplyHealthScore.toFixed(1)}%`, 'Target: >70%', supplyHealthScore >= 70 ? '✅' : '⚠️'],
      ['Average Order Value', `$${avgOrderValue.toFixed(2)}`, 'Target: >$50', avgOrderValue >= 50 ? '✅' : '⚠️']
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Current Value', 'Target', 'Status']],
      body: kpiData,
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Harvest Batches Section
    if (harvestBatches.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(218, 165, 32);
      doc.text('HARVEST BATCHES OVERVIEW', 14, yPosition);
      yPosition += 10;

      // Harvest Statistics
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Key Statistics:', 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const avgWeight = totalBatches > 0 ? totalWeight / totalBatches : 0;
      const processingRate = totalBatches > 0 ? (processedBatches / totalBatches * 100).toFixed(1) : 0;
      const uniqueFarmers = new Set(harvestBatches.map(b => b.farmerId)).size;

      doc.text(`• Average Batch Weight: ${avgWeight.toFixed(1)} kg`, 20, yPosition);
      doc.text(`• Processing Rate: ${processingRate}%`, 20, yPosition + 6);
      doc.text(`• Total Farmers: ${uniqueFarmers}`, 20, yPosition + 12);
      doc.text(`• Estimated Processing Time: ${pendingBatches * 2} hours`, 20, yPosition + 18);
      yPosition += 26;

      // Harvest Batches Table
      const harvestHeaders = ['Batch ID', 'Farmer', 'Plot', 'Date', 'Weight (kg)', 'Status', 'Quality'];
      const harvestData = harvestBatches.slice(0, 12).map(batch => [
        `#${batch.harvestId}`,
        batch.farmerId,
        `Plot ${batch.plotid}`,
        new Date(batch.harvestDate).toLocaleDateString(),
        `${batch.weightKg}`,
        batch.status.charAt(0).toUpperCase() + batch.status.slice(1),
        batch.qualityGrade || 'N/A'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [harvestHeaders],
        body: harvestData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [218, 165, 32],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Orders Section
    if (orders.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('CUSTOMER ORDERS SUMMARY', 14, yPosition);
      yPosition += 10;

      // Order Statistics
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Order Analytics:', 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const approvedOrders = orders.filter(o => o.status === 'approved').length;

      doc.text(`• Total Orders: ${totalOrders}`, 20, yPosition);
      doc.text(`• Completed: ${completedOrders} | Pending: ${pendingOrders} | Approved: ${approvedOrders}`, 20, yPosition + 6);
      doc.text(`• Average Order Value: $${avgOrderValue.toFixed(2)}`, 20, yPosition + 12);
      doc.text(`• Total Revenue: $${totalRevenue.toFixed(2)}`, 20, yPosition + 18);
      doc.text(`• Fulfillment Rate: ${orderFulfillmentRate.toFixed(1)}%`, 20, yPosition + 24);
      yPosition += 32;

      // Orders Table
      const orderHeaders = ['Order ID', 'Customer', 'Items', 'Total ($)', 'Status', 'Delivery', 'Payment'];
      const orderData = orders.slice(0, 8).map(order => {
        const userItems = order.items?.filter(item => item.addedBy !== 'factory').length || 0;
        const factoryItems = order.items?.filter(item => item.addedBy === 'factory').length || 0;
        return [
          `#${order.orderId}`,
          order.user?.username || 'N/A',
          `${userItems + factoryItems} items`,
          `$${order.totalAmount?.toFixed(2) || '0.00'}`,
          order.status.replace('_', ' ').toUpperCase(),
          order.deliveryAssignee || 'Not assigned',
          order.paymentStatus || 'N/A'
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [orderHeaders],
        body: orderData,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Issues Section
    if (issues.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('PLANTATION HEALTH ISSUES', 14, yPosition);
      yPosition += 10;

      // Issue Statistics
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Issue Analysis:', 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const pestIssues = issues.filter(i => i.issueType === 'Pest').length;
      const diseaseIssues = issues.filter(i => i.issueType === 'Disease').length;
      const soilIssues = issues.filter(i => i.issueType === 'Soil Problem').length;
      const waterIssues = issues.filter(i => i.issueType === 'Water Stress').length;
      const resolvedIssues = issues.filter(i => i.status !== 'Open').length;

      doc.text(`• Total Issues: ${issues.length} (${openIssues} open, ${resolvedIssues} resolved)`, 20, yPosition);
      doc.text(`• Critical Issues: ${criticalIssues} (Disease-related)`, 20, yPosition + 6);
      doc.text(`• Pest Issues: ${pestIssues} | Disease: ${diseaseIssues} | Soil: ${soilIssues} | Water: ${waterIssues}`, 20, yPosition + 12);
      doc.text(`• Resolution Rate: ${issueResolutionRate.toFixed(1)}%`, 20, yPosition + 18);
      yPosition += 26;

      // Issues Table
      const issueHeaders = ['Issue ID', 'Plot', 'Type', 'Severity', 'Status', 'Created', 'Description'];
      const issueData = issues.slice(0, 10).map(issue => [
        `#${issue.plantIssueid}`,
        `Plot ${issue.plotid}`,
        issue.issueType,
        issue.severity || 'Medium',
        issue.status,
        new Date(issue.createdAt).toLocaleDateString(),
        issue.description.length > 25 ? issue.description.substring(0, 25) + '...' : issue.description
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [issueHeaders],
        body: issueData,
        styles: {
          fontSize: 7,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [239, 68, 68],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          6: { cellWidth: 40 } // Description column
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Recommendations Section
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('RECOMMENDATIONS & INSIGHTS', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const recommendations = [];

    if (pendingBatches > 5) {
      recommendations.push('• CRITICAL: High volume of pending batches - prioritize processing to maintain supply chain health');
    }
    if (qualityScore < 85) {
      recommendations.push('• Quality improvement needed - focus on reducing open issues and improving processing rates');
    }
    if (orderFulfillmentRate < 90) {
      recommendations.push('• Order fulfillment below target - review delivery assignments and processing workflows');
    }
    if (criticalIssues > 0) {
      recommendations.push('• IMMEDIATE ATTENTION: Address critical disease-related issues to prevent crop loss');
    }
    if (avgOrderValue < 50) {
      recommendations.push('• Revenue optimization opportunity - consider upselling strategies to increase average order value');
    }
    if (supplyHealthScore < 70) {
      recommendations.push('• Supply chain at risk - increase processing capacity or reduce incoming harvest volume');
    }
    if (recommendations.length === 0) {
      recommendations.push('• Operations performing well - maintain current processes and monitor key metrics');
      recommendations.push('• Consider capacity expansion to handle increased harvest volumes');
    }

    recommendations.forEach((rec, index) => {
      doc.text(rec, 14, yPosition + (index * 6));
    });

    // Footer
    const footerY = pageHeight - 40;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, footerY, pageWidth - 14, footerY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    // Left side
    doc.text('CINNEX (Pvt) Ltd', 14, footerY + 8);
    doc.text('117, Sir Chittampalam A Gardinar Mawatha', 14, footerY + 14);
    doc.text('Colombo 02, Sri Lanka', 14, footerY + 20);

    // Right side
    doc.text('Generated by Factory Manager Dashboard', pageWidth - 14, footerY + 8, { align: 'right' });
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 14, footerY + 14, { align: 'right' });
    doc.text(new Date().toLocaleDateString(), pageWidth - 14, footerY + 20, { align: 'right' });

    // Contact info
    doc.text('cinnex@gmail.com | +94 11 2695279', 14, footerY + 26);
    doc.text(`© ${new Date().getFullYear()} Cinnex — Golden Taste of Nature. All rights reserved.`, 14, footerY + 32);

    // Save the PDF
    const filename = `FactoryManagerDashboard_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    setSuccessMessage('Comprehensive report generated successfully!');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-slate-50 to-indigo-50">
      <div className="w-full">
        {/* Modern Professional Header */}
        <div className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-40 backdrop-blur-lg bg-white/80">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-rose-600 rounded-xl blur-sm opacity-40"></div>
                  <div className="relative p-3 bg-gradient-to-br from-amber-500 to-rose-600 rounded-xl shadow-lg">
                    <FaIndustry className="text-white text-2xl" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Cinnamon Factory
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">Processing & Quality Management</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Quick Stats */}
                <div className="hidden lg:flex items-center gap-6 mr-6">
                  <div className="text-center px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Batches</p>
                    <p className="text-lg font-bold text-amber-600">{harvestBatches.filter(b => b.status === 'pending').length}</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Orders</p>
                    <p className="text-lg font-bold text-emerald-600">{orders.length}</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-rose-50 rounded-xl border border-rose-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Issues</p>
                    <p className="text-lg font-bold text-rose-600">{issues.filter(i => i.status === 'Open').length}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <FaSignOutAlt className="text-sm" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="max-w-7xl mx-auto mb-6 p-4 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 rounded-2xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <FaCheckCircle className="text-emerald-600 text-lg" />
              </div>
              <p className="text-emerald-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Main Content Container */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Dashboard Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pending Batches Card */}
            <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-lg border border-amber-100 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 uppercase tracking-wider">Pending Batches</p>
                  <p className="text-3xl font-bold text-amber-600">{harvestBatches.filter(b => b.status === 'pending').length}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <p className="text-xs text-amber-800">Ready for processing</p>
                  </div>
                  {/* Additional Value Data */}
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-xs text-amber-700 font-medium">
                      Est. Processing Time: {harvestBatches.filter(b => b.status === 'pending').length * 2} hours
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors shadow-sm">
                  <FaSeedling className="text-amber-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Active Orders Card */}
            <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl shadow-lg border border-emerald-100 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 uppercase tracking-wider">Active Orders</p>
                  <p className="text-3xl font-bold text-emerald-600">{orders.length}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <p className="text-xs text-emerald-800">Customer orders</p>
                  </div>
                  {/* Additional Value Data */}
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-xs text-emerald-700 font-medium">
                      Revenue: ${orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Avg: ${(orders.length > 0 ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length : 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors shadow-sm">
                  <FaBox className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Open Issues Card */}
            <div className="bg-gradient-to-br from-white to-rose-50 rounded-2xl shadow-lg border border-rose-100 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-100 to-rose-200 rounded-full opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 uppercase tracking-wider">Open Issues</p>
                  <p className="text-3xl font-bold text-rose-600">{issues.filter(i => i.status === 'Open').length}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                    <p className="text-xs text-rose-800">Require attention</p>
                  </div>
                  {/* Additional Value Data */}
                  <div className="mt-3 pt-3 border-t border-rose-200">
                    <p className="text-xs text-rose-700 font-medium">
                      Resolution Rate: {issues.length > 0 ? ((issues.filter(i => i.status !== 'Open').length / issues.length) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-xs text-rose-600 mt-1">
                      Critical: {issues.filter(i => i.issueType === 'Disease' && i.status === 'Open').length}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-rose-100 rounded-xl group-hover:bg-rose-200 transition-colors shadow-sm">
                  <FaExclamationTriangle className="text-rose-600 text-xl" />
                </div>
              </div>
            </div>

            {/* Processed Weight Card */}
            <div className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl shadow-lg border border-indigo-100 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full opacity-20 -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 uppercase tracking-wider">Processed</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {harvestBatches.filter(b => b.status === 'processed').reduce((sum, b) => sum + (b.weightKg || 0), 0)}kg
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                    <p className="text-xs text-indigo-800">Total processed</p>
                  </div>
                  {/* Additional Value Data */}
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-xs text-indigo-700 font-medium">
                      Efficiency: {harvestBatches.length > 0 ? ((harvestBatches.filter(b => b.status === 'processed').length / harvestBatches.length) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">
                      Avg Batch: {(harvestBatches.length > 0 ? harvestBatches.reduce((sum, b) => sum + (b.weightKg || 0), 0) / harvestBatches.length : 0).toFixed(1)}kg
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors shadow-sm">
                  <FaIndustry className="text-indigo-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Quality Score Card */}
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg border border-purple-100 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <FaCheckCircle className="text-purple-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 uppercase tracking-wider">Quality Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(() => {
                      const totalBatches = harvestBatches.length;
                      const processedBatches = harvestBatches.filter(b => b.status === 'processed').length;
                      const openIssues = issues.filter(i => i.status === 'Open').length;
                      const qualityScore = totalBatches > 0 ? Math.max(0, Math.min(100, ((processedBatches / totalBatches) * 100) - (openIssues * 2))) : 100;
                      return qualityScore.toFixed(1);
                    })()}%
                  </p>
                  <p className="text-xs text-purple-700 mt-1">Based on processing & issues</p>
                </div>
              </div>
            </div>

            {/* Revenue Trend Card */}
            <div className="bg-gradient-to-br from-white to-cyan-50 rounded-2xl shadow-lg border border-cyan-100 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-100 rounded-xl">
                  <FaDollarSign className="text-cyan-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 uppercase tracking-wider">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-cyan-600">
                    ${orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-cyan-700 mt-1">
                    {(() => {
                      const completedOrders = orders.filter(o => o.status === 'completed').length;
                      const completionRate = orders.length > 0 ? (completedOrders / orders.length * 100).toFixed(1) : 0;
                      return `${completionRate}% fulfillment rate`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Supply Chain Health Card */}
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg border border-orange-100 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <FaTools className="text-orange-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 uppercase tracking-wider">Supply Health</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(() => {
                      const pendingBatches = harvestBatches.filter(b => b.status === 'pending').length;
                      const totalBatches = harvestBatches.length;
                      const healthScore = totalBatches > 0 ? Math.max(0, 100 - (pendingBatches / totalBatches * 50)) : 100;
                      return healthScore.toFixed(1);
                    })()}%
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    {harvestBatches.filter(b => b.status === 'pending').length} batches pending
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Controls Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              <div className="flex-1 max-w-2xl">
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Search Operations</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500 bg-amber-100 p-1.5 rounded-lg">
                    <FaSearch className="text-sm" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search harvest batches, orders, issues..."
                    value={harvestBatchesSearch}
                    onChange={(e) => setHarvestBatchesSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50/80 hover:bg-white transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleReport}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:from-amber-600 hover:to-rose-600 transform hover:scale-105 transition-all duration-200"
                >
                  <FaFilePdf className="text-white/90" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Delivery Issues Management */}
            {showDeliveryIssuesSection && (
              <DeliveryIssueManagement orders={orders} />
            )}

          {/* Harvest Batches Section - Modern Professional Design */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptLTE4LTE2aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptOS0xMmg0djFoLTR2LTF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                    <FaSeedling className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Cinnamon Harvest</h2>
                    <p className="text-amber-100">Process raw materials into premium quality products</p>
                  </div>
                </div>
                <div className="bg-amber-400/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{filteredHarvestBatches.length}</p>
                    <p className="text-xs text-amber-100">Harvest Batches</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">Harvest ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">Farmer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">Plot</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">Weight</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-amber-50">
                  {filteredHarvestBatches.map((batch) => (
                    <tr key={batch._id} className="hover:bg-amber-50/50 transition-all duration-200 group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-amber-400 rounded-full mr-3"></div>
                          <span className="text-sm font-bold text-gray-900">#{batch.harvestId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md text-blue-700">
                          {batch.farmerId}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium px-2.5 py-1 bg-purple-50 border border-purple-100 rounded-md text-purple-700">
                          Plot {batch.plotid}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-gray-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          {new Date(batch.harvestDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-amber-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{batch.weightKg} kg</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                          batch.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          batch.status === 'processed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {batch.status === 'pending' && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2"></div>}
                          {batch.status === 'processed' && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></div>}
                          {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          {batch.status === 'pending' && (
                            <button
                              onClick={() => handleProcessToInventory(batch)}
                              className="inline-flex items-center px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors duration-200 shadow-sm hover:shadow-md"
                              title="Process to inventory"
                            >
                              <FaBox className="mr-1.5" />
                              Process
                            </button>
                          )}
                          <button
                            onClick={() => handleViewBatch(batch)}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition-colors duration-200 shadow-sm hover:shadow-md"
                            title="View details"
                          >
                            <FaEye className="mr-1.5" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {filteredHarvestBatches.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-b from-white/0 to-amber-50/30">
              <div className="bg-amber-50 p-4 rounded-full inline-block mb-4">
                <FaSeedling className="mx-auto text-4xl text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">No harvest batches found</h3>
              <p className="text-amber-700/70">Harvest batches will appear here once created</p>
            </div>
          )}
        </div>

        {/* Recent Orders Section - Enhanced Modern Design */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptLTE4LTE2aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptOS0xMmg0djFoLTR2LTF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                  <FaBox className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Cinnamon Orders</h2>
                  <p className="text-emerald-100">Process and manage customer purchases</p>
                </div>
              </div>
              <div className="bg-emerald-400/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex gap-2 items-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white font-medium">{orders.length} Active Orders</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Delivery</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-emerald-50">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-emerald-50/50 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                        <span className="text-sm font-bold text-gray-900">#{order.orderId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-700">
                        {order.user?.username || 'Customer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const userItems = order.items?.filter(item => item.addedBy !== 'factory').length || 0;
                          const addedItems = order.items?.filter(item => item.addedBy === 'factory').length || 0;
                          return (
                            <div className="flex gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs">
                                <span className="font-bold">{userItems}</span>
                                <span>User</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-xs">
                                <span className="font-bold">{addedItems}</span>
                                <span>Factory</span>
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="p-1 bg-emerald-100 rounded-full">
                          <FaDollarSign className="text-xs text-emerald-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">${order.totalAmount?.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        order.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        order.status === 'payment_required' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                        order.status === 'completed' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {order.status === 'pending' && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2"></div>}
                        {order.status === 'approved' && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></div>}
                        {order.status === 'payment_required' && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></div>}
                        {order.status === 'completed' && <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></div>}
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.deliveryAssignee ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-indigo-100 rounded-full">
                            <FaUserCheck className="text-xs text-indigo-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{order.deliveryAssignee}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="p-1 bg-gray-100 rounded-full">
                            <FaUserCheck className="text-xs text-gray-400" />
                          </div>
                          <span className="text-sm italic">Not assigned</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => openAssignDeliveryModal(order)} 
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                          title="Assign delivery"
                        >
                          <FaUserCheck className="mr-1.5" />
                          Assign
                        </button>
                        <button 
                          onClick={() => openAddItemsModal(order)} 
                          className="text-emerald-600 hover:text-white hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 border border-emerald-200 hover:border-emerald-600 text-xs font-medium shadow-sm hover:shadow-md"
                          title="Add items"
                        >
                          <FaPlus className="text-xs" />
                          <span>Add</span>
                        </button>
                        <button 
                          onClick={() => openManageItemsModal(order)} 
                          className="text-teal-600 hover:text-white hover:bg-teal-600 px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 border border-teal-200 hover:border-teal-600 text-xs font-medium shadow-sm hover:shadow-md"
                          title="Manage items"
                        >
                          <FaTools className="text-xs" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-b from-white/0 to-emerald-50/30">
              <div className="bg-emerald-50 p-4 rounded-full inline-block mb-4">
                <FaBox className="mx-auto text-4xl text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 mb-2">No orders found</h3>
              <p className="text-emerald-700/70">Customer orders will appear here once placed</p>
            </div>
          )}
        </div>

        {/* Issues Management Section - Modern & Professional */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-rose-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-amber-400 p-6 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptLTE4LTE2aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptOS0xMmg0djFoLTR2LTF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                  <FaExclamationTriangle className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Plantation Health Issues</h2>
                  <p className="text-white/80">Monitor and resolve quality concerns effectively</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-500 bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                    <FaSearch className="text-white" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search issues..."
                    value={issuesSearch}
                    onChange={(e) => setIssuesSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-white/70 shadow-md"
                  />
                </div>
                <button
                  onClick={() => {
                    console.log('Add Issue button clicked - Current state:', {
                      isIssueModalOpen,
                      landPlots: landPlots.length,
                      issues: issues.length
                    });
                    openIssueModal();
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-rose-600 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-white/30"
                  type="button"
                >
                  <FaPlus />
                  <span>Add Issue</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-rose-50 to-amber-50 border-b border-rose-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-rose-800 uppercase tracking-wider">Issue ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-rose-800 uppercase tracking-wider">Plot ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-rose-800 uppercase tracking-wider">Issue Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-rose-800 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-rose-800 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-rose-800 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-rose-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/70 backdrop-blur-sm divide-y divide-rose-50">
                {filteredIssues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-rose-50/50 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-rose-400 rounded-full mr-3"></div>
                        <span className="text-sm font-bold text-gray-900">#{issue.plantIssueid}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
                        Plot {issue.plotid}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                        issue.issueType === 'Pest' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                        issue.issueType === 'Disease' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                        issue.issueType === 'Soil Problem' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        issue.issueType === 'Water Stress' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {issue.issueType === 'Pest' && <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2"></div>}
                        {issue.issueType === 'Disease' && <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mr-2"></div>}
                        {issue.issueType === 'Soil Problem' && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2"></div>}
                        {issue.issueType === 'Water Stress' && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>}
                        {issue.issueType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs">
                      <div className="text-gray-900 truncate font-medium" title={issue.description}>
                        {issue.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                        issue.status === 'Open' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {issue.status === 'Open' && <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mr-2"></div>}
                        {issue.status !== 'Open' && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></div>}
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(issue.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => openIssueModal(issue)}
                          className="inline-flex items-center px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors duration-200 shadow-sm hover:shadow-md"
                          title="Edit issue"
                        >
                          <FaEdit className="mr-1.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteIssue(issue)}
                          className="inline-flex items-center px-3 py-1.5 bg-rose-500 text-white text-xs font-medium rounded-lg hover:bg-rose-600 transition-colors duration-200 shadow-sm hover:shadow-md"
                          title="Delete issue"
                        >
                          <FaTrash className="mr-1.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredIssues.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-b from-white/0 to-rose-50/30">
              <div className="bg-rose-50 p-4 rounded-full inline-block mb-4">
                <FaExclamationTriangle className="mx-auto text-4xl text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold text-rose-900 mb-2">No issues found</h3>
              <p className="text-rose-700/70">Plantation health issues will appear here once reported</p>
              <button
                onClick={() => openIssueModal()}
                className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-lg font-medium shadow-md hover:bg-rose-700 transition-colors duration-200"
                type="button"
              >
                <FaPlus className="text-xs" />
                <span>Report an Issue</span>
              </button>
            </div>
          )}
        </div>

        </div>

        </div>

      {/* Add Items Modal */}
        {isAddItemsOpen && orderForItems && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl">
                    <FaPlus className="text-white text-xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add Items to Order</h2>
                    <p className="text-gray-600">Order ID: {orderForItems.orderId}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsAddItemsOpen(false); setOrderForItems(null); setItemsToAdd([]); }}
                  className="p-3 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="text-gray-600 text-xl" />
                </button>
              </div>

              {/* Inventory Search */}
              <div className="mb-6">
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input 
                    type="text" 
                    placeholder="Search inventory..." 
                    value={inventorySearch} 
                    onChange={(e) => setInventorySearch(e.target.value)} 
                    className="w-full pl-12 pr-4 py-4 border-2 border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/70 backdrop-blur-sm shadow-sm"
                  />
                </div>
                <div className="mt-4 max-h-60 overflow-y-auto border-2 border-gray-200 rounded-2xl bg-white/50 backdrop-blur-sm">
                  {inventory.filter(i => i.name.toLowerCase().includes(inventorySearch.toLowerCase()) || i.itemId.toLowerCase().includes(inventorySearch.toLowerCase())).map(i => (
                    <div key={i._id} className="flex items-center justify-between px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-white/70 transition-colors">
                      <div>
                        <div className="font-semibold text-gray-900">{i.name} <span className="text-sm text-gray-500">({i.itemId})</span></div>
                        <div className="text-sm text-gray-600">{i.quantity} {i.unit} available • ${Number(i.price) || 0} each</div>
                      </div>
                      <button 
                        onClick={() => addItemCandidate(i)} 
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                      >
                        <FaPlus className="text-sm" /> Add
                      </button>
                    </div>
                  ))}
                  {inventory.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <FaBox className="mx-auto text-3xl mb-3 text-gray-400" />
                      <p>No inventory items available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items to Add */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items to Add</h3>
                {itemsToAdd.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300">
                    <FaPlus className="mx-auto text-3xl mb-3 text-gray-400" />
                    <p className="text-gray-500">No items selected yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {itemsToAdd.map(i => (
                      <div key={i.itemId} className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm">
                        <div>
                          <div className="font-semibold text-gray-900">{i.name} <span className="text-sm text-gray-500">({i.itemId})</span></div>
                          <div className="text-sm text-gray-600">Available: {i.available} {i.unit}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Qty</label>
                            <input 
                              type="number" 
                              min={1} 
                              max={i.available} 
                              value={Number.isFinite(Number(i.quantity)) ? i.quantity : 0} 
                              onChange={(e) => updateItemField(i.itemId, 'quantity', e.target.value)} 
                              className="w-20 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <FaDollarSign className="text-emerald-500" />
                            <input 
                              type="number" 
                              min={0} 
                              step="0.01" 
                              value={Number.isFinite(Number(i.price)) ? i.price : 0} 
                              onChange={(e) => updateItemField(i.itemId, 'price', e.target.value)} 
                              className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          <button 
                            onClick={() => removeItemCandidate(i.itemId)} 
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => { setIsAddItemsOpen(false); setOrderForItems(null); setItemsToAdd([]); }}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingAdd || itemsToAdd.length === 0}
                  onClick={submitAddItems}
                  className={`flex-1 px-6 py-4 text-white rounded-2xl font-semibold shadow-lg transition-all duration-200 ${
                    itemsToAdd.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transform hover:scale-105'
                  }`}
                >
                  {isSubmittingAdd ? 'Adding...' : 'Add Items to Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Items Modal */}
        {isManageItemsOpen && orderForManage && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-blue-100 transform transition-all duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Manage Items - {orderForManage.orderId}</h2>
                <button onClick={() => { setIsManageItemsOpen(false); setOrderForManage(null); setManageDraft({}); }} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
              </div>

              {(orderForManage.items || []).length === 0 ? (
                <div className="p-4 text-gray-500 bg-gray-50 rounded-xl">No items in this order</div>
              ) : (
                <div className="space-y-3">
                  {orderForManage.items.map((it, index) => (
                    <div key={`${it.itemId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-medium text-gray-900">{it.name} <span className="text-xs text-gray-400">({it.itemId})</span></div>
                        <div className="text-sm text-gray-600">{it.category} • ${it.price} each • {it.unit}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={manageDraft[it.itemId] ?? it.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setManageDraft(prev => ({ ...prev, [it.itemId]: val < 0 ? 0 : val }));
                          }}
                          className="w-24 px-3 py-2 border rounded-lg"
                        />
                        <button
                          disabled={isSubmittingManage}
                          onClick={() => submitManageItemUpdate(it.itemId, it.quantity)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60"
                        >
                          <FaEdit />
                        </button>
                        <button
                          disabled={isSubmittingManage}
                          onClick={() => submitManageItemDelete(it.itemId)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-60"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button onClick={() => { setIsManageItemsOpen(false); setOrderForManage(null); setManageDraft({}); }} className="px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Delivery Modal */}
        {isAssignDeliveryOpen && orderForDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Assign Delivery - {orderForDelivery.orderId}</h2>
                <button onClick={() => { setIsAssignDeliveryOpen(false); setOrderForDelivery(null); setDeliveryName(""); }} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
              </div>
              <div className="mb-3 text-sm text-gray-600">
                Current assignee: {orderForDelivery.deliveryAssignee ? <span className="font-medium text-gray-900">{orderForDelivery.deliveryAssignee}</span> : <span className="text-gray-400">Not assigned</span>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Delivery person name</label>
                <input
                  value={deliveryName}
                  onChange={(e) => setDeliveryName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter delivery person name"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">Only letters and spaces allowed</p>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setIsAssignDeliveryOpen(false); setOrderForDelivery(null); setDeliveryName(""); }} className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg">Cancel</button>
                <button disabled={isSubmittingDelivery} onClick={submitAssignDelivery} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-60">Save</button>
                {orderForDelivery.deliveryAssignee && (
                  <button disabled={isSubmittingDelivery} onClick={submitUnassignDelivery} className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg disabled:opacity-60">Unassign</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Batch Details Modal */}
        {isBatchDetailsModalOpen && selectedBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-orange-100 transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-orange-100 rounded-full flex-shrink-0">
                  <FaSeedling className="text-orange-600 text-lg sm:text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    Harvest Batch Details
                  </h2>
                  <p className="text-gray-600 text-sm">View detailed information for harvest batch {selectedBatch.harvestId}</p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Batch Information */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <FaSeedling className="text-orange-600 text-sm flex-shrink-0" />
                    <p className="text-sm font-medium text-orange-800">Batch Information</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Harvest ID:</span>
                      <span className="ml-2 text-gray-900">{selectedBatch.harvestId}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Farmer ID:</span>
                      <span className="ml-2 text-gray-900">{selectedBatch.farmerId}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Plot ID:</span>
                      <span className="ml-2 text-gray-900">{selectedBatch.plotid}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Harvest Date:</span>
                      <span className="ml-2 text-gray-900">{new Date(selectedBatch.harvestDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Weight:</span>
                      <span className="ml-2 text-gray-900">{selectedBatch.weightKg} kg</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedBatch.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedBatch.status === 'processed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedBatch.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Processing Information */}
                {selectedBatch.status === 'processed' && (
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FaBox className="text-green-600 text-sm flex-shrink-0" />
                      <p className="text-sm font-medium text-green-800">Processing Information</p>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>This batch has been processed and added to inventory as cinnamon.</p>
                      <p className="mt-2"><span className="font-medium">Added to Inventory:</span> {selectedBatch.weightKg} kg of cinnamon</p>
                    </div>
                  </div>
                )}

                {/* Pending Actions */}
                {selectedBatch.status === 'pending' && (
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FaExclamationTriangle className="text-yellow-600 text-sm flex-shrink-0" />
                      <p className="text-sm font-medium text-yellow-800">Pending Action Required</p>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>This batch is ready for processing. Click the "Process" button to add it to inventory.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
                <button
                  onClick={() => {
                    setIsBatchDetailsModalOpen(false);
                    setSelectedBatch(null);
                  }}
                  className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                >
                  Close
                </button>
                {selectedBatch.status === 'pending' && (
                  <button
                    onClick={() => {
                      setIsBatchDetailsModalOpen(false);
                      handleProcessToInventory(selectedBatch);
                    }}
                    className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <FaBox className="text-sm" />
                    Process to Inventory
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Issue Modal - Modern Design */}
        {(isIssueModalOpen || process.env.NODE_ENV === 'development') && isIssueModalOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" 
            style={{ zIndex: 9999 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeIssueModal();
              }
            }}
          >
            <div 
              className="bg-white/95 backdrop-blur-md rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto transform transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-lg">
                    <FaExclamationTriangle className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {editingIssue ? 'Edit Issue' : 'Report New Issue'}
                    </h2>
                    <p className="text-gray-600 font-medium">Plantation health management</p>
                  </div>
                </div>
                <button
                  onClick={closeIssueModal}
                  className="p-3 rounded-2xl hover:bg-gray-100 transition-all duration-200 group"
                  type="button"
                >
                  <FaTimes className="text-gray-600 text-xl group-hover:text-gray-800" />
                </button>
              </div>

              <form onSubmit={handleIssueSubmit} className="space-y-8">
                {/* Plot Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Plot Selection <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={issueFormData.plotid}
                    onChange={(e) => setIssueFormData({ ...issueFormData, plotid: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white/70 backdrop-blur-sm transition-all duration-200 text-gray-900 font-medium"
                    required
                  >
                    <option value="">Select a plot</option>
                    {landPlots.map((plot) => (
                      <option key={plot._id || plot.plotid} value={plot.plotid}>
                        Plot {plot.plotid} {plot.location ? `- ${plot.location}` : ''}
                      </option>
                    ))}
                  </select>
                  {landPlots.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                      <FaExclamationTriangle className="text-xs" />
                      Loading plots...
                    </p>
                  )}
                </div>

                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Issue Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={issueFormData.issueType}
                    onChange={(e) => setIssueFormData({ ...issueFormData, issueType: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white/70 backdrop-blur-sm transition-all duration-200 text-gray-900 font-medium"
                    required
                  >
                    <option value="">Select issue type</option>
                    <option value="Pest">🐛 Pest Issue</option>
                    <option value="Disease">🦠 Disease</option>
                    <option value="Soil Problem">🌱 Soil Problem</option>
                    <option value="Water Stress">💧 Water Stress</option>
                    <option value="Other">❓ Other</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={issueFormData.description}
                    onChange={(e) => setIssueFormData({ ...issueFormData, description: e.target.value })}
                    placeholder="Describe the issue in detail..."
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white/70 backdrop-blur-sm transition-all duration-200 text-gray-900 resize-none"
                    rows={5}
                    required
                    minLength={10}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">{issueFormData.description.length} characters (minimum 10)</p>
                    <div className={`w-2 h-2 rounded-full ${issueFormData.description.length >= 10 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                  </div>
                </div>

                {/* Status and Photo Upload Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Status
                    </label>
                    <select
                      value={issueFormData.status}
                      onChange={(e) => setIssueFormData({ ...issueFormData, status: e.target.value })}
                      className="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white/70 backdrop-blur-sm transition-all duration-200 text-gray-900 font-medium"
                    >
                      <option value="Open">🔴 Open</option>
                      <option value="Closed">🟢 Closed</option>
                    </select>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Photo (Optional)
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-gray-300 rounded-2xl hover:border-red-400 transition-all duration-200 cursor-pointer bg-white/50 backdrop-blur-sm group">
                        <FaCamera className="text-gray-400 group-hover:text-red-500 text-xl" />
                        <span className="text-gray-600 group-hover:text-red-600 font-medium">Choose photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && file.size > 2 * 1024 * 1024) {
                              alert('File size must be less than 2MB');
                              e.target.value = '';
                              return;
                            }
                            setIssuePhoto(file);
                          }}
                          className="hidden"
                        />
                      </label>
                      {issuePhoto && (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-2">
                            <FaCamera className="text-emerald-600" />
                            <span className="text-sm text-emerald-800 font-medium">{issuePhoto.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIssuePhoto(null)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG files only. Max 2MB.</p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 mt-10">
                  <button
                    type="button"
                    onClick={closeIssueModal}
                    className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingIssue || !issueFormData.plotid || !issueFormData.issueType || !issueFormData.description.trim()}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmittingIssue ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaExclamationTriangle />
                        <span>{editingIssue ? 'Update Issue' : 'Create Issue'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FactoryManagerDashboard;