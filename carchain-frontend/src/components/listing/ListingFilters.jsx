import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { CAR_MAKES, LISTING_SORT_OPTIONS } from "../../utils/constants";

const DEFAULT_FILTERS = {
  make: "", model: "", location: "",
  minPrice: "", maxPrice: "", minYear: "", maxYear: "",
  sortBy: "createdAt", order: "desc", page: 1, limit: 12,
};

function FilterLabel({ children }) {
  return <label className="section-label">{children}</label>;
}

export default function ListingFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  const activeCount = [
    filters.make, filters.model, filters.location,
    filters.minPrice, filters.maxPrice, filters.minYear, filters.maxYear,
  ].filter(Boolean).length;

  return (
    <div className="card p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-sm text-gray-800">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" />
          Filters
          {activeCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            onClick={() => onChange({ ...DEFAULT_FILTERS })}
          >
            <RotateCcw className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Make */}
      <div className="flex flex-col gap-1.5">
        <FilterLabel>Make</FilterLabel>
        <select
          className="input-base"
          value={filters.make || ""}
          onChange={(e) => update("make", e.target.value)}
        >
          <option value="">All makes</option>
          {CAR_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Model */}
      <div className="flex flex-col gap-1.5">
        <FilterLabel>Model</FilterLabel>
        <input
          className="input-base"
          placeholder="e.g. Corolla, Civic…"
          value={filters.model || ""}
          onChange={(e) => update("model", e.target.value)}
        />
      </div>

      {/* Year range */}
      <div className="flex flex-col gap-1.5">
        <FilterLabel>Year range</FilterLabel>
        <div className="flex gap-2">
          <input
            className="input-base"
            type="number"
            placeholder="From"
            value={filters.minYear || ""}
            onChange={(e) => update("minYear", e.target.value)}
            min={1980}
            max={new Date().getFullYear() + 1}
          />
          <input
            className="input-base"
            type="number"
            placeholder="To"
            value={filters.maxYear || ""}
            onChange={(e) => update("maxYear", e.target.value)}
            min={1980}
            max={new Date().getFullYear() + 1}
          />
        </div>
      </div>

      {/* Price range */}
      <div className="flex flex-col gap-1.5">
        <FilterLabel>Price (PKR)</FilterLabel>
        <div className="flex gap-2">
          <input
            className="input-base"
            type="number"
            placeholder="Min"
            value={filters.minPrice || ""}
            onChange={(e) => update("minPrice", e.target.value)}
            min={0}
          />
          <input
            className="input-base"
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ""}
            onChange={(e) => update("maxPrice", e.target.value)}
            min={0}
          />
        </div>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1.5">
        <FilterLabel>Location</FilterLabel>
        <input
          className="input-base"
          placeholder="e.g. Islamabad, Lahore…"
          value={filters.location || ""}
          onChange={(e) => update("location", e.target.value)}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Sort */}
      <div className="flex flex-col gap-1.5">
        <FilterLabel>Sort by</FilterLabel>
        <select
          className="input-base"
          value={`${filters.sortBy || "createdAt"}:${filters.order || "desc"}`}
          onChange={(e) => {
            const [sortBy, order] = e.target.value.split(":");
            onChange({ ...filters, sortBy, order, page: 1 });
          }}
        >
          {LISTING_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          className="btn-secondary text-xs w-full"
          onClick={() => onChange({ ...DEFAULT_FILTERS })}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Clear all filters
        </button>
      )}
    </div>
  );
}
