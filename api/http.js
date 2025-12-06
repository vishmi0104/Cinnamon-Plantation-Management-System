import axios from "axios";

const http = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
  },
});

// 🔎 Debug: see every request/response in the browser console
http.interceptors.request.use((config) => {
  const method = (config.method || "get").toUpperCase();
  console.log("➡️", method, `${config.baseURL}${config.url}`);

  // Add token if available
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
http.interceptors.response.use(
  (res) => {
    console.log("✅", res.status, res.config.url);
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.msg || err.response?.data?.error || err.message;
    console.error("❌", status, err.config?.url, msg);

    if (status === 401) {
      // Invalid/expired token: clear and redirect to login
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      } catch {}
      // Avoid infinite loops if already on login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/";
      }
    }

    return Promise.reject(err);
  }
);

export default http;
