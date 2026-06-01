import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, ShieldCheck, History, Car, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listingApi } from "../api/listing.api";
import ListingCard from "../components/listing/ListingCard";
import Spinner from "../components/ui/Spinner";
import useAuthStore from "../store/auth.store";

function HeroSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  function handleSearch(e) {
    e.preventDefault();
    if (q.trim()) navigate(`/listings?make=${encodeURIComponent(q.trim())}`);
    else navigate("/listings");
  }
  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-lg mx-auto mt-8">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          className="w-full pl-10 pr-4 py-3 text-sm border-0 rounded-xl bg-white/95 backdrop-blur text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-white/80 shadow-lg"
          placeholder="Search by make, e.g. Toyota, Honda…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <button type="submit" className="px-5 py-3 bg-white text-brand-700 font-semibold text-sm rounded-xl shadow-lg hover:bg-brand-50 transition-colors flex-shrink-0">
        Search
      </button>
    </form>
  );
}

const STATS = [
  { value: "Immutable", label: "Records on chain" },
  { value: "Verified", label: "Ownership history" },
  { value: "Trusted", label: "Marketplace" },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Blockchain Verified",
    desc: "Every vehicle is registered on an immutable Hyperledger Fabric ledger. No fraud, no tampering.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: History,
    title: "Full Ownership History",
    desc: "See every ownership transfer and status change, cryptographically secured and tamper-proof.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Car,
    title: "Trusted Marketplace",
    desc: "Buy and sell with full confidence. Every listing is backed by on-chain verification.",
    color: "bg-purple-50 text-purple-600",
  },
];

const TRUST_POINTS = [
  "Government ID verified sellers",
  "Cryptographic ownership proofs",
  "Complete transaction audit trail",
  "Real-time blockchain verification",
];

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: () => listingApi.getAll({ limit: 6 }).then((r) => r.data.data),
  });

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-brand-400/20 blur-2xl pointer-events-none" />

        <div className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-3.5 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-green-300" />
            Powered by Hyperledger Fabric Blockchain
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Buy &amp; Sell Cars with
            <br />
            <span className="text-blue-200">Blockchain Trust</span>
          </h1>

          <p className="mt-5 text-brand-100 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Pakistan's first blockchain-secured vehicle marketplace. Every vehicle history is recorded on an immutable ledger — verify ownership in seconds.
          </p>

          <HeroSearch />

          <div className="mt-5 flex items-center justify-center gap-3 text-sm">
            <Link
              to="/listings"
              className="inline-flex items-center gap-1.5 text-white font-semibold bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
            >
              Browse all listings <ArrowRight className="h-4 w-4" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
              >
                Create account →
              </Link>
            )}
          </div>

          {/* Stats strip */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-10">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-brand-200 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ──────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="section-label mb-2">Why CarChain</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">The safest way to buy or sell a car</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-6 flex flex-col gap-4 hover:shadow-card-hover transition-shadow">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
                  <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust section ──────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <p className="section-label mb-2">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Every car has a verified, on-chain identity</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-lg">
              When a seller registers a vehicle, a permanent record is written to the Hyperledger Fabric blockchain. Buyers can instantly verify ownership history and status before making any decision.
            </p>
            <ul className="flex flex-col gap-3">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard/sell" className="btn-primary">Register a Vehicle</Link>
              ) : (
                <Link to="/register" className="btn-primary">Get started free</Link>
              )}
              <Link to="/listings" className="btn-secondary">Browse cars</Link>
            </div>
          </div>

          {/* Visual card */}
          <div className="flex-shrink-0 w-full lg:w-80">
            <div className="card p-5 shadow-card-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-brand-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Blockchain Record</p>
                  <p className="text-xs text-gray-400">Toyota Corolla · 2022</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  ● Verified
                </span>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                {[
                  ["Owner", "Ahmed Khan"],
                  ["Status", "Active"],
                  ["Registered", "Jan 2022"],
                  ["Tx ID", "a3f9c2…d1e8"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured listings ──────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="section-label mb-1.5">Latest</p>
              <h2 className="text-2xl font-bold text-gray-900">Recently listed cars</h2>
            </div>
            <Link to="/listings" className="text-sm text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : data?.listings?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.listings.map((l) => <ListingCard key={l._id} listing={l} />)}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">No listings yet.</p>
              <Link to="/dashboard/sell" className="btn-primary mt-4 inline-flex">
                Be the first to list a car
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-brand-900">
        <div className="max-w-3xl mx-auto text-center text-white">
          <TrendingUp className="h-10 w-10 text-brand-300 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to list your car?</h2>
          <p className="text-brand-200 text-sm mb-7 max-w-md mx-auto">
            Register your vehicle on the blockchain in minutes and reach thousands of trusted buyers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link to="/dashboard/sell" className="btn-primary !bg-white !text-brand-700 hover:!bg-brand-50 shadow-md">
                Register a Vehicle
              </Link>
            ) : (
              <Link to="/register" className="btn-primary !bg-white !text-brand-700 hover:!bg-brand-50 shadow-md">
                Create Free Account
              </Link>
            )}
            <Link to="/listings" className="btn-secondary !bg-transparent !text-white !border-white/30 hover:!bg-white/10">
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
