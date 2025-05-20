// script/auth.js
import { setAuthToken } from "./axiosConfig.js";

const apiUserUrl =
  "https://backend-nopal-505940949397.us-central1.run.app/api/users";

// DOM elements
const loginEmail = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const registerEmail = document.getElementById("registerUsername");
const registerPassword = document.getElementById("registerPassword");
const registerBtn = document.getElementById("registerBtn");
const cancelRegisterBtn = document.getElementById("cancelRegisterBtn");
const authContainer = document.getElementById("authContainer");
const notesApp = document.getElementById("notesApp");
const logoutBtn = document.getElementById("logoutBtn");

function showNotesApp() {
  authContainer.classList.add("hidden");
  notesApp.classList.remove("hidden");
}

function showAuth() {
  authContainer.classList.remove("hidden");
  notesApp.classList.add("hidden");
  clearAuthForms();
}

function clearAuthForms() {
  // Reset semua input & tampilkan form login
  loginEmail.value = "";
  loginPassword.value = "";
  registerEmail.value = "";
  registerPassword.value = "";
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
}

function setupAuthEventListeners() {
  // LOGIN
  loginBtn.addEventListener("click", async () => {
    const email = loginEmail.value.trim();
    const pwd = loginPassword.value.trim();
    if (!email || !pwd) return alert("Email dan password harus diisi.");

    try {
      const res = await axios.post(
        `${apiUserUrl}/login`,
        { email, password: pwd },
        { withCredentials: true }
      );

      console.log("Login response data:", res.data);

      // Misal backend kirim data user langsung di res.data.data
      const user = res.data.safeUserData;
      const accessToken = res.data.accessToken;

      if (!user) throw new Error("User data not found in response");

      alert(`Login berhasil!\nUser ID: ${user.id}\nUser Email: ${user.email}`);

      setAuthToken(res.data.data?.accessToken || res.data.accessToken);

      showNotesApp();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert("Login gagal: " + msg);
      console.error("Login error:", err);
    }
  });

  // SHOW REGISTER FORM
  showRegisterBtn.addEventListener("click", () => {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  });

  // CANCEL REGISTER
  cancelRegisterBtn.addEventListener("click", () => {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  });

  // REGISTER
  registerBtn.addEventListener("click", async () => {
    const email = registerEmail.value.trim();
    const pwd = registerPassword.value.trim();
    if (!email || !pwd) return alert("Email dan password harus diisi.");

    const payload = {
      name: email,
      email: email,
      gender: "other",
      password: pwd,
    };

    try {
      await axios.post(`${apiUserUrl}/register`, payload, {
        withCredentials: true,
      });
      alert("Register berhasil! Silakan login.");
      clearAuthForms();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert("Register gagal: " + msg);
      console.error("Register error:", err);
    }
  });

  // LOGOUT
  logoutBtn.addEventListener("click", async () => {
    try {
      await axios.delete(`${apiUserUrl}/logout`, { withCredentials: true });
    } catch (_) {}
    setAuthToken(null);
    localStorage.removeItem("accessToken"); // tambah ini

    showAuth();
  });
}

async function refreshAccessToken() {
  try {
    const response = await fetch("/api/users/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to refresh token");

    const data = await response.json();
    localStorage.setItem("accessToken", data.accessToken);
    setAuthToken(data.accessToken);
    // fungsi kamu untuk set ke axios atau header

    return data.accessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    logout(); // atau redirect login
  }
}

async function fetchWithTokenRefresh(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (res.status === 401) {
      // coba refresh token
      const newToken = await refreshAccessToken();
      if (!newToken) throw new Error("Refresh token expired");

      // ulang permintaan
      return await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    return res;
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
}

export { setupAuthEventListeners, showNotesApp, showAuth, clearAuthForms };
