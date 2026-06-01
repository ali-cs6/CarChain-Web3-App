import axios from "axios";
import { API_BASE_URL } from "../utils/constants";
import { getToken, setToken } from "../utils/token";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach access token from memory to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Skip refresh attempt for session-check and refresh-token calls
    // to avoid infinite loops on initial load with no session
    const isAuthCheck = original.url?.includes("/users/me");
    const isRefreshCall = original.url?.includes("/users/refresh-token");

    if (error.response?.status === 401 && !original._retry && !isAuthCheck && !isRefreshCall) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        setToken(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setToken(null);
        // Let React Router handle the redirect — no hard reload
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
