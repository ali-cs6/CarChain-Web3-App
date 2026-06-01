import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleApi } from "../api/vehicle.api";
import { listingApi } from "../api/listing.api";
import { saleApi } from "../api/sale.api";
import useAuthStore from "../store/auth.store";
import { formatPrice, formatMileage, formatDate, truncateTxId } from "../utils/formatters";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { Car, Plus, Trash2, Eye, LayoutDashboard, TrendingUp, List, Shield, BadgeCheck, Copy } from "lucide-react";
import toast from "react-hot-toast";
// import toast from "react-hot-toast";

function StatCard({ icon: Icon, label, value, color }) {
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

export default function Dashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery({
    queryKey: ["my-vehicles", user?._id],
    queryFn: () => vehicleApi.getByOwner(user?.fullname).then((r) => r.data.data),
    enabled: !!user?.fullname,
  });

  const { data: listingsData, isLoading: loadingListings } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingApi.getAll({ limit: 50 }).then((r) => r.data.data),
  });

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ["my-sales"],
    queryFn: () => saleApi.getMySales({ limit: 20 }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (vehicleId) => listingApi.remove(vehicleId),
    onSuccess: () => {
      toast.success("Listing removed");
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    },
    onError: () => toast.error("Failed to remove listing"),
  });

  function confirmDelete(vehicleId) {
    if (window.confirm("Remove this listing? This cannot be undone.")) {
      deleteMutation.mutate(vehicleId);
    }
  }

  const myListings = listingsData?.listings?.filter(
    (l) => l.sellerId?._id === user?._id || l.sellerId === user?._id
  ) || [];

  const activeListings = myListings.filter((l) => l.isForSale).length;
  const totalViews = myListings.reduce((acc, l) => acc + (l.views || 0), 0);
  const vehicleCount = vehiclesData?.length || 0;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="h-5 w-5 text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500">Welcome back, <span className="font-semibold text-gray-700">{user?.fullname}</span></p>
        </div>
        <Link to="/dashboard/sell" className="btn-primary">
          <Plus className="h-4 w-4" /> Register Vehicle
        </Link>
      </div>

      {/* Admin hint */}
      {user?.role === "admin" && (
        <Link
          to="/admin"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors group"
        >
          <Shield className="h-5 w-5 text-purple-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-purple-800">Admin controls available</p>
            <p className="text-xs text-purple-600">Manage vehicle statuses, view all users, and audit logs in the Admin Panel.</p>
          </div>
          <span className="ml-auto text-xs font-bold text-purple-600 group-hover:underline flex-shrink-0">Go to Admin →</span>
        </Link>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Car}       label="Registered on blockchain" value={loadingVehicles ? "—" : vehicleCount} color="bg-brand-50 text-brand-600" />
        <StatCard icon={List}      label="Active listings"          value={loadingListings ? "—" : activeListings} color="bg-green-50 text-green-600" />
        <StatCard icon={TrendingUp} label="Total listing views"     value={loadingListings ? "—" : totalViews}    color="bg-purple-50 text-purple-600" />
      </div>

      {/* My Vehicles on Blockchain */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">My Vehicles on Blockchain</h2>
          <Link to="/dashboard/sell" className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add vehicle
          </Link>
        </div>

        {loadingVehicles ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : vehiclesData?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehiclesData.map((v) => (
              <div key={v.vehicleId} className="card p-4 flex flex-col gap-3 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{v.year} {v.make} {v.model}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{v.vehicleId}</p>
                  </div>
                  <Badge label={v.status} variant={v.status} />
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{v.color}</span> · Registered {formatDate(v.timestamp)}
                </p>
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link
                    to={`/listings/${v.vehicleId}`}
                    className="btn-secondary !py-1.5 !px-3 text-xs flex-1 justify-center"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                  {v.status === "active" ? (
                    <Link
                      to={`/dashboard/create-listing/${v.vehicleId}`}
                      className="btn-primary !py-1.5 !px-3 text-xs flex-1 justify-center"
                    >
                      <Plus className="h-3.5 w-3.5" /> List for Sale
                    </Link>
                  ) : (
                    <span
                      className="btn-secondary !py-1.5 !px-3 text-xs flex-1 justify-center opacity-40 cursor-not-allowed"
                      title={`Cannot list — vehicle is "${v.status}"`}
                    >
                      <Plus className="h-3.5 w-3.5" /> List for Sale
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Car}
            title="No vehicles registered"
            description="Register your first vehicle on the blockchain to establish verifiable ownership."
            action={<Link to="/dashboard/sell" className="btn-primary">Register Vehicle</Link>}
          />
        )}
      </section>

      {/* My Listings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">My Listings</h2>
          {myListings.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              {myListings.length} listing{myListings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loadingListings ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : myListings.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Location</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Views</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myListings.map((l) => (
                    <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{l.year} {l.make} {l.model}</p>
                        <p className="text-xs text-gray-400 font-mono">{l.vehicleId}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-brand-700">{formatPrice(l.price)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{l.location}</td>
                      <td className="px-4 py-3">
                        <Badge label={l.isForSale ? "Active" : "Inactive"} variant={l.isForSale ? "active" : "removed"} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{l.views}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Link
                            to={`/listings/${l.vehicleId}`}
                            className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                            title="View listing"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => confirmDelete(l.vehicleId)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            disabled={deleteMutation.isPending}
                            title="Remove listing"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={List}
            title="No listings yet"
            description="List one of your blockchain-registered vehicles for sale on the marketplace."
            action={
              vehiclesData?.length > 0
                ? <Link to={`/dashboard/create-listing/${vehiclesData[0].vehicleId}`} className="btn-primary">Create a listing</Link>
                : <Link to="/dashboard/sell" className="btn-primary">Register a vehicle first</Link>
            }
          />
        )}
      </section>

      {/* My Sales */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-800">Completed Sales</h2>
          </div>
          {salesData?.sales?.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              {salesData.sales.length} sale{salesData.sales.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loadingSales ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : salesData?.sales?.length > 0 ? (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sale Price</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Blockchain TX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salesData.sales.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{s.year} {s.make} {s.model}</p>
                        <p className="text-xs text-gray-400 font-mono">{s.vehicleId}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{s.buyerName}</td>
                      <td className="px-4 py-3 font-bold text-green-700">{formatPrice(s.salePrice)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {s.fabricTxId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-gray-500" title={s.fabricTxId}>
                              {truncateTxId(s.fabricTxId, 14)}
                            </span>
                            <button
                              onClick={() => { navigator.clipboard.writeText(s.fabricTxId); toast.success("TX ID copied"); }}
                              className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                              title="Copy transaction ID"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={BadgeCheck}
            title="No completed sales yet"
            description="When you complete a sale through a listing, the deal record and blockchain transfer will appear here."
          />
        )}
      </section>
    </div>
  );
}
