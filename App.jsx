// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";

// Import features via barrel file
import {
  Home,
  Plots,
  Assignments,
  Batches,
  Issues,
  Fertilizes,
  SupportDashboard,
  ConsultationDashboard,
  InventoryDashboard,
  FactoryManagerDashboard,
  UserShop,
  FinanceManagerDashboard,
  PaymentManagement,
  Payment,
  UserOrders,
  InventoryManagement,
} from "./features/PlantationMonitoringReporting";

// Import Login
import Login from "./features/Auth/Login.jsx";
import Registration from "./features/Auth/Registration.jsx";

// Import Header
import Header from "./components/Header.jsx";

// ✅ Layout wrapper (controls Header + Tabs)
function Layout({ children, role }) {
  const location = useLocation();

  // Hide Header on login page and for consultation managers
  const isLoginPage = location.pathname === "/";

  // Tabs only for plantation manager
  const plantationTabs = [
    { path: "/overview", label: "Overview", element: <Home /> },
    { path: "/plots", label: "Land Plots", element: <Plots /> },
    { path: "/assignments", label: "Farmer Assignments", element: <Assignments /> },
    { path: "/fertilizes", label: "Fertilize Distribution", element: <Fertilizes /> },
    { path: "/batches", label: "Harvest Batches", element: <Batches /> },
    { path: "/issues", label: "Health Issues", element: <Issues /> },
  ];

  // Tabs for consultation manager
  const consultationTabs = [
    { path: "/consultation-dashboard", label: "Consultations", element: <ConsultationDashboard /> },
  ];

  // Tabs for inventory manager
  const inventoryTabs = [
    { path: "/inventory-dashboard", label: "Inventory", element: <InventoryDashboard /> },
    { path: "/inventory-management", label: "Manage Items", element: <InventoryManagement /> },
  ];

  // Tabs for factory manager
  const factoryTabs = [
    { path: "/factory-dashboard", label: "Factory", element: <FactoryManagerDashboard /> },
  ];

  // Tabs for finance manager
  const financeTabs = [
    { path: "/finance", label: "Finance Dashboard", element: <FinanceManagerDashboard /> },
  ];

  // Consultation manager only has one dashboard - no tabs needed

  return (
    <div className="flex flex-col min-h-screen">
      {/* Show Header only for plantation manager */}
      {!isLoginPage && role === "plantation" && <Header role={role} />}
      <main className="flex-grow max-w-6xl mx-auto p-4">
        {/* ✅ Show tabs only for plantation manager, consultation manager, inventory manager, factory manager, and finance manager */}
        {!isLoginPage && (role === "plantation" || role === "consultation" || role === "inventory" || role === "factory" || role === "finance") && (
          <nav className="flex gap-2 bg-slate-100 rounded-xl p-2 mb-6">
            {role === "plantation" && plantationTabs.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                end={t.path === "/overview"}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg ${
                    isActive
                      ? "bg-white shadow border font-medium"
                      : "hover:bg-white"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
            {role === "consultation" && consultationTabs.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                end={false}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg ${
                    isActive
                      ? "bg-white shadow border font-medium"
                      : "hover:bg-white"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
            {role === "inventory" && inventoryTabs.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                end={false}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg ${
                    isActive
                      ? "bg-white shadow border font-medium"
                      : "hover:bg-white"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
            {role === "factory" && factoryTabs.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                end={false}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg ${
                    isActive
                      ? "bg-white shadow border font-medium"
                      : "hover:bg-white"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
            {role === "finance" && financeTabs.map((t) => (
              <NavLink
                key={t.path}
                to={t.path}
                end={false}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg ${
                    isActive
                      ? "bg-white shadow border font-medium"
                      : "hover:bg-white"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        )}

        {/* ✅ Hide tabs for support manager - they only have one dashboard */}
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(null);

  // Restore role from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(savedRole);
  }, []);

  return (
    <Router>
      <Routes>
        {/* ✅ Login page → no header */}
        <Route path="/" element={<Login setRole={setRole} />} />
        <Route path="/register" element={<Registration />} />

        {/* ✅ Wrap all other pages inside Layout */}
        <Route
          path="/*"
          element={
            <Layout role={role}>
              <Routes>
                {/* Role dashboards */}
                <Route path="/plantation" element={<Home />} />
                <Route path="/support" element={<SupportDashboard />} />
                <Route path="/consultation" element={<ConsultationDashboard />} />
                <Route path="/inventory" element={<InventoryDashboard />} />
                <Route path="/factory" element={<FactoryManagerDashboard />} />
                <Route path="/user" element={<UserShop />} />
                <Route path="/user/orders" element={<UserOrders />} />
                <Route path="/user/payments" element={<PaymentManagement />} />
                <Route path="/user/payment" element={<Payment />} />

                {/* Plantation Manager's features */}
                {role === "plantation" && (
                  <>
                    <Route path="/overview" element={<Home />} />
                    <Route path="/plots" element={<Plots />} />
                    <Route path="/assignments" element={<Assignments />} />
                    <Route path="/fertilizes" element={<Fertilizes />} />
                    <Route path="/batches" element={<Batches />} />
                    <Route path="/issues" element={<Issues />} />
                  </>
                )}

                {/* Support Manager's features */}
                {role === "support" && (
                  <>
                    <Route path="/support-dashboard" element={<SupportDashboard />} />
                    <Route path="/consultation-dashboard" element={<ConsultationDashboard />} />
                    <Route path="/inventory-dashboard" element={<InventoryDashboard />} />
                  </>
                )}

                {/* Consultation Manager's features */}
                {role === "consultation" && (
                  <>
                    <Route path="/consultation-dashboard" element={<ConsultationDashboard />} />
                  </>
                )}

                {/* Inventory Manager's features */}
                {role === "inventory" && (
                  <>
                    <Route path="/inventory-dashboard" element={<InventoryDashboard />} />
                    <Route path="/inventory-management" element={<InventoryManagement />} />
                  </>
                )}

                {/* Factory Manager's features */}
                {role === "factory" && (
                  <>
                    <Route path="/factory-dashboard" element={<FactoryManagerDashboard />} />
                  </>
                )}

                {/* Finance Manager's features */}
                {role === "finance" && (
                  <>
                    <Route path="/finance" element={<FinanceManagerDashboard />} />
                  </>
                )}
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}