import { Link, NavLink, useNavigate } from "react-router-dom";
import { Car, LayoutDashboard, LogOut, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import useAuthStore from "../../store/auth.store";
import toast from "react-hot-toast";

function UserAvatar({ user }) {
  const initials = user?.fullname
    ? user.fullname.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.username?.[0]?.toUpperCase() || "?";

  return (
    <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  }

  const activeCls = "text-brand-600 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-600 after:rounded-full";
  const inactiveCls = "text-gray-600 hover:text-gray-900";

  const linkCls = ({ isActive }) =>
    `relative text-sm transition-colors pb-0.5 ${isActive ? activeCls : inactiveCls}`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-lg select-none group">
            <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-brand-700 transition-colors">
              <Car className="h-4.5 w-4.5 text-white" style={{ height: "1.125rem", width: "1.125rem" }} />
            </div>
            <span className="text-brand-700 group-hover:text-brand-800 transition-colors">CarChain</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            <NavLink to="/listings" className={linkCls}>Browse Cars</NavLink>
            {isAuthenticated && (
              <NavLink to="/dashboard" className={linkCls}>
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" />Dashboard
                </span>
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    isActive
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                  }`
                }
              >
                <Shield className="h-3.5 w-3.5" />Admin
              </NavLink>
            )}
          </div>

          {/* Auth section */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <UserAvatar user={user} />
                  <span className="font-medium max-w-[120px] truncate">{user?.fullname || user?.username}</span>
                </div>
                <div className="w-px h-5 bg-gray-200" />
                <button onClick={handleLogout} className="btn-secondary !py-1.5 !px-3 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !py-1.5 !px-4">Sign in</Link>
                <Link to="/register" className="btn-primary !py-1.5 !px-4">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-1 animate-slide-down shadow-lg">
          {isAuthenticated && !isLoading && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1 bg-brand-50 rounded-lg">
              <UserAvatar user={user} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullname}</p>
                <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
              </div>
            </div>
          )}
          <NavLink to="/listings"
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"}`}
            onClick={() => setMenuOpen(false)}>
            Browse Cars
          </NavLink>
          {isAuthenticated && !isLoading && (
            <NavLink to="/dashboard"
              className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setMenuOpen(false)}>
              <LayoutDashboard className="h-4 w-4" />Dashboard
            </NavLink>
          )}
          {user?.role === "admin" && !isLoading && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  isActive ? "bg-purple-600 text-white" : "text-purple-700 bg-purple-50 hover:bg-purple-100"
                }`
              }
              onClick={() => setMenuOpen(false)}
            >
              <Shield className="h-4 w-4" />Admin Panel
            </NavLink>
          )}
          <div className="border-t border-gray-100 mt-2 pt-3">
            {isLoading ? (
              <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4" />Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="btn-secondary w-full" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link to="/register" className="btn-primary w-full" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
