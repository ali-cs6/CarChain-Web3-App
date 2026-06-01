import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listingApi } from "../api/listing.api";
import ListingCard from "../components/listing/ListingCard";
import ListingFilters from "../components/listing/ListingFilters";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { Car, ChevronLeft, ChevronRight } from "lucide-react";

export default function Browse() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    make: searchParams.get("make") || "",
    model: "",
    location: "",
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
    sortBy: "createdAt",
    order: "desc",
    page: 1,
    limit: 12,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["listings", filters],
    queryFn: () => listingApi.getAll(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v !== null))
    ).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const listings = data?.listings || [];
  const { total = 0, totalPages = 1, page = 1 } = data?.pagination || {};

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filters sidebar */}
      <aside className="w-full lg:w-64 flex-shrink-0">
        <ListingFilters filters={filters} onChange={setFilters} />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Browse Cars</h1>
          {!isLoading && <p className="text-sm text-gray-500">{total} listing{total !== 1 ? "s" : ""} found</p>}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Spinner /></div>
        ) : listings.length === 0 ? (
          <EmptyState icon={Car} title="No listings found" description="Try adjusting your filters." />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  className="btn-secondary !py-1.5 !px-3"
                  disabled={page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button
                  className="btn-secondary !py-1.5 !px-3"
                  disabled={page >= totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
