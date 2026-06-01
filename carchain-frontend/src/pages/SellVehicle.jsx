import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { vehicleApi } from "../api/vehicle.api";
import useAuthStore from "../store/auth.store";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { CAR_MAKES } from "../utils/constants";
import toast from "react-hot-toast";
import { ShieldCheck, Info, ArrowLeft, ArrowRight } from "lucide-react";

export default function SellVehicle() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "",
    make: "",
    model: "",
    year: "",
    color: "",
    owner: user?.fullname || "",
  });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const yr = Number(form.year);
    if (yr < 1980 || yr > new Date().getFullYear() + 1) {
      toast.error("Please enter a valid year");
      return;
    }
    setLoading(true);
    try {
      await vehicleApi.register(form);
      toast.success("Vehicle registered on blockchain!");
      navigate(`/dashboard/create-listing/${form.vehicleId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Register Vehicle on Blockchain</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Create an immutable, verifiable ownership record on Hyperledger Fabric.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3.5 mb-6 text-sm text-brand-800">
        <ShieldCheck className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Blockchain record — this is permanent</p>
          <p className="text-brand-600 text-xs mt-0.5">
            Once registered, vehicle data is written to the immutable Hyperledger Fabric ledger and cannot be deleted.
          </p>
        </div>
      </div>

      <div className="card p-6 shadow-card-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Vehicle ID */}
          <div className="flex flex-col gap-1">
            <Input
              label="Vehicle ID"
              placeholder="e.g. VH-2024-001  (your unique identifier)"
              value={form.vehicleId}
              onChange={update("vehicleId")}
              required
            />
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Choose a unique ID — you'll use it to create marketplace listings.
            </p>
          </div>

          {/* Make + Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Make <span className="text-red-500">*</span></label>
              <select className="input-base" value={form.make} onChange={update("make")} required>
                <option value="">Select make…</option>
                {CAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <Input label="Model" placeholder="e.g. Corolla" value={form.model} onChange={update("model")} required />
          </div>

          {/* Year + Color */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Year"
              type="number"
              placeholder="e.g. 2022"
              value={form.year}
              onChange={update("year")}
              required
              min={1980}
              max={new Date().getFullYear() + 1}
            />
            <Input label="Color" placeholder="e.g. Pearl White" value={form.color} onChange={update("color")} required />
          </div>

          {/* Owner name (read-only) */}
          <div className="flex flex-col gap-1">
            <Input
              label="Registered Owner Name"
              value={form.owner}
              onChange={update("owner")}
              required
              placeholder="Must match your registered name"
            />
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Info className="h-3 w-3" />
              This name is written immutably on the blockchain. Ensure it matches your legal name.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              <ShieldCheck className="h-4 w-4" /> Register on Blockchain
            </Button>
          </div>
        </form>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        After registration you'll be taken to create a marketplace listing.
      </p>
    </div>
  );
}
