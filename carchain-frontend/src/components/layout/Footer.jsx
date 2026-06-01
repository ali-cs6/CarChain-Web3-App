import { Car, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-brand-700">
              <div className="h-7 w-7 bg-brand-600 rounded-md flex items-center justify-center">
                <Car className="h-4 w-4 text-white" />
              </div>
              CarChain
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Pakistan's first blockchain-secured vehicle marketplace. Every ownership record is immutable and tamper-proof.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1 w-fit">
              <Shield className="h-3 w-3" />
              Powered by Hyperledger Fabric
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="section-label mb-3">Marketplace</p>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Browse Listings", to: "/listings" },
                { label: "Register Vehicle", to: "/dashboard/sell" },
                { label: "Dashboard", to: "/dashboard" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 hover:text-brand-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="section-label mb-3">Account</p>
            <ul className="flex flex-col gap-2">
              {[
                { label: "Sign In", to: "/login" },
                { label: "Create Account", to: "/register" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 hover:text-brand-600 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} CarChain. All rights reserved.</p>
          <p>Built with Hyperledger Fabric &amp; React</p>
        </div>
      </div>
    </footer>
  );
}
