import api from "./axios";

export const vehicleApi = {
  getAll: () => api.get("/vehicles"),
  getById: (vehicleId) => api.get(`/vehicles/${vehicleId}`),
  getByOwner: (owner) => api.get(`/vehicles/owner/${owner}`),
  getHistory: (vehicleId) => api.get(`/vehicles/${vehicleId}/history`),
  verify: (vehicleId) => api.get(`/vehicles/${vehicleId}/verify`),
  register: (data) => api.post("/vehicles", data),
  transfer: (vehicleId, newOwner) =>
    api.put(`/vehicles/${vehicleId}/transfer`, { newOwner }),
  updateStatus: (vehicleId, status) =>
    api.put(`/vehicles/${vehicleId}/status`, { status }),
};
