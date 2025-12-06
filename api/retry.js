// src/api/retry.js
import http from "./http";

// Generic retry wrapper
async function retryRequest(method, url, data = null, retries = 3, config = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (method === "get") return await http.get(url, config);
      if (method === "post") return await http.post(url, data, config);
      if (method === "put") return await http.put(url, data, config);
      if (method === "delete") return await http.delete(url, config);

      throw new Error(`Unsupported method: ${method}`);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`Retrying ${method.toUpperCase()} ${url} (attempt ${attempt})...`);
      await new Promise((res) => setTimeout(res, 500 * attempt)); // exponential backoff
    }
  }
}

// ✅ Export helpers
export const getWithRetry = (url, retries = 3, config = {}) =>
  retryRequest("get", url, null, retries, config);

export const postWithRetry = (url, data, retries = 3, config = {}) =>
  retryRequest("post", url, data, retries, config);

export const putWithRetry = (url, data, retries = 3, config = {}) =>
  retryRequest("put", url, data, retries, config);

export const deleteWithRetry = (url, retries = 3, config = {}) =>
  retryRequest("delete", url, null, retries, config);
