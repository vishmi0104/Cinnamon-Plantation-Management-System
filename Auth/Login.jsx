import React, { useState } from "react";
import http from "../../api/http";
import { useNavigate } from "react-router-dom";
import wallpaper from "../../assets/wallpaper_login.png"; // ✅ import background

export default function Login({ setRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("plantation");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const uname = username.trim();
    const pwd = password.trim();
    if (!uname || !pwd) {
      setError("Please enter username and password");
      return;
    }

    try {
      setLoading(true);
      const { data } = await http.post("/auth/login", {
        username: uname,
        password: pwd,
      });

      const role = data.role;
      const token = data.token;

      if (role !== selectedRole) {
        setError(`Selected role (${selectedRole}) does not match account role (${role}).`);
        setLoading(false);
        return;
      }

      localStorage.setItem("role", role);
      localStorage.setItem("token", token);
      if (typeof setRole === "function") setRole(role);

      const routes = {
        plantation: "/plantation",
        factory: "/factory",
        inventory: "/inventory",
        finance: "/finance",
        support: "/support",
        consultation: "/consultation",
        user: "/user",
      };
      navigate(routes[role] || "/");
    } catch (err) {
      const serverMsg = err.response?.data?.msg;
      setError(serverMsg || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${wallpaper})` }} // ✅ background image
    >
      <form
        onSubmit={handleLogin}
        className="bg-amber-100 shadow-lg rounded-lg p-8 w-96" // ✅ light brown box
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Manager Login</h2>

        <input
          type="text"
          placeholder="Username"
          className="border p-2 mb-3 w-full rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 mb-3 w-full rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <select
          className="border p-2 mb-4 w-full rounded"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="plantation">Plantation Manager</option>
          <option value="factory">Factory Manager</option>
          <option value="inventory">Inventory Manager</option>
          <option value="finance">Finance Manager</option>
          <option value="support">Support Manager</option>
          <option value="consultation">Consultation Manager</option>
          <option value="user">User</option>
        </select>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-amber-800 disabled:opacity-60 text-white px-4 py-2 w-full rounded hover:bg-amber-900" // ✅ dark brown button
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="text-amber-800 underline text-sm w-full mt-3"
        >
          Don't have an account? Register
        </button>
      </form>
    </div>
  );
}
