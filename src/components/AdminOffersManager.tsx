import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Eye,
  EyeOff,
  Flame,
  Filter,
  PartyPopper,
  Plus,
  RotateCcw,
  Sparkles,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import {
  createOffer,
  deleteOffer,
  scheduleNewYearOffer,
  seedFestivalOffersToFirestore,
  subscribeOffers,
  toggleOfferStatus,
  updateOffer,
} from "../lib/offerService";
import { DiwaliOfferBanner } from "./DiwaliOfferBanner";
import { FestivalArtworkRenderer } from "./FestivalArtworks";
import type { FestiveType, OfferRecord, OfferStatus } from "../types";

export function AdminOffersManager() {
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [editingOffer, setEditingOffer] = useState<OfferRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSchedulingNewYear, setIsSchedulingNewYear] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFestivalFilter, setSelectedFestivalFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    festivalName: "Diwali",
    festiveType: "diwali" as FestiveType,
    name: "",
    description: "",
    imageUrl: "",
    originalPrice: 600,
    discountedPrice: 400,
    planId: "monthly",
    planName: "Monthly",
    durationDays: 30,
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    status: "Active" as OfferStatus,
    badge: "Diwali Special",
    code: "DIWALI400",
  });

  // New Year Scheduler Form fields
  const [nyScheduleData, setNyScheduleData] = useState({
    year: new Date().getFullYear() + 1,
    discountedPrice: 4800,
    expiryDate: `${new Date().getFullYear() + 1}-01-31`,
    status: "Active" as OfferStatus,
  });

  useEffect(() => {
    const unsub = subscribeOffers((liveOffers) => {
      setOffers(liveOffers);
    });
    return () => unsub();
  }, []);

  const openCreateModal = (festivalType: FestiveType = "diwali") => {
    setEditingOffer(null);

    let defaultName = "Diwali Fitness Celebration";
    let defaultDesc =
      "Celebrate the festival of lights with peak health! Special limited-time discount on Monthly Gym Membership with full access to all facilities.";
    let defaultFestName = "Diwali";
    let defaultOrig = 600;
    let defaultDisc = 400;
    let defaultPlan = "monthly";
    let defaultPlanName = "Monthly";
    let defaultDays = 30;
    let defaultBadge = "Diwali Mega Deal • Save ₹200";
    let defaultCode = "DIWALI400";

    if (festivalType === "dussehra") {
      defaultName = "Vijayadashami Warrior Pass";
      defaultDesc =
        "Victory of strength and discipline! Conquer your fitness goals with our celebratory Dussehra monthly access pass.";
      defaultFestName = "Dussehra";
      defaultOrig = 600;
      defaultDisc = 450;
      defaultBadge = "Dussehra Special • Save ₹150";
      defaultCode = "VIJAYA450";
    } else if (festivalType === "navratri") {
      defaultName = "Navratri 9-Nights Energy Pass";
      defaultDesc =
        "Nine nights of rhythm, stamina, and divine energy! Fuel your cardio and stamina with our festive workout pass.";
      defaultFestName = "Navratri";
      defaultOrig = 600;
      defaultDisc = 399;
      defaultBadge = "Navratri Utsav • Save ₹201";
      defaultCode = "GARBA399";
    } else if (festivalType === "new_year") {
      defaultName = `New Year ${new Date().getFullYear() + 1} Fitness Resolution`;
      defaultDesc =
        "Transform your life in the new year! Complete 12-month Annual Membership with priority coaching and progress checks.";
      defaultFestName = "New Year";
      defaultOrig = 6000;
      defaultDisc = 4800;
      defaultPlan = "annual";
      defaultPlanName = "Annual";
      defaultDays = 365;
      defaultBadge = `New Year Early Bird • Save ₹1,200`;
      defaultCode = `NEWYEAR${String(new Date().getFullYear() + 1).slice(-2)}`;
    } else if (festivalType === "custom") {
      defaultName = "Special Festival Pass";
      defaultDesc =
        "Exclusive celebratory offer on gym membership with premium coaching and complete gym access.";
      defaultFestName = "Festival";
      defaultOrig = 600;
      defaultDisc = 420;
      defaultPlan = "monthly";
      defaultPlanName = "Monthly";
      defaultDays = 30;
      defaultBadge = "Special Deal • Save ₹180";
      defaultCode = "FESTIVE420";
    }

    setFormData({
      festivalName: defaultFestName,
      festiveType: festivalType,
      name: defaultName,
      description: defaultDesc,
      imageUrl: "",
      originalPrice: defaultOrig,
      discountedPrice: defaultDisc,
      planId: defaultPlan,
      planName: defaultPlanName,
      durationDays: defaultDays,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      status: "Active",
      badge: defaultBadge,
      code: defaultCode,
    });
    setIsCreating(true);
  };

  const openEditModal = (offer: OfferRecord) => {
    setEditingOffer(offer);
    setFormData({
      festivalName: offer.festivalName || "Special Festival",
      festiveType: offer.festiveType || "diwali",
      name: offer.name,
      description: offer.description,
      imageUrl: offer.imageUrl || "",
      originalPrice: offer.originalPrice,
      discountedPrice: offer.discountedPrice,
      planId: offer.planId,
      planName: offer.planName,
      durationDays: offer.durationDays,
      startDate: offer.startDate,
      expiryDate: offer.expiryDate,
      status: offer.status,
      badge: offer.badge || "",
      code: offer.code || "",
    });
    setIsCreating(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.discountedPrice >= formData.originalPrice) {
      setStatusMessage({
        type: "error",
        text: "Discounted price must be strictly less than original price.",
      });
      return;
    }
    if (formData.startDate > formData.expiryDate) {
      setStatusMessage({
        type: "error",
        text: "Start date cannot be after expiry date.",
      });
      return;
    }

    try {
      if (editingOffer) {
        await updateOffer(editingOffer.id, formData);
        setStatusMessage({
          type: "success",
          text: `Offer "${formData.name}" updated successfully in Firestore!`,
        });
      } else {
        await createOffer(formData);
        setStatusMessage({
          type: "success",
          text: `Offer "${formData.name}" published to Firestore in real time!`,
        });
      }
      setIsCreating(false);
      setEditingOffer(null);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("Save offer error:", err);
      setStatusMessage({
        type: "error",
        text: "Could not save offer. Please check your network and Firestore permissions.",
      });
    }
  };

  const handleScheduleNewYear = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const year = nyScheduleData.year;
      const startDate = `${year}-01-01`;
      const expiryDate = nyScheduleData.expiryDate;

      if (startDate > expiryDate) {
        setStatusMessage({
          type: "error",
          text: "Expiry date must be on or after January 1st.",
        });
        return;
      }

      await createOffer(
        {
          festivalName: "New Year",
          festiveType: "new_year",
          name: `New Year ${year} Fitness Resolution`,
          description: `Transform your body and mind in ${year}! Full 12-month Annual Membership with complete access and guidance.`,
          originalPrice: 6000,
          discountedPrice: nyScheduleData.discountedPrice,
          planId: "annual",
          planName: "Annual",
          durationDays: 365,
          startDate,
          expiryDate,
          status: nyScheduleData.status,
          badge: `New Year ${year} Special`,
          code: `NY${year}`,
        },
        `newyear-offer-${year}`
      );

      setStatusMessage({
        type: "success",
        text: `New Year ${year} offer scheduled from Jan 1, ${year} to ${expiryDate}!`,
      });
      setIsSchedulingNewYear(false);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("Schedule New Year error:", err);
      setStatusMessage({
        type: "error",
        text: "Failed to schedule New Year offer.",
      });
    }
  };

  const handleToggle = async (offer: OfferRecord) => {
    const nextStatus: OfferStatus =
      offer.status === "Active" ? "Inactive" : "Active";
    await toggleOfferStatus(offer.id, nextStatus);
    setStatusMessage({
      type: "success",
      text: `Offer "${offer.name}" is now ${nextStatus}. Changes synced to User Dashboard.`,
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDelete = async (offer: OfferRecord) => {
    if (
      window.confirm(
        `Are you sure you want to delete the offer "${offer.name}"? This will permanently remove it from Firestore and User Dashboard.`
      )
    ) {
      await deleteOffer(offer.id);
      setStatusMessage({
        type: "success",
        text: `Offer "${offer.name}" was deleted.`,
      });
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleResetTemplates = async () => {
    if (
      window.confirm(
        "Load or restore default festive offers (Diwali, Dussehra, Navratri, New Year) to Firestore?"
      )
    ) {
      try {
        await seedFestivalOffersToFirestore();
        setStatusMessage({
          type: "success",
          text: "Standard festive offers loaded into Firestore successfully!",
        });
        setTimeout(() => setStatusMessage(null), 4000);
      } catch (err) {
        console.error("Seed error:", err);
        setStatusMessage({
          type: "error",
          text: "Failed to load templates into Firestore.",
        });
      }
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  // Filtered offers list for admin view
  const filteredOffers = offers.filter((offer) => {
    if (selectedFestivalFilter !== "all") {
      if ((offer.festiveType || "diwali") !== selectedFestivalFilter) return false;
    }
    if (selectedStatusFilter === "active") {
      if (offer.status !== "Active" || offer.expiryDate < today || (offer.startDate && offer.startDate > today)) {
        return false;
      }
    } else if (selectedStatusFilter === "inactive") {
      if (offer.status === "Active") return false;
    } else if (selectedStatusFilter === "expired") {
      if (offer.expiryDate >= today) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-xs font-bold text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Admin Festival Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gym-text mt-1.5">
            Festive Offers Management
          </h2>
          <p className="text-xs sm:text-sm text-gym-muted">
            Manage Diwali, Dussehra, Navratri, New Year, and custom festival offers with real-time Firestore synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Restore / Seed Templates Button */}
          <button
            type="button"
            onClick={handleResetTemplates}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 text-gym-muted hover:text-white"
            title="Load default festival offers into Firestore"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore Templates</span>
          </button>

          {/* Schedule Jan 1 New Year Quick Action */}
          <button
            type="button"
            onClick={() => setIsSchedulingNewYear(true)}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 border-amber-400/40 text-amber-300 hover:bg-amber-500/15"
          >
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>Schedule New Year (Jan 1)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Hide Member View
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Live Member Preview
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => openCreateModal("diwali")}
            className="diwali-claim-btn text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Create Offer</span>
          </button>
        </div>
      </div>

      {/* Festival Quick-Create Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-gym-muted font-bold flex-shrink-0">
          Quick Create:
        </span>
        <button
          type="button"
          onClick={() => openCreateModal("diwali")}
          className="px-3 py-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-300 font-bold hover:bg-amber-500/20 transition flex items-center gap-1.5 shrink-0"
        >
          <span>🪔</span> Diwali Offer
        </button>
        <button
          type="button"
          onClick={() => openCreateModal("dussehra")}
          className="px-3 py-1.5 rounded-full border border-orange-400/40 bg-orange-500/10 text-orange-300 font-bold hover:bg-orange-500/20 transition flex items-center gap-1.5 shrink-0"
        >
          <span>🏹</span> Dussehra Offer
        </button>
        <button
          type="button"
          onClick={() => openCreateModal("navratri")}
          className="px-3 py-1.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-300 font-bold hover:bg-fuchsia-500/20 transition flex items-center gap-1.5 shrink-0"
        >
          <span>💃</span> Navratri Offer
        </button>
        <button
          type="button"
          onClick={() => openCreateModal("new_year")}
          className="px-3 py-1.5 rounded-full border border-yellow-400/40 bg-yellow-500/10 text-yellow-300 font-bold hover:bg-yellow-500/20 transition flex items-center gap-1.5 shrink-0"
        >
          <span>🎉</span> New Year Resolution
        </button>
        <button
          type="button"
          onClick={() => openCreateModal("custom")}
          className="px-3 py-1.5 rounded-full border border-purple-400/40 bg-purple-500/10 text-purple-300 font-bold hover:bg-purple-500/20 transition flex items-center gap-1.5 shrink-0"
        >
          <span>✨</span> Custom Festival
        </button>
      </div>

      {/* Filter and stats row */}
      <div className="panel p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gym-muted" />
          <span className="font-semibold text-gym-text">Filter:</span>
          <select
            value={selectedFestivalFilter}
            onChange={(e) => setSelectedFestivalFilter(e.target.value)}
            className="input py-1 px-2.5 text-xs bg-gym-panel border-gym-border rounded-lg"
          >
            <option value="all">All Festivals</option>
            <option value="diwali">🪔 Diwali</option>
            <option value="dussehra">🏹 Dussehra</option>
            <option value="navratri">💃 Navratri</option>
            <option value="new_year">🎉 New Year</option>
            <option value="custom">✨ Custom</option>
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="input py-1 px-2.5 text-xs bg-gym-panel border-gym-border rounded-lg"
          >
            <option value="all">All Statuses ({offers.length})</option>
            <option value="active">Active & Live</option>
            <option value="inactive">Deactivated</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-gym-muted">
          <span>Total: <strong className="text-white">{offers.length}</strong></span>
          <span>•</span>
          <span>Live for Users: <strong className="text-emerald-400">{offers.filter((o) => o.status === "Active" && o.expiryDate >= today && (!o.startDate || o.startDate <= today)).length}</strong></span>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm border animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-gym-muted hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Live Preview Section */}
      {showPreview && (
        <div className="rounded-3xl border border-amber-500/30 bg-slate-950/70 p-4 sm:p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-amber-300 font-extrabold uppercase tracking-wider">
            <span>✨ Live Preview: Real-Time Member Dashboard View</span>
            <span className="text-[10px] text-gym-muted">Instant Firestore sync</span>
          </div>
          <DiwaliOfferBanner
            user={{
              id: "demo-admin",
              name: "Preview Member",
              email: "member@preview.com",
            }}
          />
        </div>
      )}

      {/* Offers Cards Grid */}
      {filteredOffers.length === 0 ? (
        <div className="panel p-10 text-center space-y-3 rounded-2xl border-dashed">
          <Sparkles className="h-10 w-10 text-gym-muted mx-auto opacity-50" />
          <h3 className="text-lg font-bold text-white">No Offers Found</h3>
          <p className="text-xs text-gym-muted max-w-sm mx-auto">
            No offers match your current filter. You can create a new festival offer or restore standard templates.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={handleResetTemplates}
              className="btn-secondary text-xs px-4 py-2"
            >
              Restore Templates
            </button>
            <button
              type="button"
              onClick={() => openCreateModal("diwali")}
              className="diwali-claim-btn text-xs font-bold px-4 py-2 rounded-xl"
            >
              Create First Offer
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => {
            const isExpired = offer.expiryDate < today;
            const isUpcoming = Boolean(offer.startDate && offer.startDate > today);
            const isCurrentlyActive =
              offer.status === "Active" && !isExpired && !isUpcoming;
            const saving = offer.originalPrice - offer.discountedPrice;
            const discountPercent = Math.round((saving / offer.originalPrice) * 100);

            return (
              <div
                key={offer.id}
                className={`panel relative p-5 flex flex-col justify-between transition-all rounded-2xl border ${
                  isCurrentlyActive
                    ? "border-amber-500/40 shadow-[0_4px_25px_rgba(245,158,11,0.14)]"
                    : "opacity-75 border-gym-border"
                }`}
              >
                <div>
                  {/* Top Header with Festive Miniature Artwork & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden">
                        <FestivalArtworkRenderer
                          festiveType={offer.festiveType || "diwali"}
                          size={32}
                        />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isCurrentlyActive
                            ? "bg-amber-500/15 border-amber-400/40 text-amber-300"
                            : isExpired
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            : isUpcoming
                            ? "bg-sky-500/10 border-sky-500/30 text-sky-300"
                            : "bg-slate-500/10 border-slate-500/30 text-slate-300"
                        }`}
                      >
                        {isCurrentlyActive
                          ? "Active & Live"
                          : isExpired
                          ? "Expired"
                          : isUpcoming
                          ? "Upcoming"
                          : "Deactivated"}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/40 text-[11px] font-black text-emerald-300">
                      {discountPercent}% OFF
                    </span>
                  </div>

                  {/* Festival Name & Offer Title */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90">
                      {offer.festivalName || "Special Festival"}
                    </span>
                    <h3 className="text-lg font-bold text-gym-text">
                      {offer.name}
                    </h3>
                  </div>

                  <p className="text-xs text-purple-300 font-semibold mt-0.5">
                    {offer.planName} Membership • {offer.durationDays} Days
                  </p>

                  {/* Price Display */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-300">
                      ₹{offer.discountedPrice}
                    </span>
                    <span className="text-sm text-gym-muted line-through font-medium">
                      ₹{offer.originalPrice}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">
                      (Save ₹{saving})
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gym-muted line-clamp-2 leading-relaxed">
                    {offer.description}
                  </p>

                  {/* Validity Dates */}
                  <div className="mt-4 pt-3 border-t border-gym-border/60 text-[11px] text-gym-muted space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Valid from:</span>
                      <span className="text-gym-text">{offer.startDate || "Immediate"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Valid until:</span>
                      <span
                        className={`font-semibold ${
                          isExpired ? "text-rose-400" : "text-amber-300"
                        }`}
                      >
                        {offer.expiryDate}
                      </span>
                    </div>
                    {offer.badge && (
                      <div className="flex items-center justify-between pt-1">
                        <span>Badge:</span>
                        <span className="text-gym-accent truncate max-w-[140px]">
                          {offer.badge}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t border-gym-border/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(offer)}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-bold transition ${
                      offer.status === "Active"
                        ? "border-amber-400/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                        : "border-gym-border bg-gym-panel text-gym-muted hover:text-white"
                    }`}
                  >
                    {offer.status === "Active" ? "Deactivate" : "Activate"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(offer)}
                    className="p-2 rounded-xl border border-gym-border bg-gym-panel text-gym-muted hover:text-gym-accent hover:border-gym-accent/40 transition"
                    title="Edit Offer"
                    aria-label="Edit Offer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(offer)}
                    className="p-2 rounded-xl border border-gym-border bg-gym-panel text-gym-muted hover:text-rose-400 hover:border-rose-400/40 transition"
                    title="Delete Offer"
                    aria-label="Delete Offer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule New Year Modal */}
      {isSchedulingNewYear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/40 bg-gym-card p-5 sm:p-6 shadow-2xl text-gym-text">
            <button
              onClick={() => setIsSchedulingNewYear(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full border border-gym-border text-gym-muted hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-gym-border pb-3">
              <Calendar className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">
                Schedule New Year Resolution Offer
              </h3>
            </div>

            <form onSubmit={handleScheduleNewYear} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                  Year
                </label>
                <input
                  type="number"
                  min={new Date().getFullYear()}
                  max={2035}
                  value={nyScheduleData.year}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setNyScheduleData({
                      ...nyScheduleData,
                      year: y,
                      expiryDate: `${y}-01-31`,
                    });
                  }}
                  className="input font-bold"
                  required
                />
                <p className="text-[11px] text-gym-muted mt-1">
                  Start Date automatically set to <strong>Jan 1, {nyScheduleData.year}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                  Annual Plan Discounted Price (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={nyScheduleData.discountedPrice}
                  onChange={(e) =>
                    setNyScheduleData({
                      ...nyScheduleData,
                      discountedPrice: Number(e.target.value),
                    })
                  }
                  className="input font-bold text-yellow-300"
                  required
                />
                <p className="text-[11px] text-emerald-400 mt-1">
                  Standard Annual: ₹6,000 • Savings: ₹{6000 - nyScheduleData.discountedPrice} (
                  {Math.round(((6000 - nyScheduleData.discountedPrice) / 6000) * 100)}% off)
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={nyScheduleData.expiryDate}
                  onChange={(e) =>
                    setNyScheduleData({
                      ...nyScheduleData,
                      expiryDate: e.target.value,
                    })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                  Offer Status
                </label>
                <select
                  value={nyScheduleData.status}
                  onChange={(e) =>
                    setNyScheduleData({
                      ...nyScheduleData,
                      status: e.target.value as OfferStatus,
                    })
                  }
                  className="input"
                >
                  <option value="Active">Active (Live when Jan 1 arrives)</option>
                  <option value="Inactive">Inactive (Draft)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gym-border">
                <button
                  type="button"
                  onClick={() => setIsSchedulingNewYear(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="newyear-claim-btn font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-gym-border bg-gym-card p-5 sm:p-6 shadow-2xl text-gym-text max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full border border-gym-border text-gym-muted hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-gym-border pb-3">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">
                {editingOffer ? "Edit Festival Offer" : "Create Festival Offer"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              {/* Festival Type & Name Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                    Festival Celebration
                  </label>
                  <select
                    value={formData.festiveType}
                    onChange={(e) => {
                      const t = e.target.value as FestiveType;
                      let festName = "Diwali";
                      if (t === "dussehra") festName = "Dussehra";
                      else if (t === "navratri") festName = "Navratri";
                      else if (t === "new_year") festName = "New Year";
                      else if (t === "custom") festName = "Special Festival";
                      setFormData({
                        ...formData,
                        festiveType: t,
                        festivalName: festName,
                      });
                    }}
                    className="input"
                  >
                    <option value="diwali">🪔 Diwali</option>
                    <option value="dussehra">🏹 Dussehra (Vijayadashami)</option>
                    <option value="navratri">💃 Navratri</option>
                    <option value="new_year">🎉 New Year</option>
                    <option value="custom">✨ Custom Festival</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                    Festival Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.festivalName}
                    onChange={(e) =>
                      setFormData({ ...formData, festivalName: e.target.value })
                    }
                    placeholder="e.g. Diwali, Dussehra, Navratri..."
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                  Offer Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Diwali Fitness Celebration"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                  Offer Description
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Briefly describe what members receive in this offer..."
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                    Regular Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.originalPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        originalPrice: Number(e.target.value),
                      })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-amber-400 mb-1 font-semibold">
                    Discounted Price (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.discountedPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountedPrice: Number(e.target.value),
                      })
                    }
                    className="input font-bold text-amber-300 border-amber-400/40"
                  />
                </div>
              </div>

              {/* Calculated Savings Pill */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/25 flex items-center justify-between text-xs">
                <span className="text-gym-muted">Calculated Member Savings:</span>
                <span className="font-bold text-emerald-400">
                  Save ₹
                  {Math.max(0, formData.originalPrice - formData.discountedPrice)}{" "}
                  (
                  {formData.originalPrice > 0
                    ? Math.round(
                        ((formData.originalPrice - formData.discountedPrice) /
                          formData.originalPrice) *
                          100
                      )
                    : 0}
                  % off)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                    Applicable Plan
                  </label>
                  <select
                    value={formData.planId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const name = id === "annual" ? "Annual" : "Monthly";
                      const days = id === "annual" ? 365 : 30;
                      setFormData({
                        ...formData,
                        planId: id,
                        planName: name,
                        durationDays: days,
                      });
                    }}
                    className="input"
                  >
                    <option value="monthly">Monthly Plan (30 Days)</option>
                    <option value="annual">Annual Plan (365 Days)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as OfferStatus,
                      })
                    }
                    className="input"
                  >
                    <option value="Active">Active (Visible to Users)</option>
                    <option value="Inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                    Badge Chip
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                    placeholder="e.g. Diwali Mega Deal"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                    Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="e.g. DIWALI400"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gym-muted mb-1 font-medium">
                  Custom Festive Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://... or leave blank for built-in SVG artwork"
                  className="input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gym-border">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="diwali-claim-btn font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{editingOffer ? "Update Offer" : "Publish Offer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
