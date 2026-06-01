import { ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { vehicleApi } from "../../api/vehicle.api";

export default function VerifyBadge({ vehicleId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["verify", vehicleId],
    queryFn: () => vehicleApi.verify(vehicleId).then((r) => r.data.data),
  });

  if (isLoading) return <span className="flex items-center gap-1 text-xs text-gray-400"><Loader2 className="h-3 w-3 animate-spin" />Verifying...</span>;

  const verified = data?.exists && data?.status === "active";

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
      {verified ? <ShieldCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
      {verified ? "Blockchain Verified" : "Not Verified"}
    </span>
  );
}
