import api from "./axios";

export const listingApi = {
  getAll: (params) => api.get("/listings", { params }),
  getById: (vehicleId) => api.get(`/listings/${vehicleId}`),
  create: (data) => api.post("/listings", data),
  update: (vehicleId, data) => api.patch(`/listings/${vehicleId}`, data),
  remove: (vehicleId) => api.delete(`/listings/${vehicleId}`),
  uploadPhotos: (vehicleId, formData) =>
    api.post(`/listings/${vehicleId}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
