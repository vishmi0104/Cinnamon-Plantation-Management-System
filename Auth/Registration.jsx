import React, { useState } from "react";
import http from "../../api/http";
import { useNavigate } from "react-router-dom";
import wallpaper from "../../assets/wallpaper_login.png"; // ✅ import background

export default function Registration() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("plantation");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const uname = username.trim();
    const pwd = password.trim();
    const confPwd = confirmPassword.trim();

    if (!uname || !pwd || !confPwd) {
      setError("Please fill in all fields");
      return;
    }

    if (pwd !== confPwd) {
      setError("Passwords do not match");
      return;
    }

    if (pwd.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      await http.post("/auth/register", {
        username: uname,
        password: pwd,
        role: selectedRole,
      });

      setSuccess("Registration successful! You can now log in.");
      setTimeout(() => navigate("/"), 2000); // Redirect to login after 2 seconds
    } catch (err) {
      const serverMsg = err.response?.data?.msg;
      setError(serverMsg || "Registration failed");
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
        onSubmit={handleRegister}
        className="bg-amber-100 shadow-lg rounded-lg p-8 w-96" // ✅ light brown box
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Manager Registration</h2>

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
          autoComplete="new-password"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="border p-2 mb-3 w-full rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
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
        {success && <p className="text-green-500 text-sm mb-3">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-amber-800 disabled:opacity-60 text-white px-4 py-2 w-full rounded hover:bg-amber-900 mb-3" // ✅ dark brown button
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-amber-800 underline text-sm w-full"
        >
          Already have an account? Login
        </button>
      </form>
    </div>
  );
}