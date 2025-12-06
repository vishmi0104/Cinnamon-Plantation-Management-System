const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const farmerRoutes = require("./Routes/PlantationMonitoringReporting/farmerAssignmentRoutes");
const batchRoutes = require("./Routes/PlantationMonitoringReporting/harvestBatchRoutes");
const plotRoutes = require("./Routes/PlantationMonitoringReporting/landPlotRoutes");
const issueRoutes = require("./Routes/PlantationMonitoringReporting/plantationHealthIssueRoutes");
const fertilizeRoutes = require("./Routes/PlantationMonitoringReporting/fertilizeDistributionRoutes");
const responseRoutes = require("./Routes/PlantationMonitoringReporting/responseRoutes");
const inventoryRoutes = require("./Routes/PlantationMonitoringReporting/inventoryRoutes");
const consultationRoutes = require("./Routes/PlantationMonitoringReporting/consultationRoutes");
const financeRoutes = require("./Routes/PlantationMonitoringReporting/financeRoutes");
const orderRoutes = require("./Routes/PlantationMonitoringReporting/orderRoutes");
const paymentRoutes = require("./Routes/PlantationMonitoringReporting/paymentRoutes");
const authRoutes = require("./Routes/authRoutes");
const deliveryIssueRoutes = require("./Routes/PlantationMonitoringReporting/deliveryIssueRoutes");
const deliveryResponseRoutes = require("./Routes/PlantationMonitoringReporting/deliveryResponseRoutes");
const seedUsers = require("./seedUsers");

const app = express();

// ✅ Enable CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use("/uploads", express.static("uploads")); // serve uploaded images

// ✅ Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ✅ Mount routes
app.use("/api/assignments", farmerRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/plots", plotRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/fertilizes", fertilizeRoutes); // 👈 PLURAL to match frontend
app.use("/api/responses", responseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/delivery-issues", deliveryIssueRoutes);
app.use("/api/delivery-responses", deliveryResponseRoutes);

app.get("/", (_req, res) => res.send("🌱 Plantation API is running!"));

// ✅ Start server only after Mongo connects
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: process.env.DB_NAME || undefined,
  })
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await seedUsers();
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ DB Error:", err.message));
