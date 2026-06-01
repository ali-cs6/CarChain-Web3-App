import { Link } from "react-router-dom";
import { Car } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-gray-50">
      <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center">
        <Car className="h-8 w-8 text-gray-300" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="text-sm text-gray-500 mt-1.5">The page you're looking for doesn't exist.</p>
      </div>
      <Link to="/" className="btn-primary">Back to home</Link>
    </div>
  );
}
