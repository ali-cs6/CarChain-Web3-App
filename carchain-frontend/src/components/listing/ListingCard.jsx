import { Link } from "react-router-dom";
import { MapPin, Gauge, Eye, Car } from "lucide-react";
import { formatPrice, formatMileage } from "../../utils/formatters";
import Badge from "../ui/Badge";

export default function ListingCard({ listing }) {
  const { vehicleId, make, model, year, color, price, location, mileage, photos, views, isForSale } = listing;

  return (
    <Link
      to={`/listings/${vehicleId}`}
      className="card-hover flex flex-col overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {/* Photo */}
      <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
        {photos?.length > 0 ? (
          <img
            src={photos[0]}
            alt={`${year} ${make} ${model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <Car className="h-10 w-10" />
            <span className="text-xs">No photo</span>
          </div>
        )}

        {/* Sold overlay */}
        {!isForSale && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase shadow">
              Sold
            </span>
          </div>
        )}

        {/* Status badge on photo */}
        {isForSale && (
          <div className="absolute top-2.5 right-2.5">
            <Badge label="For Sale" variant="active" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div>
          <h3 className="font-semibold text-gray-900 text-base leading-tight">
            {year} {make} {model}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{color} · {vehicleId}</p>
        </div>

        <p className="text-xl font-bold text-brand-700">{formatPrice(price)}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2.5 border-t border-gray-100">
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </span>
          <span className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <Gauge className="h-3.5 w-3.5 text-gray-400" />{formatMileage(mileage)}
          </span>
          <span className="flex items-center gap-1 flex-shrink-0 ml-2 text-gray-400">
            <Eye className="h-3.5 w-3.5" />{views}
          </span>
        </div>
      </div>
    </Link>
  );
}
