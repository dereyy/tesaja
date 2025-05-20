export function formatDate(isoString) {
  const date = new Date(isoString);
  return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getFullYear()}, ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
}

export function setAuthHeader(tokenKey = "accessToken") {
  const token = localStorage.getItem(tokenKey);
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
}

export async function ensureValidAccessToken() {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;

  // Cek expired dengan decode JWT (tanpa library eksternal)
  function isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.exp * 1000) < Date.now();
    } catch (e) {
      return true;
    }
  }

  if (!isTokenExpired(token)) return true;

  // Jika expired, coba refresh
  try {
    const res = await axios.post(
      "https://backend-nopal-505940949397.us-central1.run.app/api/users/refresh",
      {},
      { withCredentials: true }
    );
    const newToken = res.data.accessToken;
    if (newToken) {
      localStorage.setItem("accessToken", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      return true;
    }
  } catch (err) {
    localStorage.removeItem("accessToken");
    return false;
  }
} 