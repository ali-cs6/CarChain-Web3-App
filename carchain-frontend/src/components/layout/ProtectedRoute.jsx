import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/auth.store";
import Spinner from "../ui/Spinner";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user?.role !== "admin") return <Navigate to="/" replace />;

  return children;
}
