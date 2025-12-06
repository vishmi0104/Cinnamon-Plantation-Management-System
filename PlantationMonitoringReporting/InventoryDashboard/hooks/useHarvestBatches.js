import { useState, useEffect } from "react";
import { getWithRetry } from "../../../../api/retry";

export const useHarvestBatches = () => {
  const [harvestBatches, setHarvestBatches] = useState([]);
  const [isLoadingHarvestBatches, setIsLoadingHarvestBatches] = useState(false);

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

  useEffect(() => {
    fetchHarvestBatches();
  }, []);

  return {
    harvestBatches,
    setHarvestBatches,
    isLoadingHarvestBatches,
    fetchHarvestBatches,
  };
};