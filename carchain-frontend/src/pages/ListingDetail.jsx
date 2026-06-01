import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listingApi } from "../api/listing.api";
import { saleApi } from "../api/sale.api";
import { formatPrice, formatMileage, formatDate, truncateTxId } from "../utils/formatters";
import VerifyBadge from "../components/vehicle/VerifyBadge";
import HistoryTimeline from "../components/vehicle/HistoryTimeline";
import Badge from "../components/ui/Badge";
import Spinner from "../components/ui/Spinner";
import useAuthStore from "../store/auth.store";
import {
  MapPin, Gauge, Calendar, ChevronLeft, ChevronRight,
  Share2, Car, Phone, MessageCircle, ArrowLeft, Pencil, X,
  ImagePlus, Check, LayoutDashboard, Tag, Copy, LogIn, UserPlus, Eye,
  BadgeCheck, AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ListingDetail() {
  const { vehicleId } = useParams();
  const qc = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const fileInputRef = useRef(null);

  const [photoIdx, setPhotoIdx] = useState(0);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [showNumber, setShowNumber] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [saleModal, setSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({ buyerIdentifier: "", salePrice: "" });
  const [saleResult, setSaleResult] = useState(null);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", vehicleId],
    queryFn: () => listingApi.getById(vehicleId).then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => listingApi.update(vehicleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["listing", vehicleId] }),
    onError: (err) => toast.error(err.response?.data?.message || "Update failed"),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData) => listingApi.uploadPhotos(vehicleId, formData),
    onSuccess: () => {
      toast.success("Photos uploaded");
      qc.invalidateQueries({ queryKey: ["listing", vehicleId] });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => toast.error(err.response?.data?.message || "Upload failed"),
  });

  const completeSaleMutation = useMutation({
    mutationFn: (data) => saleApi.completeSale(vehicleId, data),
    onSuccess: (res) => {
      setSaleResult(res.data.data.sale);
      qc.invalidateQueries({ queryKey: ["listing", vehicleId] });
      qc.invalidateQueries({ queryKey: ["my-sales"] });
      qc.invalidateQueries({ queryKey: ["my-vehicles"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Sale completion failed"),
  });

  if (isLoading) return (
    <div className="flex justify-center items-center py-32">
      <Spinner className="h-10 w-10 text-brand-600" />
    </div>
  );

  if (!listing) return (
    <div className="text-center py-20">
      <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Car className="h-8 w-8 text-gray-300" />
      </div>
      <p className="text-gray-600 font-semibold">Listing not found</p>
      <Link to="/listings" className="btn-secondary mt-4 inline-flex">← Back to listings</Link>
    </div>
  );

  const photos = listing.photos || [];
  const isOwner =
    isAuthenticated &&
    listing.sellerId?._id?.toString() === user?._id?.toString();
  const canAddPhotos = photos.length < 5;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: `${listing.year} ${listing.make} ${listing.model}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  }

  function handleSaveDesc() {
    updateMutation.mutate({ description: descValue }, {
      onSuccess: () => {
        toast.success("Description updated");
        setEditingDesc(false);
      },
    });
  }

  function handleDeletePhoto(idx) {
    if (!window.confirm("Remove this photo from the listing?")) return;
    const newPhotos = photos.filter((_, i) => i !== idx);
    updateMutation.mutate({ photos: newPhotos }, {
      onSuccess: () => {
        toast.success("Photo removed");
        setPhotoIdx((cur) => Math.min(cur, Math.max(0, newPhotos.length - 1)));
      },
    });
  }

  function handleToggleSale() {
    const next = !listing.isForSale;
    updateMutation.mutate({ isForSale: next }, {
      onSuccess: () => toast.success(next ? "Listing is back on sale" : "Listing marked as sold"),
    });
  }

  function openSaleModal() {
    setSaleForm({ buyerIdentifier: "", salePrice: String(listing.price) });
    setSaleResult(null);
    setSaleModal(true);
  }

  function handleCompleteSale(e) {
    e.preventDefault();
    if (!saleForm.buyerIdentifier.trim()) { toast.error("Enter the buyer's username or email"); return; }
    if (Number(saleForm.salePrice) <= 0) { toast.error("Enter a valid sale price"); return; }
    completeSaleMutation.mutate({
      buyerIdentifier: saleForm.buyerIdentifier.trim(),
      salePrice: Number(saleForm.salePrice),
    });
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach((f) => formData.append("photos", f));
    uploadMutation.mutate(formData);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb + share */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/listings" className="hover:text-brand-600 flex items-center gap-1 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" />Browse
          </Link>
          <span>›</span>
          <span className="text-gray-800 font-medium truncate max-w-[200px]">
            {listing.year} {listing.make} {listing.model}
          </span>
        </div>
        <button onClick={handleShare} className="btn-secondary !py-1.5 !px-3 text-xs gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ---- Left: photos + details ---- */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Photo gallery */}
          <div className="card overflow-hidden">
            <div className="aspect-[16/9] bg-gray-100 relative">
              {photos.length > 0 ? (
                <>
                  <img
                    src={photos[photoIdx]}
                    alt={`${listing.year} ${listing.make} ${listing.model}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Nav arrows — only when multiple photos */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {photos.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPhotoIdx(i)}
                            className={`h-1.5 rounded-full transition-all ${
                              i === photoIdx ? "bg-white w-4" : "bg-white/50 w-1.5"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="absolute top-3 right-3 bg-black/40 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                        {photoIdx + 1} / {photos.length}
                      </div>
                    </>
                  )}

                  {/* Owner: delete button on main image (only when single photo — no thumbnail strip) */}
                  {isOwner && photos.length === 1 && (
                    <button
                      onClick={() => handleDeletePhoto(0)}
                      disabled={updateMutation.isPending}
                      className="absolute top-3 left-3 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm"
                      title="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {!listing.isForSale && (
                    <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center pointer-events-none">
                      <span className="bg-white text-gray-800 text-sm font-bold px-4 py-1.5 rounded-full shadow uppercase tracking-wide">
                        Sold
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-300">
                  <Car className="h-14 w-14" />
                  <span className="text-sm">No photos available</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip — only when multiple photos */}
            {photos.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
                {photos.map((p, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <button
                      onClick={() => setPhotoIdx(i)}
                      className={`h-14 w-20 rounded-lg overflow-hidden ring-2 transition-all block ${
                        i === photoIdx
                          ? "ring-brand-500 ring-offset-1"
                          : "ring-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                    {/* Owner: delete button per thumbnail */}
                    {isOwner && (
                      <button
                        onClick={() => handleDeletePhoto(i)}
                        disabled={updateMutation.isPending}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow transition-colors"
                        title="Remove photo"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Owner: add photos row */}
            {isOwner && (
              <div className={`px-3 py-2 bg-gray-50 flex items-center ${photos.length > 1 ? "" : "border-t border-gray-100"}`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canAddPhotos || uploadMutation.isPending}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    canAddPhotos
                      ? "text-brand-600 hover:bg-brand-50"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <ImagePlus className="h-4 w-4 flex-shrink-0" />
                  {uploadMutation.isPending
                    ? "Uploading…"
                    : canAddPhotos
                      ? `Add Photos (${5 - photos.length} slot${5 - photos.length === 1 ? "" : "s"} remaining)`
                      : "Photo limit reached (5/5)"}
                </button>
              </div>
            )}
          </div>

          {/* Title + for-sale badge */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {listing.year} {listing.make} {listing.model}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{listing.color} · {vehicleId}</p>
            </div>
            <Badge
              label={listing.isForSale ? "For Sale" : "Sold"}
              variant={listing.isForSale ? "active" : "removed"}
            />
          </div>

          {/* Vehicle specs */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="h-4 w-4 text-brand-600" />Vehicle Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {[
                ["Make",       listing.make],
                ["Model",      listing.model],
                ["Year",       listing.year],
                ["Color",      listing.color],
                ["Vehicle ID", listing.vehicleId],
                ["Mileage",    formatMileage(listing.mileage)],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{k}</p>
                  <p className="font-semibold text-gray-800 mt-1 text-sm">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description — editable for owner, read-only for everyone else */}
          {(listing.description || isOwner) && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">
                  {isOwner ? "Description" : "Seller's Description"}
                </h2>
                {isOwner && !editingDesc && (
                  <button
                    onClick={() => { setDescValue(listing.description || ""); setEditingDesc(true); }}
                    className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />Edit
                  </button>
                )}
              </div>

              {editingDesc ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    className="input-base resize-none text-sm leading-relaxed"
                    rows={5}
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    placeholder="Describe the vehicle — condition, service history, modifications…"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setEditingDesc(false)}
                      className="btn-secondary !py-1.5 !px-3 text-sm"
                    >
                      <X className="h-3.5 w-3.5" />Cancel
                    </button>
                    <button
                      onClick={handleSaveDesc}
                      disabled={updateMutation.isPending}
                      className="btn-primary !py-1.5 !px-3 text-sm"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {updateMutation.isPending ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : listing.description ? (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No description yet. Click Edit to add one.
                </p>
              )}
            </div>
          )}

          {/* Blockchain history */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
              Blockchain Ownership History
            </h2>
            <HistoryTimeline vehicleId={vehicleId} />
          </div>
        </div>

        {/* ---- Right: sticky price + action card ---- */}
        <div className="flex flex-col gap-4">
          <div className="card p-5 sticky top-24 flex flex-col gap-4">

            {/* Price */}
            <div>
              <p className="text-3xl font-bold text-brand-700">{formatPrice(listing.price)}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {listing.year} {listing.make} {listing.model}
              </p>
            </div>

            {/* Meta */}
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <span className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />{listing.location}
              </span>
              <span className="flex items-center gap-2.5">
                <Gauge className="h-4 w-4 text-gray-400 flex-shrink-0" />{formatMileage(listing.mileage)}
              </span>
              <span className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />Listed {formatDate(listing.createdAt)}
              </span>
            </div>

            {/* Verify badge */}
            <div className="py-3 border-y border-gray-100">
              <VerifyBadge vehicleId={vehicleId} />
            </div>

            {isOwner ? (
              /* ---- Owner controls ---- */
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Listing</p>

                {listing.isForSale ? (
                  <>
                    {/* Primary: full blockchain sale flow */}
                    <button
                      onClick={openSaleModal}
                      className="btn-primary w-full text-sm"
                    >
                      <BadgeCheck className="h-4 w-4" /> Complete Sale
                    </button>
                    {/* Secondary: just take down the listing, no transfer */}
                    <button
                      onClick={handleToggleSale}
                      disabled={updateMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <Tag className="h-3.5 w-3.5" /> Take Down Listing
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleToggleSale}
                    disabled={updateMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <Tag className="h-4 w-4" /> Re-list for Sale
                  </button>
                )}

                <Link to="/dashboard" className="btn-secondary w-full text-center text-sm">
                  <LayoutDashboard className="h-4 w-4" />Go to Dashboard
                </Link>
              </div>
            ) : (
              /* ---- Non-owner: seller info + contact CTA ---- */
              <>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {listing.sellerId?.fullname?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{listing.sellerId?.fullname}</p>
                    <p className="text-xs text-gray-400 truncate">@{listing.sellerId?.username}</p>
                  </div>
                </div>

                {listing.isForSale && (
                  <div className="flex flex-col gap-2 pt-1">
                    {isAuthenticated ? (
                      <>
                        {/* Contact Seller — reveals phone number */}
                        {showNumber ? (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200">
                            <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <a
                              href={`tel:${listing.contactNumber}`}
                              className="flex-1 font-semibold text-green-800 text-sm truncate hover:underline"
                            >
                              {listing.contactNumber || "Not provided"}
                            </a>
                            {listing.contactNumber && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(listing.contactNumber);
                                  toast.success("Number copied");
                                }}
                                className="p-1 text-green-600 hover:text-green-800 rounded transition-colors flex-shrink-0"
                                title="Copy number"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            className="btn-primary w-full"
                            onClick={() => setShowNumber(true)}
                          >
                            <Eye className="h-4 w-4" /> Show Contact Number
                          </button>
                        )}

                        {/* Send Message — coming soon */}
                        <button
                          className="btn-secondary w-full"
                          onClick={() => toast("Messaging coming soon", { icon: "💬" })}
                        >
                          <MessageCircle className="h-4 w-4" /> Send Message
                        </button>
                      </>
                    ) : (
                      /* Guest: both buttons open the auth modal */
                      <>
                        <button
                          className="btn-primary w-full"
                          onClick={() => setAuthModal(true)}
                        >
                          <Phone className="h-4 w-4" /> Contact Seller
                        </button>
                        <button
                          className="btn-secondary w-full"
                          onClick={() => setAuthModal(true)}
                        >
                          <MessageCircle className="h-4 w-4" /> Send Message
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Complete Sale modal */}
      {saleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && !completeSaleMutation.isPending && setSaleModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">

            {saleResult ? (
              /* ---- Success state ---- */
              <div className="p-6 flex flex-col gap-5 text-center">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <BadgeCheck className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Sale Complete!</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Ownership of <span className="font-semibold">{listing.year} {listing.make} {listing.model}</span> has been
                    transferred to <span className="font-semibold">{saleResult.buyerName}</span> on the blockchain.
                  </p>
                </div>

                {saleResult.fabricTxId && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-left">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Blockchain Transaction ID</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-700 truncate flex-1" title={saleResult.fabricTxId}>
                        {truncateTxId(saleResult.fabricTxId, 24)}
                      </span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(saleResult.fabricTxId); toast.success("TX ID copied"); }}
                        className="p-1 text-gray-400 hover:text-gray-700 flex-shrink-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSaleModal(false)}
                  className="btn-primary w-full"
                >
                  Done
                </button>
              </div>
            ) : (
              /* ---- Form state ---- */
              <>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900">Complete Sale</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{listing.year} {listing.make} {listing.model}</p>
                  </div>
                  <button
                    onClick={() => setSaleModal(false)}
                    disabled={completeSaleMutation.isPending}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCompleteSale} className="p-5 flex flex-col gap-4">
                  {/* Warning */}
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      This will permanently transfer blockchain ownership to the buyer. This action cannot be undone.
                    </p>
                  </div>

                  {/* Buyer identifier */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Buyer's Username or Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-base"
                      placeholder="e.g. johndoe or john@example.com"
                      value={saleForm.buyerIdentifier}
                      onChange={(e) => setSaleForm((f) => ({ ...f, buyerIdentifier: e.target.value }))}
                      required
                      autoFocus
                    />
                    <p className="text-xs text-gray-400">
                      The buyer must be a registered CarChain user. Their name will be fetched automatically.
                    </p>
                  </div>

                  {/* Sale price */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Final Sale Price (PKR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-base"
                      type="number"
                      min={1}
                      placeholder="e.g. 2500000"
                      value={saleForm.salePrice}
                      onChange={(e) => setSaleForm((f) => ({ ...f, salePrice: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setSaleModal(false)}
                      disabled={completeSaleMutation.isPending}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={completeSaleMutation.isPending}
                      className="btn-primary flex-1"
                    >
                      <BadgeCheck className="h-4 w-4" />
                      {completeSaleMutation.isPending ? "Processing…" : "Confirm Sale"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Auth modal — shown to guests who click Contact / Message */}
      {authModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setAuthModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            {/* Close */}
            <div className="flex items-start justify-between gap-3">
              <div className="h-11 w-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-brand-600" />
              </div>
              <button
                onClick={() => setAuthModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors ml-auto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">Sign in to contact the seller</h3>
              <p className="text-sm text-gray-500 mt-1">
                You need an account to view seller contact details and send messages.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                to="/login"
                state={{ from: { pathname: window.location.pathname } }}
                className="btn-primary w-full text-center"
                onClick={() => setAuthModal(false)}
              >
                <LogIn className="h-4 w-4" /> Log In
              </Link>
              <Link
                to="/register"
                state={{ from: { pathname: window.location.pathname } }}
                className="btn-secondary w-full text-center"
                onClick={() => setAuthModal(false)}
              >
                <UserPlus className="h-4 w-4" /> Create Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
