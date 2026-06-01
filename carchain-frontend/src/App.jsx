import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import useAuthStore from "./store/auth.store";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ListingDetail from "./pages/ListingDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SellVehicle from "./pages/SellVehicle";
import CreateListing from "./pages/CreateListing";
import AdminPanel from "./pages/admin/AdminPanel";
import NotFound from "./pages/NotFound";

export default function App() {
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      {/* Auth pages — standalone, no Navbar/Footer */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Public pages */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/listings" element={<Layout><Browse /></Layout>} />
      <Route path="/listings/:vehicleId" element={<Layout><ListingDetail /></Layout>} />

      {/* Protected user pages */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/dashboard/sell" element={
        <ProtectedRoute><Layout><SellVehicle /></Layout></ProtectedRoute>
      } />
      <Route path="/dashboard/create-listing/:vehicleId" element={
        <ProtectedRoute><Layout><CreateListing /></Layout></ProtectedRoute>
      } />

      {/* Admin only */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly><Layout><AdminPanel /></Layout></ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
