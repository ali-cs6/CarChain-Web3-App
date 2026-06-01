import { useQuery } from "@tanstack/react-query";
import { vehicleApi } from "../../api/vehicle.api";
import { formatTimestamp, truncateTxId } from "../../utils/formatters";
import Spinner from "../ui/Spinner";
import Badge from "../ui/Badge";
import { Link2, User, Tag, Clock } from "lucide-react";

export default function HistoryTimeline({ vehicleId }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["history", vehicleId],
    queryFn: () => vehicleApi.getHistory(vehicleId).then((r) => r.data.data),
  });

  if (isLoading) return (
    <div className="flex justify-center py-8"><Spinner /></div>
  );

  if (!history?.length) return (
    <p className="text-sm text-gray-400 italic">No blockchain history found for this vehicle.</p>
  );

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-200 rounded-full" />

      <div className="flex flex-col gap-0">
        {history.map((entry, i) => {
          const vehicle = typeof entry.data === "string" ? JSON.parse(entry.data) : entry.data;
          const ts = entry.timestamp?.seconds ? formatTimestamp(entry.timestamp.seconds) : "—";
          const isFirst = i === 0;

          return (
            <div key={entry.txId} className="flex gap-4 pb-6 last:pb-0">
              {/* Dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ring-2 ring-white mt-0.5 ${
                  isFirst ? "bg-brand-600" : "bg-white border-2 border-gray-300"
                }`}>
                  {isFirst ? (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Timestamp */}
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400">{ts}</span>
                  {isFirst && (
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      Latest
                    </span>
                  )}
                </div>

                {/* Card */}
                <div className="card p-4 text-sm">
                  {/* Tx ID */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    <Link2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span
                      className="font-mono text-xs text-gray-500 truncate"
                      title={entry.txId}
                    >
                      {truncateTxId(entry.txId, 20)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400 flex items-center gap-1 mb-1">
                        <User className="h-3 w-3" />Owner
                      </p>
                      <p className="font-semibold text-gray-700 truncate">{vehicle?.owner || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 flex items-center gap-1 mb-1">
                        <Tag className="h-3 w-3" />Status
                      </p>
                      <Badge label={vehicle?.status || "—"} variant={vehicle?.status} />
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Color</p>
                      <p className="font-medium text-gray-700">{vehicle?.color || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
