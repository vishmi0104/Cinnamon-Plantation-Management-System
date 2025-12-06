import { useState, useEffect } from "react";
import { getWithRetry } from "../../../../api/retry";

export const useInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");

  const fetchInventory = async () => {
    try {
      const res = await getWithRetry("/inventory", 3);
      setInventory(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch inventory:", err.message);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    return status === "Available" ? "bg-orange-100 text-orange-800" :
           status === "Low Stock" ? "bg-yellow-100 text-yellow-800" :
           "bg-red-100 text-red-800";
  };

  const getCategoryColor = (category) => {
    const colors = {
      harvest: "bg-orange-100 text-orange-800",
      resource: "bg-orange-100 text-orange-800",
      "final product": "bg-purple-100 text-purple-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return {
    inventory,
    setInventory,
    search,
    setSearch,
    filteredInventory,
    fetchInventory,
    getStatusColor,
    getCategoryColor,
  };
};