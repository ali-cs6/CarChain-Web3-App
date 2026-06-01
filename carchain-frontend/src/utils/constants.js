export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:9000/api/v1";

export const VEHICLE_STATUSES = ["active", "stolen", "scrapped", "removed"];

export const LISTING_SORT_OPTIONS = [
  { label: "Newest first",    value: "createdAt:desc" },
  { label: "Oldest first",    value: "createdAt:asc" },
  { label: "Price: low–high", value: "price:asc" },
  { label: "Price: high–low", value: "price:desc" },
];

export const CAR_MAKES = [
  "Toyota", "Honda", "Suzuki", "Kia", "Hyundai",
  "Nissan", "Mitsubishi", "BMW", "Mercedes-Benz", "Audi",
];
