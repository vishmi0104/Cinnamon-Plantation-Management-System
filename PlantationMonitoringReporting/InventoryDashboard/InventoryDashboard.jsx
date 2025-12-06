import React, { useState, useEffect } from "react";
import { generateReport } from "../../../components/Report";
import {
  getWithRetry,
  postWithRetry,
  putWithRetry,
  deleteWithRetry,
} from "../../../api/retry";
import http from "../../../api/http";
import { FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimes, FaReply, FaSave, FaBox } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Components
import DashboardHeader from "./components/DashboardHeader";
import SearchControls from "./components/SearchControls";
import SuccessMessage from "./components/SuccessMessage";
import InventoryGrid from "./components/InventoryGrid";
import ConsultationsTable from "./components/ConsultationsTable";
import HarvestBatchesTable from "./components/HarvestBatchesTable";
import AddEditInventoryModal from "./components/AddEditInventoryModal";

// Hooks
import { useInventory } from "./hooks/useInventory";
import { useConsultations } from "./hooks/useConsultations";
import { useHarvestBatches } from "./hooks/useHarvestBatches";

const InventoryDashboard = () => {
  const navigate = useNavigate();

  const currentUserRole = localStorage.getItem("role");

  // Component states
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "kg",
    category: "resource",
    price: "",
    description: "",
    supplier: "",
    reorderLevel: "",
    manufactureDate: "",
    expireDate: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Allocation states
  const [allocatedInventory, setAllocatedInventory] = useState({});
  const [isAllocateToResponseModalOpen, setIsAllocateToResponseModalOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [selectedResponseForAllocation, setSelectedResponseForAllocation] = useState(null);
  const [allocationQuantity, setAllocationQuantity] = useState("");
  const [allocationErrors, setAllocationErrors] = useState({});
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false);

  // Edit allocation states
  const [isEditAllocationModalOpen, setIsEditAllocationModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [editAllocationQuantity, setEditAllocationQuantity] = useState("");
  const [editAllocationErrors, setEditAllocationErrors] = useState({});
  const [isSubmittingEditAllocation, setIsSubmittingEditAllocation] = useState(false);

  // Batch details modal state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isBatchDetailsModalOpen, setIsBatchDetailsModalOpen] = useState(false);

  // Custom hooks
  const {
    inventory,
    setInventory,
    search,
    setSearch,
    filteredInventory,
    fetchInventory,
    getStatusColor,
    getCategoryColor,
  } = useInventory();

  const {
    responses,
    setResponses,
    issues,
    fetchIssues,
    fetchResponses,
    getIssueStatusColor,
    getIssueTypeColor,
  } = useConsultations();

  const {
    harvestBatches,
    setHarvestBatches,
    fetchHarvestBatches,
  } = useHarvestBatches();

  // Initial data fetch
  useEffect(() => {
    (async () => {
      try {
        await http.get("/health");
        await fetchInventory();
        await fetchIssues();
        await fetchResponses();
        await fetchHarvestBatches();
      } catch {
        setTimeout(() => {
          fetchInventory();
          fetchIssues();
          fetchResponses();
          fetchHarvestBatches();
        }, 1000);
      }
    })();
  }, []);

  // Auto-refresh consultations every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchResponses();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setFormData({
      name: "",
      quantity: "",
      unit: "kg",
      category: "resource",
      price: "",
      description: "",
      supplier: "",
      reorderLevel: "",
      manufactureDate: "",
      expireDate: "",
    });
    setModalOpen(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      price: item.price || "",
      description: item.description || "",
      supplier: item.supplier || "",
      reorderLevel: item.reorderLevel || "",
      manufactureDate: item.manufactureDate ? new Date(item.manufactureDate).toISOString().split('T')[0] : "",
      expireDate: item.expireDate ? new Date(item.expireDate).toISOString().split('T')[0] : "",
    });
    setModalOpen(true);
  };

  const handleSaveItem = async () => {
    // Validation logic (keeping the same as original)
    const newErrors = {};

    // Item Name Validation - Enhanced
    if (!formData.name.trim()) {
      newErrors.name = "⚠️ Item name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "⚠️ Item name must be at least 2 characters long";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "⚠️ Item name cannot exceed 100 characters";
    } else if (!/^[a-zA-Z0-9\s\-&().,]+$/.test(formData.name.trim())) {
      newErrors.name = "⚠️ Item name can only contain letters, numbers, spaces, hyphens, ampersands, parentheses, periods, and commas";
    } else if (/^\d+$/.test(formData.name.trim())) {
      newErrors.name = "⚠️ Item name cannot be only numbers";
    } else if (formData.name.trim().split(' ').length < 1) {
      newErrors.name = "⚠️ Item name must contain at least one word";
    } else if (/^[\s\-&().,]+$/.test(formData.name.trim())) {
      newErrors.name = "⚠️ Item name cannot contain only special characters";
    }

    // Quantity Validation - Enhanced
    if (!formData.quantity || formData.quantity === "") {
      newErrors.quantity = "⚠️ Quantity is required";
    } else if (isNaN(formData.quantity) || formData.quantity <= 0) {
      newErrors.quantity = "⚠️ Quantity must be a positive number greater than zero";
    } else if (formData.quantity > 999999) {
      newErrors.quantity = "⚠️ Quantity cannot exceed 999,999 units";
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.quantity.toString())) {
      newErrors.quantity = "⚠️ Quantity can have at most 2 decimal places";
    } else if (parseFloat(formData.quantity) < 0.01) {
      newErrors.quantity = "⚠️ Quantity must be at least 0.01 units";
    }

    // Unit Validation - Enhanced
    if (!formData.unit) {
      newErrors.unit = "⚠️ Unit is required";
    } else if (!["kg", "liters", "pieces", "boxes", "bags"].includes(formData.unit)) {
      newErrors.unit = "⚠️ Please select a valid unit from the dropdown";
    }

    // Category Validation - Enhanced
    if (!formData.category) {
      newErrors.category = "⚠️ Category is required";
    } else if (!["harvest", "resource", "final product"].includes(formData.category)) {
      newErrors.category = "⚠️ Please select a valid category from the dropdown";
    }

    // Price Validation - Enhanced
    if (!formData.price || formData.price === "") {
      newErrors.price = "⚠️ Price is required";
    } else if (isNaN(formData.price) || formData.price <= 0) {
      newErrors.price = "⚠️ Price must be a positive number greater than zero";
    } else if (formData.price > 999999) {
      newErrors.price = "⚠️ Price cannot exceed $999,999";
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.price.toString())) {
      newErrors.price = "⚠️ Price can have at most 2 decimal places (cents)";
    } else if (parseFloat(formData.price) < 0.01) {
      newErrors.price = "⚠️ Price must be at least $0.01";
    } else if (parseFloat(formData.price) > 10000) {
      newErrors.price = "⚠️ Price seems unusually high. Please verify the amount";
    }

    // Supplier Validation - Enhanced
    if (formData.supplier && formData.supplier.trim().length > 0) {
      if (formData.supplier.trim().length < 2) {
        newErrors.supplier = "⚠️ Supplier name must be at least 2 characters long";
      } else if (formData.supplier.trim().length > 100) {
        newErrors.supplier = "⚠️ Supplier name cannot exceed 100 characters";
      } else if (!/^[a-zA-Z0-9\s\-&().,]+$/.test(formData.supplier.trim())) {
        newErrors.supplier = "⚠️ Supplier name contains invalid characters. Only letters, numbers, spaces, hyphens, ampersands, parentheses, periods, and commas are allowed";
      } else if (/^\d+$/.test(formData.supplier.trim())) {
        newErrors.supplier = "⚠️ Supplier name cannot be only numbers";
      } else if (/^[\s\-&().,]+$/.test(formData.supplier.trim())) {
        newErrors.supplier = "⚠️ Supplier name cannot contain only special characters";
      }
    }

    // Reorder Level Validation - Enhanced
    if (!formData.reorderLevel || formData.reorderLevel === "") {
      newErrors.reorderLevel = "⚠️ Reorder level is required";
    } else if (isNaN(formData.reorderLevel) || formData.reorderLevel < 0) {
      newErrors.reorderLevel = "⚠️ Reorder level cannot be negative";
    } else if (formData.reorderLevel > 999999) {
      newErrors.reorderLevel = "⚠️ Reorder level cannot exceed 999,999 units";
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.reorderLevel.toString())) {
      newErrors.reorderLevel = "⚠️ Reorder level can have at most 2 decimal places";
    } else if (formData.quantity && parseFloat(formData.reorderLevel) >= parseFloat(formData.quantity)) {
      newErrors.reorderLevel = "⚠️ Reorder level should be less than current quantity to trigger restocking alerts";
    } else if (parseFloat(formData.reorderLevel) === 0 && parseFloat(formData.quantity) > 0) {
      newErrors.reorderLevel = "⚠️ Setting reorder level to 0 means no restocking alerts. Consider setting a positive value";
    }

    // Date Validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    // Manufacture Date Validation
    if (!formData.manufactureDate) {
      newErrors.manufactureDate = "⚠️ Manufacture date is required";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.manufactureDate)) {
      newErrors.manufactureDate = "⚠️ Please enter a valid manufacture date";
    } else {
      const manufactureDate = new Date(formData.manufactureDate);
      manufactureDate.setHours(0, 0, 0, 0);

      if (manufactureDate < today) {
        newErrors.manufactureDate = "⚠️ Manufacture date cannot be in the past. Please select today or a future date";
      }

      // Check if manufacture date is not too far in the future (max 2 years)
      const maxManufactureDate = new Date();
      maxManufactureDate.setFullYear(maxManufactureDate.getFullYear() + 2);
      if (manufactureDate > maxManufactureDate) {
        newErrors.manufactureDate = "⚠️ Manufacture date cannot be more than 2 years from now";
      }
    }

    // Expire Date Validation
    if (!formData.expireDate) {
      newErrors.expireDate = "⚠️ Expire date is required";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.expireDate)) {
      newErrors.expireDate = "⚠️ Please enter a valid expire date";
    } else {
      const expireDate = new Date(formData.expireDate);
      expireDate.setHours(0, 0, 0, 0);

      if (expireDate < today) {
        newErrors.expireDate = "⚠️ Expire date cannot be in the past. Please select today or a future date";
      }

      // Check if expire date is not too far in the future (max 5 years)
      const maxExpireDate = new Date();
      maxExpireDate.setFullYear(maxExpireDate.getFullYear() + 5);
      if (expireDate > maxExpireDate) {
        newErrors.expireDate = "⚠️ Expire date cannot be more than 5 years from now";
      }
    }

    // Cross-validation between dates
    if (formData.manufactureDate && formData.expireDate && !newErrors.manufactureDate && !newErrors.expireDate) {
      const manufactureDate = new Date(formData.manufactureDate);
      const expireDate = new Date(formData.expireDate);
      manufactureDate.setHours(0, 0, 0, 0);
      expireDate.setHours(0, 0, 0, 0);

      // Expire date must be at least 1 day after manufacture date
      const minExpireDate = new Date(manufactureDate);
      minExpireDate.setDate(minExpireDate.getDate() + 1);

      if (expireDate < minExpireDate) {
        newErrors.expireDate = "⚠️ Expire date must be at least 1 day after manufacture date";
      }

      // Reasonable shelf life check (not more than 3 years between manufacture and expire)
      const maxShelfLife = new Date(manufactureDate);
      maxShelfLife.setFullYear(maxShelfLife.getFullYear() + 3);

      if (expireDate > maxShelfLife) {
        newErrors.expireDate = "⚠️ Expire date cannot be more than 3 years after manufacture date";
      }
    }

    // Description Validation - Enhanced
    if (formData.description && formData.description.trim().length > 0) {
      if (formData.description.trim().length > 500) {
        newErrors.description = "⚠️ Description cannot exceed 500 characters";
      } else if (formData.description.trim().length < 10) {
        newErrors.description = "⚠️ Description should be at least 10 characters for meaningful information";
      } else if (!/[a-zA-Z]/.test(formData.description.trim())) {
        newErrors.description = "⚠️ Description must contain at least one letter";
      } else if (/^\d+$/.test(formData.description.trim())) {
        newErrors.description = "⚠️ Description cannot be only numbers";
      } else if (formData.description.trim().split(' ').length < 3) {
        newErrors.description = "⚠️ Description should contain at least 3 words for proper documentation";
      }
    }

    // Business Logic Validations - Enhanced Cross-field Validations
    if (!newErrors.quantity && !newErrors.price && !newErrors.category) {
      // High-value item warnings
      const totalValue = parseFloat(formData.quantity) * parseFloat(formData.price);
      if (totalValue > 100000) {
        newErrors.submit = "⚠️ Warning: Total inventory value exceeds $100,000. Please verify the quantities and prices.";
      } else if (totalValue > 50000) {
        newErrors.submit = "⚠️ Note: Total inventory value exceeds $50,000. Consider reviewing quantities.";
      }

      // Category-specific validations
      if (formData.category === "harvest" && formData.unit !== "kg") {
        newErrors.unit = "⚠️ Harvest items are typically measured in kilograms (kg)";
      }

      if (formData.category === "final product" && parseFloat(formData.price) < 1) {
        newErrors.price = "⚠️ Final products typically have higher price points (at least $1.00)";
      }
    }

    // Duplicate Item Check (client-side approximation)
    if (!newErrors.name && selectedItem === null) {
      const existingItem = inventory.find(item =>
        item.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
      );
      if (existingItem) {
        newErrors.name = "⚠️ An item with this name already exists. Consider using a different name or editing the existing item.";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (selectedItem) {
        await putWithRetry(`/inventory/${selectedItem._id}`, formData);
      } else {
        await postWithRetry("/inventory", formData);
      }
      await fetchInventory();
      setModalOpen(false);
      setFormData({
        name: "",
        quantity: "",
        unit: "kg",
        category: "resource",
        price: "",
        description: "",
        supplier: "",
        reorderLevel: "",
        manufactureDate: "",
        expireDate: "",
      });
      setErrors({});
      setSuccessMessage(selectedItem ? 'Inventory item updated successfully!' : 'Inventory item added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("❌ Error saving inventory item:", err.response?.data || err.message);
      setErrors({ submit: err.response?.data?.error || "Failed to save inventory item" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReport = () => {
    generateReport(
      "Inventory Dashboard Report",
      ["Item Name", "Category", "Quantity", "Unit", "Price", "Status", "Supplier", "Manufacture Date", "Expire Date"],
      inventory.map((item) => [
        item.name,
        item.category,
        item.quantity,
        item.unit,
        `$${parseFloat(item.price || 0).toFixed(2)}`,
        item.status,
        item.supplier,
        item.manufactureDate ? new Date(item.manufactureDate).toLocaleDateString() : 'N/A',
        item.expireDate ? new Date(item.expireDate).toLocaleDateString() : 'N/A',
      ]),
      "InventoryDashboardReport.pdf"
    );
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inventory item?")) return;
    try {
      await deleteWithRetry(`/inventory/${id}`);
      await fetchInventory();
      setSuccessMessage('Inventory item deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("❌ Error deleting inventory item:", err);
      setErrors({ submit: 'Failed to delete inventory item. Please try again.' });
      setTimeout(() => setErrors({}), 3000);
    }
  };

  const handleAllocateToResponse = (item) => {
    setSelectedInventoryItem(item);
    setSelectedResponseForAllocation(null);
    setAllocationQuantity("");
    setAllocationErrors({});
    setIsAllocateToResponseModalOpen(true);
  };

  const handleSubmitAllocation = async () => {
    const newErrors = {};

    // Response selection validation
    if (!selectedResponseForAllocation) {
      newErrors.response = "⚠️ Please select a consultation response";
    }

    // Quantity validation
    if (!allocationQuantity || allocationQuantity === "") {
      newErrors.quantity = "⚠️ Quantity is required";
    } else if (isNaN(allocationQuantity) || allocationQuantity <= 0) {
      newErrors.quantity = "⚠️ Quantity must be a positive number";
    } else if (parseFloat(allocationQuantity) > parseFloat(selectedInventoryItem.quantity)) {
      newErrors.quantity = `⚠️ Cannot allocate more than available quantity (${selectedInventoryItem.quantity} ${selectedInventoryItem.unit})`;
    }

    setAllocationErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmittingAllocation(true);
    try {
      // Decrease quantity in global inventory
      const updatedQuantity = parseFloat(selectedInventoryItem.quantity) - parseFloat(allocationQuantity);

      const updateData = {
        ...selectedInventoryItem,
        quantity: updatedQuantity,
      };

      await putWithRetry(`/inventory/${selectedInventoryItem._id}`, updateData);

      // Add item to response inventory (simulate by updating consultation inventory items)
      // In a real implementation, this would be stored in a separate allocation table
      // For now, we'll just show success message
      await fetchInventory();

      // Save allocation to persistent state
      const allocatedItem = {
        _id: Date.now().toString(),
        name: selectedInventoryItem.name,
        quantity: allocationQuantity,
        unit: selectedInventoryItem.unit,
        category: selectedInventoryItem.category,
        supplier: selectedInventoryItem.supplier,
        reorderLevel: selectedInventoryItem.reorderLevel,
        description: selectedInventoryItem.description
      };

      setAllocatedInventory(prev => ({
        ...prev,
        [selectedResponseForAllocation._id]: [
          ...(prev[selectedResponseForAllocation._id] || []),
          allocatedItem
        ]
      }));

      setIsAllocateToResponseModalOpen(false);
      setSelectedInventoryItem(null);
      setSelectedResponseForAllocation(null);
      setAllocationQuantity("");
      setAllocationErrors({});
      setSuccessMessage(`Allocated ${allocationQuantity} ${selectedInventoryItem.unit} of "${selectedInventoryItem.name}" to response ${selectedResponseForAllocation.responseId}. Remaining: ${updatedQuantity} ${selectedInventoryItem.unit}`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error("❌ Error allocating inventory item:", err);
      setAllocationErrors({ submit: "Failed to allocate inventory item" });
    } finally {
      setIsSubmittingAllocation(false);
    }
  };

  const handleEditAllocation = (responseId, allocationItem) => {
    setEditingAllocation({ responseId, allocationItem });
    setEditAllocationQuantity(allocationItem.quantity);
    setEditAllocationErrors({});
    setIsEditAllocationModalOpen(true);
  };

  const handleSubmitEditAllocation = async () => {
    const newErrors = {};

    // Quantity validation
    if (!editAllocationQuantity || editAllocationQuantity === "") {
      newErrors.quantity = "⚠️ Quantity is required";
    } else if (isNaN(editAllocationQuantity) || editAllocationQuantity <= 0) {
      newErrors.quantity = "⚠️ Quantity must be a positive number";
    }

    setEditAllocationErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmittingEditAllocation(true);
    try {
      const { responseId, allocationItem } = editingAllocation;
      const quantityDifference = parseFloat(editAllocationQuantity) - parseFloat(allocationItem.quantity);

      if (quantityDifference !== 0) {
        // Find the item in global inventory
        const globalItem = inventory.find(item =>
          item.name.toLowerCase().trim() === allocationItem.name.toLowerCase().trim()
        );

        if (globalItem) {
          let updatedQuantity;

          if (quantityDifference > 0) {
            // Increasing allocation - check if enough quantity available
            updatedQuantity = parseFloat(globalItem.quantity) - quantityDifference;
            if (updatedQuantity < 0) {
              setEditAllocationErrors({ submit: `Cannot increase allocation. Only ${globalItem.quantity} ${globalItem.unit} available.` });
              setIsSubmittingEditAllocation(false);
              return;
            }
          } else {
            // Decreasing allocation - return quantity to inventory
            updatedQuantity = parseFloat(globalItem.quantity) + Math.abs(quantityDifference);
          }

          // Update global inventory
          const updateData = {
            ...globalItem,
            quantity: updatedQuantity,
          };

          await putWithRetry(`/inventory/${globalItem._id}`, updateData);
          await fetchInventory();
        }
      }

      // Update allocation in state
      const updatedAllocation = { ...allocationItem, quantity: editAllocationQuantity };
      setAllocatedInventory(prev => ({
        ...prev,
        [responseId]: (prev[responseId] || []).map(item =>
          item._id === allocationItem._id ? updatedAllocation : item
        )
      }));

      setIsEditAllocationModalOpen(false);
      setEditingAllocation(null);
      setEditAllocationQuantity("");
      setEditAllocationErrors({});
      setSuccessMessage(`Updated allocation for "${allocationItem.name}" to ${editAllocationQuantity} ${allocationItem.unit}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("❌ Error updating allocation:", err);
      setEditAllocationErrors({ submit: "Failed to update allocation" });
    } finally {
      setIsSubmittingEditAllocation(false);
    }
  };

  const handleDeleteAllocation = async (responseId, allocationItem) => {
    if (!window.confirm(`Are you sure you want to remove "${allocationItem.name}" from this response? This will return the quantity to inventory.`)) return;

    try {
      // Find the item in global inventory and increase quantity
      const globalItem = inventory.find(item =>
        item.name.toLowerCase().trim() === allocationItem.name.toLowerCase().trim()
      );

      if (globalItem) {
        // Increase quantity in global inventory
        const updatedQuantity = parseFloat(globalItem.quantity) + parseFloat(allocationItem.quantity);

        const updateData = {
          ...globalItem,
          quantity: updatedQuantity,
        };

        await putWithRetry(`/inventory/${globalItem._id}`, updateData);
        await fetchInventory();
      }

      // Remove allocation from state
      setAllocatedInventory(prev => ({
        ...prev,
        [responseId]: (prev[responseId] || []).filter(item => item._id !== allocationItem._id)
      }));

      setSuccessMessage(`Removed "${allocationItem.name}" from response. Quantity returned to inventory.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error("❌ Error deleting allocation:", err);
      setErrors({ submit: 'Failed to remove allocation' });
      setTimeout(() => setErrors({}), 3000);
    }
  };

  const handleProcessToInventory = async (batch) => {
    if (!window.confirm(`Are you sure you want to process harvest batch "${batch.harvestId}" to inventory? This will add ${batch.weightKg}kg of cinnamon to inventory.`)) return;

    try {
      await postWithRetry(`/batches/${batch._id}/process-to-inventory`);
      await fetchHarvestBatches();
      await fetchInventory();
      setSuccessMessage(`Harvest batch "${batch.harvestId}" processed to inventory successfully.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error("❌ Error processing batch to inventory:", err);
      setErrors({ submit: 'Failed to process batch to inventory' });
      setTimeout(() => setErrors({}), 3000);
    }
  };

  const handleViewBatch = (batch) => {
    setSelectedBatch(batch);
    setIsBatchDetailsModalOpen(true);
  };

  // Real-time validation helper function
  const getFieldValidationStatus = (fieldName, value) => {
    if (!value || value === '') return 'empty';

    switch (fieldName) {
      case 'name':
        if (value.trim().length < 2) return 'invalid';
        if (value.trim().length > 100) return 'invalid';
        if (!/^[a-zA-Z0-9\s\-&().,]+$/.test(value.trim())) return 'invalid';
        if (/^\d+$/.test(value.trim())) return 'invalid';
        if (value.trim().split(' ').length < 1) return 'invalid';
        if (/^[\s\-&().,]+$/.test(value.trim())) return 'invalid';
        return 'valid';

      case 'quantity':
        if (isNaN(value) || value <= 0) return 'invalid';
        if (value > 999999) return 'invalid';
        if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) return 'invalid';
        if (parseFloat(value) < 0.01) return 'invalid';
        return 'valid';

      case 'price':
        if (isNaN(value) || value <= 0) return 'invalid';
        if (value > 999999) return 'invalid';
        if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) return 'invalid';
        if (parseFloat(value) < 0.01) return 'invalid';
        if (parseFloat(value) > 10000) return 'warning';
        return 'valid';

      case 'reorderLevel':
        if (isNaN(value) || value < 0) return 'invalid';
        if (value > 999999) return 'invalid';
        if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) return 'invalid';
        return 'valid';

      default:
        return 'empty';
    }
  };

  // Input filtering functions
  const handleItemNameInput = (e) => {
    // Allow: letters, spaces, hyphens, ampersands, parentheses, periods, commas
    const allowedChars = /^[a-zA-Z\s\-&().,]*$/;
    if (!allowedChars.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
      e.preventDefault();
    }
  };

  const handleNumericInput = (e) => {
    // Allow: numbers, decimal point, backspace, delete, tab, enter, arrows
    const allowedChars = /^[0-9.]*$/;
    if (!allowedChars.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
      e.preventDefault();
    }
    // Prevent multiple decimal points
    if (e.key === '.' && e.target.value.includes('.')) {
      e.preventDefault();
    }
  };

  const handleSupplierInput = (e) => {
    // Allow: letters, spaces, hyphens, ampersands, parentheses, periods, commas
    const allowedChars = /^[a-zA-Z\s\-&().,]*$/;
    if (!allowedChars.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader currentUserRole={currentUserRole} handleLogout={handleLogout} />

        <SuccessMessage message={successMessage} />

        <SearchControls
          search={search}
          setSearch={setSearch}
          handleAddItem={handleAddItem}
          handleReport={handleReport}
        />

        <InventoryGrid
          filteredInventory={filteredInventory}
          getStatusColor={getStatusColor}
          getCategoryColor={getCategoryColor}
          handleEditItem={handleEditItem}
          handleDeleteItem={handleDeleteItem}
          handleAllocateToResponse={handleAllocateToResponse}
        />

        <ConsultationsTable
          responses={responses}
          allocatedInventory={allocatedInventory}
          getIssueTypeColor={getIssueTypeColor}
          handleEditAllocation={handleEditAllocation}
          handleDeleteAllocation={handleDeleteAllocation}
        />

        <HarvestBatchesTable
          harvestBatches={harvestBatches}
          handleProcessToInventory={handleProcessToInventory}
          handleViewBatch={handleViewBatch}
        />

        <AddEditInventoryModal
          isModalOpen={isModalOpen}
          setModalOpen={setModalOpen}
          selectedItem={selectedItem}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          isSubmitting={isSubmitting}
          handleSaveItem={handleSaveItem}
          getFieldValidationStatus={getFieldValidationStatus}
          handleItemNameInput={handleItemNameInput}
          handleNumericInput={handleNumericInput}
          handleSupplierInput={handleSupplierInput}
        />

        {/* Other modals would go here - keeping the original ones for now */}
        {/* Allocate to Response Modal */}
        {isAllocateToResponseModalOpen && selectedInventoryItem && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-purple-100 transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
                  <FaBox className="text-purple-600 text-lg sm:text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    Allocate Inventory to Response
                  </h2>
                  <p className="text-gray-600 text-sm">Allocate "{selectedInventoryItem.name}" to a consultation response</p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Inventory Item Details */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-orange-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaBox className="text-purple-600 text-sm flex-shrink-0" />
                    <p className="text-sm font-medium text-purple-800">Inventory Item Details</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <span className="ml-2 text-gray-900">{selectedInventoryItem.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Available:</span>
                      <span className="ml-2 text-gray-900">{selectedInventoryItem.quantity} {selectedInventoryItem.unit}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="ml-2 text-gray-900">{selectedInventoryItem.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Supplier:</span>
                      <span className="ml-2 text-gray-900">{selectedInventoryItem.supplier || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Response Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Consultation Response *
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base"
                    value={selectedResponseForAllocation?.responseId || ''}
                    onChange={(e) => {
                      const selectedResponse = responses.find(r => r.responseId === e.target.value);
                      setSelectedResponseForAllocation(selectedResponse);
                    }}
                  >
                    <option value="">Choose a consultation response...</option>
                    {responses.map((response) => (
                      <option key={response._id} value={response.responseId}>
                        {response.responseId} - {response.issueId?.issueType || 'Unknown'} ({response.issueId?.plotid || 'N/A'})
                      </option>
                    ))}
                  </select>
                  {allocationErrors.response && (
                    <p className="text-red-600 text-sm mt-1">{allocationErrors.response}</p>
                  )}
                </div>

                {/* Selected Response Details */}
                {selectedResponseForAllocation && (
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaReply className="text-orange-600 text-sm flex-shrink-0" />
                      <p className="text-sm font-medium text-orange-800">Selected Response Details</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Response ID:</span> {selectedResponseForAllocation.responseId}</p>
                      <p><span className="font-medium">Issue:</span> {selectedResponseForAllocation.issueId?.plantIssueid || 'N/A'} - {selectedResponseForAllocation.issueId?.issueType || 'Unknown'}</p>
                      <p><span className="font-medium">Plot:</span> {selectedResponseForAllocation.issueId?.plotid || 'N/A'}</p>
                      <p><span className="font-medium">Expert:</span> {selectedResponseForAllocation.respondedBy?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        <span className="font-medium">Response:</span> {selectedResponseForAllocation.responseText}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quantity Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity to Allocate *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={selectedInventoryItem.quantity}
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base pr-16"
                      placeholder="Enter quantity"
                      value={allocationQuantity}
                      onChange={(e) => setAllocationQuantity(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      {selectedInventoryItem.unit}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      Available: {selectedInventoryItem.quantity} {selectedInventoryItem.unit}
                    </div>
                    {allocationQuantity && (
                      <div className="text-xs text-purple-600">
                        Remaining: {Math.max(0, parseFloat(selectedInventoryItem.quantity) - parseFloat(allocationQuantity || 0))} {selectedInventoryItem.unit}
                      </div>
                    )}
                  </div>
                  {allocationErrors.quantity && (
                    <p className="text-red-600 text-sm mt-1">{allocationErrors.quantity}</p>
                  )}
                </div>
              </div>

              {allocationErrors.submit && (
                <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FaTimes className="text-red-600 text-sm flex-shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{allocationErrors.submit}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
                <button
                  onClick={() => {
                    setIsAllocateToResponseModalOpen(false);
                    setSelectedInventoryItem(null);
                    setSelectedResponseForAllocation(null);
                    setAllocationQuantity("");
                    setAllocationErrors({});
                  }}
                  disabled={isSubmittingAllocation}
                  className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAllocation}
                  disabled={isSubmittingAllocation || !selectedResponseForAllocation || !allocationQuantity}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-500 to-orange-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isSubmittingAllocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Allocating...
                    </>
                  ) : (
                    <>
                      <FaBox className="text-sm" />
                      Allocate Item
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Allocation Modal */}
        {isEditAllocationModalOpen && editingAllocation && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-orange-100 transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-orange-100 rounded-full flex-shrink-0">
                  <FaEdit className="text-orange-600 text-lg sm:text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    Edit Allocation
                  </h2>
                  <p className="text-gray-600 text-sm">Update quantity for "{editingAllocation.allocationItem.name}"</p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Allocation Item Details */}
                <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaBox className="text-orange-600 text-sm flex-shrink-0" />
                    <p className="text-sm font-medium text-orange-800">Allocation Details</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Item:</span>
                      <span className="ml-2 text-gray-900">{editingAllocation.allocationItem.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Current Quantity:</span>
                      <span className="ml-2 text-gray-900">{editingAllocation.allocationItem.quantity} {editingAllocation.allocationItem.unit}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="ml-2 text-gray-900">{editingAllocation.allocationItem.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Supplier:</span>
                      <span className="ml-2 text-gray-900">{editingAllocation.allocationItem.supplier || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Quantity *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm transition-all duration-200 text-sm sm:text-base pr-16"
                      placeholder="Enter new quantity"
                      value={editAllocationQuantity}
                      onChange={(e) => setEditAllocationQuantity(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      {editingAllocation.allocationItem.unit}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      Current: {editingAllocation.allocationItem.quantity} {editingAllocation.allocationItem.unit}
                    </div>
                    {editAllocationQuantity && parseFloat(editAllocationQuantity) !== parseFloat(editingAllocation.allocationItem.quantity) && (
                      <div className={`text-xs ${parseFloat(editAllocationQuantity) > parseFloat(editingAllocation.allocationItem.quantity) ? 'text-red-600' : 'text-orange-600'}`}>
                        {parseFloat(editAllocationQuantity) > parseFloat(editingAllocation.allocationItem.quantity) ? 'Increasing' : 'Decreasing'} by {Math.abs(parseFloat(editAllocationQuantity) - parseFloat(editingAllocation.allocationItem.quantity))} {editingAllocation.allocationItem.unit}
                      </div>
                    )}
                  </div>
                  {editAllocationErrors.quantity && (
                    <p className="text-red-600 text-sm mt-1">{editAllocationErrors.quantity}</p>
                  )}
                </div>
              </div>

              {editAllocationErrors.submit && (
                <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FaTimes className="text-red-600 text-sm flex-shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{editAllocationErrors.submit}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
                <button
                  onClick={() => {
                    setIsEditAllocationModalOpen(false);
                    setEditingAllocation(null);
                    setEditAllocationQuantity("");
                    setEditAllocationErrors({});
                  }}
                  disabled={isSubmittingEditAllocation}
                  className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEditAllocation}
                  disabled={isSubmittingEditAllocation || !editAllocationQuantity}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isSubmittingEditAllocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaSave className="text-sm" />
                      Update Allocation
                    </>
                  )}
                </button>
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
                  <FaBox className="text-orange-600 text-lg sm:text-xl" />
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
                    <FaBox className="text-orange-600 text-sm flex-shrink-0" />
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
                        selectedBatch.status === 'processed' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedBatch.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Processing Information */}
                {selectedBatch.status === 'processed' && (
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-orange-50 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <FaBox className="text-orange-600 text-sm flex-shrink-0" />
                      <p className="text-sm font-medium text-orange-800">Processing Information</p>
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
                      <FaTimes className="text-yellow-600 text-sm flex-shrink-0" />
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
      </div>
    </div>
  );
};

export default InventoryDashboard;
