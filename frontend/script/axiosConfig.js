const apiUserUrl = "https://backend-nopal-505940949397.us-central1.run.app/api/users";
const tokenKey = "accessToken";

// Fungsi untuk mengatur token
export function setAuthToken (token) {
  if (token) {
    localStorage.setItem(tokenKey, token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(tokenKey);
    delete axios.defaults.headers.common["Authorization"];
  }
};

// Set token awal jika ada
const token = localStorage.getItem(tokenKey);
if (token) {
  setAuthToken(token);
}

// Konfigurasi default untuk Axios
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Interceptor untuk response
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // 1) Jika ini request ke endpoint refresh, jangan retry lagi
    if (originalRequest.url.includes('/refresh')) {
      return Promise.reject(error);
    }

    // 2) Hanya coba refresh sekali
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${apiUserUrl}/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.accessToken;
        if (newToken) {
          setAuthToken(newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError);
        setAuthToken(null);
        // optional: redirect ke login
        // window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);
