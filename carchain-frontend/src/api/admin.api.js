import api from "./axios";

export const adminApi = {
  initLedger: () => api.post("/admin/init-ledger"),
  getAuditLogs: (params) => api.get("/admin/audit-logs", { params }),
  getUsers: (params) => api.get("/admin/users", { params }),
  updateUserVerification: (userId, verificationStatus) =>
    api.patch(`/admin/users/${userId}/verification`, { verificationStatus }),
};
