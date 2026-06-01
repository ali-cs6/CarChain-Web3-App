import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api/admin.api";
import { vehicleApi } from "../../api/vehicle.api";
import { formatDate, truncateTxId } from "../../utils/formatters";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import Button from "../../components/ui/Button";
import HistoryTimeline from "../../components/vehicle/HistoryTimeline";
import {
  Shield, Users, FileText, RefreshCw, ChevronLeft, ChevronRight,
  Car, Activity, Search, X, History, LayoutGrid,
} from "lucide-react";
import toast from "react-hot-toast";

const AUDIT_ACTIONS = [
  "getAllVehicles", "getVehicleById", "getVehiclesByOwner", "getVehicleHistory",
  "verifyVehicle", "registerVehicle", "transferOwnership", "updateVehicleStatus", "initLedger",
];

const VEHICLE_STATUSES = ["active", "stolen", "scrapped", "removed"];

// ---- Shared stat card ----
function AdminStatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ---- Overview Tab ----
function Overview() {
  const { data: usersData } = useQuery({
    queryKey: ["admin-overview-users"],
    queryFn: () => adminApi.getUsers({ page: 1, limit: 1 }).then((r) => r.data.data),
  });

  const { data: vehicles } = useQuery({
    queryKey: ["admin-vehicles"],
    queryFn: () => vehicleApi.getAll().then((r) => r.data.data),
  });

  const { data: logsData } = useQuery({
    queryKey: ["admin-overview-logs"],
    queryFn: () => adminApi.getAuditLogs({ page: 1, limit: 6 }).then((r) => r.data.data),
  });

  const totalUsers = usersData?.pagination?.total ?? "—";
  const vehicleList = Array.isArray(vehicles) ? vehicles : [];
  const totalVehicles = vehicleList.length || "—";
  const activeVehicles = vehicleList.filter((v) => v.status === "active").length;
  const totalLogs = logsData?.pagination?.total ?? "—";
  const recentLogs = logsData?.logs || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard icon={Users}    label="Registered Users"  value={totalUsers}    color="bg-blue-50 text-blue-600"     />
        <AdminStatCard icon={Car}      label="Vehicles on Chain" value={totalVehicles} color="bg-brand-50 text-brand-600"   />
        <AdminStatCard icon={Activity} label="Active Vehicles"   value={activeVehicles} color="bg-green-50 text-green-600" />
        <AdminStatCard icon={FileText} label="Audit Log Entries" value={totalLogs}     color="bg-purple-50 text-purple-600" />
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
        {recentLogs.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No recent activity</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{log.action}</td>
                    <td className="px-4 py-3 text-gray-600">{log.userId?.username || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.vehicleId || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge label={log.status} variant={log.status === "success" ? "active" : "stolen"} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Vehicles Tab ----
function VehiclesList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [historyId, setHistoryId] = useState(null);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["admin-vehicles"],
    queryFn: () => vehicleApi.getAll().then((r) => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ vehicleId, status }) => vehicleApi.updateStatus(vehicleId, status),
    onSuccess: (_, { vehicleId, status }) => {
      toast.success(`${vehicleId} marked as "${status}"`);
      qc.invalidateQueries({ queryKey: ["admin-vehicles"] });
      qc.invalidateQueries({ queryKey: ["admin-overview-logs"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Status update failed"),
  });

  const vehicleList = Array.isArray(vehicles) ? vehicles : [];

  const filtered = vehicleList.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.vehicleId?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.owner?.toLowerCase().includes(q)
    );
  });

  function handleStatusChange(vehicleId, currentStatus, newStatus) {
    if (newStatus === currentStatus) return;
    if (window.confirm(`Change "${vehicleId}" status from "${currentStatus}" to "${newStatus}"?`)) {
      statusMutation.mutate({ vehicleId, status: newStatus });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-800">
          Blockchain Vehicles
          {vehicleList.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({vehicleList.length} total)</span>
          )}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="input-base !pl-9 !w-64 text-sm"
            placeholder="ID, make, model, owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
              <tr>
                <th className="px-4 py-3">Vehicle ID</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Change Status</th>
                <th className="px-4 py-3">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((v) => (
                <tr key={v.vehicleId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700" title={v.vehicleId}>
                    {truncateTxId(v.vehicleId, 14)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{v.year} {v.make} {v.model}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.color}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[130px] truncate" title={v.owner}>
                    {v.owner}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={v.status} variant={v.status} />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="input-base !w-auto text-xs !py-1"
                      value={v.status}
                      disabled={statusMutation.isPending}
                      onChange={(e) => handleStatusChange(v.vehicleId, v.status, e.target.value)}
                    >
                      {VEHICLE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setHistoryId(v.vehicleId)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                      title="View blockchain history"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    {search ? `No vehicles match "${search}"` : "No vehicles found on the ledger"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Blockchain History Modal */}
      {historyId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setHistoryId(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900">Blockchain History</h3>
                <p className="font-mono text-xs text-gray-400 mt-0.5">{historyId}</p>
              </div>
              <button
                onClick={() => setHistoryId(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <HistoryTimeline vehicleId={historyId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Audit Logs Tab (enhanced) ----
function AuditLogs() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [vehicleIdFilter, setVehicleIdFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, statusFilter, actionFilter, vehicleIdFilter],
    queryFn: () =>
      adminApi.getAuditLogs({
        page,
        limit: 15,
        ...(statusFilter    && { status: statusFilter }),
        ...(actionFilter    && { action: actionFilter }),
        ...(vehicleIdFilter && { vehicleId: vehicleIdFilter }),
      }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const logs = data?.logs || [];
  const { totalPages = 1, total = 0 } = data?.pagination || {};
  const hasFilters = statusFilter || actionFilter || vehicleIdFilter;

  function resetFilters() {
    setStatusFilter("");
    setActionFilter("");
    setVehicleIdFilter("");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-800">
          Audit Logs
          {total > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({total} entries)</span>}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Action filter */}
          <select
            className="input-base !w-auto text-sm"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            className="input-base !w-auto text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>

          {/* Vehicle ID search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              className="input-base !pl-8 !w-44 text-sm"
              placeholder="Filter by Vehicle ID"
              value={vehicleIdFilter}
              onChange={(e) => { setVehicleIdFilter(e.target.value); setPage(1); }}
            />
          </div>

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />Clear
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Tx ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{log.action}</td>
                  <td className="px-4 py-3 text-gray-600">{log.userId?.username || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.vehicleId || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400" title={log.fabricTxId}>
                    {truncateTxId(log.fabricTxId, 12)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={log.status} variant={log.status === "success" ? "active" : "stolen"} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(log.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No audit logs match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-secondary !py-1.5 !px-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button className="btn-secondary !py-1.5 !px-3" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

const VERIFICATION_STATUSES = ["pending", "verified", "rejected"];

// ---- Users Tab (enhanced) ----
function UsersList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => adminApi.getUsers({ page, limit: 15 }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ userId, verificationStatus }) =>
      adminApi.updateUserVerification(userId, verificationStatus),
    onSuccess: (_, { verificationStatus }) => {
      toast.success(`Verification status set to "${verificationStatus}"`);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Update failed"),
  });

  // Only show non-admin users in this list
  const regularUsers = (data?.users || []).filter((u) => u.role !== "admin");
  const { totalPages = 1, total = 0 } = data?.pagination || {};

  const filtered = regularUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      !search ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.fullname?.toLowerCase().includes(q)
    );
  });

  function handleVerificationChange(userId, currentStatus, newStatus) {
    if (newStatus === currentStatus) return;
    verifyMutation.mutate({ userId, verificationStatus: newStatus });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-800">
          Registered Users
          {total > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({regularUsers.length} shown)</span>}
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            className="input-base !pl-8 !w-52 text-sm"
            placeholder="Search name, email, username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Full Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Gov ID</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">@{u.username}</td>
                  <td className="px-4 py-3">{u.fullname}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.governmentId}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input-base !w-auto text-xs !py-1"
                      value={u.verificationStatus}
                      disabled={verifyMutation.isPending}
                      onChange={(e) =>
                        handleVerificationChange(u._id, u.verificationStatus, e.target.value)
                      }
                    >
                      {VERIFICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {search ? `No users match "${search}"` : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-secondary !py-1.5 !px-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button className="btn-secondary !py-1.5 !px-3" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Tab definitions ----
const TABS = [
  { id: "overview", label: "Overview",   icon: LayoutGrid },
  { id: "vehicles", label: "Vehicles",   icon: Car        },
  { id: "logs",     label: "Audit Logs", icon: FileText   },
  { id: "users",    label: "Users",      icon: Users      },
];

export default function AdminPanel() {
  const [tab, setTab] = useState("overview");

  const initMutation = useMutation({
    mutationFn: () => adminApi.initLedger(),
    onSuccess: () => toast.success("Ledger initialized with seed data"),
    onError: (err) => toast.error(err.response?.data?.message || "Init failed"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <Button
          variant="secondary"
          loading={initMutation.isPending}
          onClick={() => {
            if (window.confirm("This will initialize the ledger with seed data. Continue?")) {
              initMutation.mutate();
            }
          }}
        >
          <RefreshCw className="h-4 w-4" /> Init Ledger
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "vehicles" && <VehiclesList />}
      {tab === "logs"     && <AuditLogs />}
      {tab === "users"    && <UsersList />}
    </div>
  );
}
