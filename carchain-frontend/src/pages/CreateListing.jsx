import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { listingApi } from "../api/listing.api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import toast from "react-hot-toast";
import { Upload, X, ImagePlus, ArrowLeft, Info, Phone } from "lucide-react";

export default function CreateListing() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState({
    vehicleId: vehicleId || "",
    price: "",
    location: "",
    mileage: "",
    contactNumber: "",
    description: "",
  });
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const allCreatedUrls = useRef([]);

  useEffect(() => {
    return () => allCreatedUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleFiles(e) {
    const files = Array.from(e.target.files).slice(0, 5 - photos.length);
    setPhotos((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    allCreatedUrls.current.push(...urls);
    setPreviews((prev) => [...prev, ...urls]);
    e.target.value = "";
  }

  function removePhoto(i) {
    URL.revokeObjectURL(previews[i]);
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (Number(form.price) <= 0)         { toast.error("Enter a valid price"); return; }
    if (Number(form.mileage) < 0)        { toast.error("Enter a valid mileage"); return; }
    if (!form.contactNumber.trim())      { toast.error("Enter a contact number for buyers"); return; }
    setLoading(true);
    try {
      const { data } = await listingApi.create({
        ...form,
        price: Number(form.price),
        mileage: Number(form.mileage),
      });
      const createdVehicleId = data.data.vehicleId;

      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach((f) => fd.append("photos", f));
        await listingApi.uploadPhotos(createdVehicleId, fd);
      }

      toast.success("Listing published!");
      navigate(`/listings/${createdVehicleId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Marketplace Listing</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          List your blockchain-registered vehicle for sale. Add photos to attract more buyers.
        </p>
      </div>

      <div className="card p-6 shadow-card-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Vehicle ID — read-only from route */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Vehicle ID</label>
            <div className="input-base bg-gray-50 text-gray-600 cursor-default select-all font-mono text-xs">
              {form.vehicleId}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Linked to your blockchain-registered vehicle.
            </p>
          </div>

          {/* Price + Mileage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Input
                label="Asking Price (PKR)"
                type="number"
                placeholder="e.g. 2,500,000"
                value={form.price}
                onChange={update("price")}
                required
                min={1}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Input
                label="Mileage (km)"
                type="number"
                placeholder="e.g. 35,000"
                value={form.mileage}
                onChange={update("mileage")}
                required
                min={0}
              />
            </div>
          </div>

          {/* Location */}
          <Input
            label="Location"
            placeholder="e.g. Islamabad, Pakistan"
            value={form.location}
            onChange={update("location")}
            required
          />

          {/* Contact number */}
          <div className="flex flex-col gap-1">
            <Input
              label="Contact Number"
              type="tel"
              placeholder="e.g. +92 300 1234567"
              value={form.contactNumber}
              onChange={update("contactNumber")}
              required
            />
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              Shown only to logged-in users who view your listing.
            </p>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="input-base resize-none"
              rows={4}
              placeholder="Describe the vehicle condition, features, service history, extras…"
              value={form.description}
              onChange={update("description")}
            />
          </div>

          {/* Photo upload */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Photos</label>
              <span className="text-xs text-gray-400">{photos.length} / 5 added</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {previews.map((src, i) => (
                <div key={i} className="relative h-24 w-28 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                  <img src={src} className="w-full h-full object-cover" alt={`Photo ${i + 1}`} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-1 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="h-24 w-28 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs font-medium">Add photo</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">First photo will be the cover image. JPG, PNG, WebP accepted.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              <Upload className="h-4 w-4" /> Publish Listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
