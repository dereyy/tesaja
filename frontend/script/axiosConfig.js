// axiosConfig.js
import axios from "axios";

const apiUserUrl = "https://backend-nopal-505940949397.us-central1.run.app/api/users";
const tokenKey = "accessToken";

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(tokenKey, token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(tokenKey);
    delete axios.defaults.headers.common["Authorization"];
  }
}

// refresh dan interceptor
axios.defaults.withCredentials = true;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${apiUserUrl}/refresh`,
          {}, 
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        setAuthToken(newToken);
        return axios(originalRequest);
      } catch (err) {
        console.error("Refresh token error:", err);
        setAuthToken(null);
        // kalau gagal refresh, force logout
        window.location.reload();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Schedule otomatis refresh sebelum Access Token expired
 */
export function scheduleTokenRefresh() {
  const token = localStorage.getItem(tokenKey);
  if (!token) return;

  let payload;
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch {
    return;
  }
  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  // kita refresh 30 detik sebelum expire
  const msUntilRefresh = expiresAt - now - 30_000;
  if (msUntilRefresh <= 0) {
    // kalau sudah mau atau sudah expired, langsung refresh sekali
    axios.post(`${apiUserUrl}/refresh`, {}, { withCredentials: true })
      .then(res => {
        setAuthToken(res.data.accessToken);
        scheduleTokenRefresh();
      })
      .catch(() => window.location.reload());
  } else {
    setTimeout(async () => {
      try {
        const res = await axios.post(
          `${apiUserUrl}/refresh`,
          {},
          { withCredentials: true }
        );
        setAuthToken(res.data.accessToken);
        scheduleTokenRefresh();
      } catch {
        window.location.reload();
      }
    }, msUntilRefresh);
  }
}
