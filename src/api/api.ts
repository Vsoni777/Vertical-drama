import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
console.log("API URL:", apiUrl);

const api = axios.create({
  baseURL: apiUrl,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
