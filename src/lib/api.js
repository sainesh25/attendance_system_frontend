import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./auth";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((e) => Promise.reject(e));
    }

    originalRequest._retry = true;
    isRefreshing = true;
    const refresh = getRefreshToken();

    if (!refresh) {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(err);
    }

    try {
      const { data } = await axios.post(`${baseURL}/api/auth/refresh/`, {
        refresh,
      });
      const { access } = data;
      setTokens(access, refresh);
      processQueue(null, access);
      originalRequest.headers.Authorization = `Bearer ${access}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// Auth
export async function login(credentials) {
  const { data } = await axios.post(`${baseURL}/api/auth/login/`, credentials);
  return data;
}

export async function refreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");
  const { data } = await axios.post(`${baseURL}/api/auth/refresh/`, {
    refresh,
  });
  return data;
}

// Profile
export async function getMe() {
  const { data } = await api.get("/api/profile/");
  return data;
}

// Users list (Admin)
export async function getProfile() {
  const { data } = await api.get("/api/profile/");
  return data;
}

// Teachers
export async function registerTeacher(body) {
  const { data } = await api.post("/api/register-teacher/", body);
  return data;
}

// Classes
export async function getClasses() {
  const { data } = await api.get("/api/classes/");
  return data;
}

export async function getClass(id) {
  const { data } = await api.get(`/api/classes/${id}/`);
  return data;
}

export async function createClass(body) {
  const { data } = await api.post("/api/classes/create/", body);
  return data;
}

export async function updateClass(id, body) {
  const { data } = await api.put(`/api/classes/${id}/update/`, body);
  return data;
}

export async function deleteClass(id) {
  const { data } = await api.delete(`/api/classes/${id}/delete/`);
  return data;
}

// Students
export async function getStudents() {
  const { data } = await api.get("/api/students/");
  return data;
}

export async function getStudent(id) {
  const { data } = await api.get(`/api/students/${id}/`);
  return data;
}

export async function createStudent(body) {
  const { data } = await api.post("/api/students/create/", body);
  return data;
}

export async function updateStudent(id, body) {
  const { data } = await api.put(`/api/students/${id}/update/`, body);
  return data;
}

export async function deleteStudent(id) {
  const { data } = await api.delete(`/api/students/${id}/delete/`);
  return data;
}

export default api;
