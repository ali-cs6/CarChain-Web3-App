import api from "./axios";

export const saleApi = {
  completeSale: (vehicleId, data) => api.post(`/sales/${vehicleId}/complete`, data),
  getMySales:   (params)          => api.get("/sales/my-sales", { params }),
};
