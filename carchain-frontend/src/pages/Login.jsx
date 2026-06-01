import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Car, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import useAuthStore from "../store/auth.store";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  if (!isLoading && isAuthenticated) return <Navigate to={from} replace />;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — visible md+ */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex-col justify-between p-10 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-brand-400/20 blur-2xl pointer-events-none" />

        <Link to="/" className="relative flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 bg-white/15 rounded-lg flex items-center justify-center">
            <Car className="h-4.5 w-4.5" style={{ height: "1.125rem", width: "1.125rem" }} />
          </div>
          CarChain
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Welcome back to the trusted car marketplace
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed mb-8">
            Sign in to manage your vehicles, track listings, and verify blockchain records.
          </p>
          <div className="flex flex-col gap-3">
            {[
              "Blockchain-secured vehicle history",
              "Verified seller identities",
              "Immutable ownership records",
            ].map((point) => (
              <div key={point} className="flex items-center gap-3 text-sm text-brand-100">
                <ShieldCheck className="h-4 w-4 text-green-400 flex-shrink-0" />
                {point}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-300">
          Powered by Hyperledger Fabric · Pakistan
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-brand-700 font-bold text-2xl">
              <div className="h-9 w-9 bg-brand-600 rounded-xl flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              CarChain
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700">
                Create one free
              </Link>
            </p>
          </div>

          <div className="card p-8 shadow-card-lg">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Email or Username"
                type="text"
                placeholder="you@example.com"
                value={form.email}
                onChange={update("email")}
                required
                autoComplete="username"
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    className="input-base pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={update("password")}
                    required
                    autoComplete="current-password"
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
              </div>

              <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
                Sign in <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            By signing in you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
