import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Car, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import { authApi } from "../api/auth.api";
import useAuthStore from "../store/auth.store";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", fullname: "", password: "", governmentId: "", licenseNumber: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  if (!isLoading && isAuthenticated) return <Navigate to={from?.pathname || "/dashboard"} replace />;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await authApi.register(form);
      toast.success("Account created! Please sign in.");
      navigate("/login", { state: { from } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex-col justify-between p-10 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <Link to="/" className="relative flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center">
            <Car className="h-4.5 w-4.5" style={{ height: "1.125rem", width: "1.125rem" }} />
          </div>
          CarChain
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Join Pakistan's first blockchain car marketplace
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed mb-8">
            Register your vehicles on-chain and sell with verified, tamper-proof ownership records that buyers can trust.
          </p>
          <div className="card bg-white/10 border-white/20 p-4 text-sm text-brand-100">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              <span className="font-semibold text-white">Why verify your identity?</span>
            </div>
            <p className="text-xs leading-relaxed">
              Government ID verification ensures that every seller is accountable, building trust for all buyers in the marketplace.
            </p>
          </div>
        </div>

        <p className="relative text-xs text-brand-300">
          Powered by Hyperledger Fabric · Pakistan
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-brand-700 font-bold text-2xl">
              <div className="h-9 w-9 bg-brand-600 rounded-xl flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              CarChain
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Already registered?{" "}
              <Link to="/login" state={from ? { from } : undefined} className="text-brand-600 font-semibold hover:text-brand-700">Sign in</Link>
            </p>
          </div>

          <div className="card p-8 shadow-card-lg">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <Input label="Username" placeholder="johndoe" value={form.username} onChange={update("username")} required autoComplete="username" />
                <Input label="Full Name" placeholder="John Doe" value={form.fullname} onChange={update("fullname")} required />
              </div>

              {/* Email */}
              <Input label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={update("email")} required autoComplete="email" />

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    className="input-base pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={update("password")}
                    required
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.password && form.password.length < 8 && (
                  <p className="text-xs text-amber-600">Password too short ({form.password.length}/8 chars)</p>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400 font-medium">Identity Verification</span>
                </div>
              </div>

              {/* Gov ID */}
              <Input
                label="Government ID (CNIC / Passport)"
                placeholder="e.g. 42101-1234567-1"
                value={form.governmentId}
                onChange={update("governmentId")}
                required
              />

              {/* License */}
              <Input
                label="Driving License Number (optional)"
                placeholder="e.g. ABC-12345"
                value={form.licenseNumber}
                onChange={update("licenseNumber")}
              />

              <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
                Create Account <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            By registering, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
