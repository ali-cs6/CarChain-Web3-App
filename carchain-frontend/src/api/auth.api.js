import api from "./axios";

export const authApi = {
  register: (data) => api.post("/users/register", data),
  login: (data) => api.post("/users/login", data),
  logout: () => api.post("/users/logout"),
  refreshToken: () => api.post("/users/refresh-token"),
  getMe: () => api.get("/users/me"),
  changePassword: (data) => api.post("/users/change-password", data),
};
