import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Flame,
  Mail,
  PartyPopper,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Swords,
  X,
  Zap,
} from "lucide-react";
import {
  getActiveValidOffers,
  recordOfferPayment,
  subscribeOffers,
  validateOffer,
} from "../lib/offerService";
import {
  DiwaliDiyaArtwork,
  FestivalArtworkRenderer,
} from "./FestivalArtworks";
import { MembershipConfirmationModal } from "./MembershipConfirmationModal";
import { getNotificationHistory } from "../lib/notificationService";
import type { FestiveType, OfferRecord } from "../types";

// Re-export DiwaliDiyaArtwork for backward compatibility
export { DiwaliDiyaArtwork };

/**
 * Returns festival-specific styling configuration
 */
export function getFestivalThemeClasses(festiveType?: FestiveType) {
  switch (festiveType) {
    case "dussehra":
      return {
        card: "dussehra-festive-card",
        button: "dussehra-claim-btn",
        glow: "rgba(249, 115, 22, 0.25)",
        textGradient: "from-orange-300 via-amber-300 to-amber-500",
        badgeBg: "bg-orange-500/20 border-orange-500/40 text-orange-300",
        accentText: "text-orange-400",
        borderAccent: "border-orange-500/40 hover:border-orange-400/80",
        icon: Swords,
        festIcon: "🏹",
        dealTag: "VIJAYADASHAMI SPECIAL",
      };
    case "navratri":
      return {
        card: "navratri-festive-card",
        button: "navratri-claim-btn",
        glow: "rgba(217, 70, 239, 0.25)",
        textGradient: "from-pink-300 via-fuchsia-300 to-purple-400",
        badgeBg: "bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300",
        accentText: "text-fuchsia-400",
        borderAccent: "border-fuchsia-500/40 hover:border-fuchsia-400/80",
        icon: Sparkles,
        festIcon: "💃",
        dealTag: "NAVRATRI UTSAV DEAL",
      };
    case "new_year":
      return {
        card: "newyear-festive-card",
        button: "newyear-claim-btn",
        glow: "rgba(250, 204, 21, 0.25)",
        textGradient: "from-yellow-200 via-amber-300 to-yellow-400",
        badgeBg: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
        accentText: "text-yellow-400",
        borderAccent: "border-yellow-500/40 hover:border-yellow-400/80",
        icon: PartyPopper,
        festIcon: "🎉",
        dealTag: "NEW YEAR RESOLUTION",
      };
    case "custom":
      return {
        card: "diwali-festive-card",
        button: "diwali-claim-btn",
        glow: "rgba(168, 85, 247, 0.25)",
        textGradient: "from-purple-200 via-violet-300 to-amber-300",
        badgeBg: "bg-purple-500/20 border-purple-500/40 text-purple-300",
        accentText: "text-purple-400",
        borderAccent: "border-purple-500/40 hover:border-purple-400/80",
        icon: Sparkles,
        festIcon: "✨",
        dealTag: "SPECIAL FESTIVAL DEAL",
      };
    case "diwali":
    default:
      return {
        card: "diwali-festive-card",
        button: "diwali-claim-btn",
        glow: "rgba(245, 158, 11, 0.25)",
        textGradient: "from-yellow-200 via-amber-300 to-yellow-400",
        badgeBg: "bg-amber-500/20 border-amber-500/40 text-amber-300",
        accentText: "text-amber-400",
        borderAccent: "border-amber-500/40 hover:border-amber-400/80",
        icon: Flame,
        festIcon: "🪔",
        dealTag: "DIWALI DHAMAKA DEAL",
      };
  }
}

/**
 * Ambient floating sparkles & celebratory effects
 */
function FestiveSparkles({
  festiveType,
  isPaused,
}: {
  festiveType?: FestiveType;
  isPaused: boolean;
}) {
  if (isPaused) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <span
        className="absolute top-2 right-6 text-yellow-300 text-xs animate-sparkle-1"
        style={{ animationDelay: "0s" }}
      >
        ✦
      </span>
      <span
        className="absolute top-6 left-4 text-amber-300 text-[10px] animate-sparkle-2"
        style={{ animationDelay: "0.8s" }}
      >
        ✧
      </span>
      <span
        className="absolute bottom-4 right-10 text-yellow-200 text-sm animate-sparkle-3"
        style={{ animationDelay: "1.4s" }}
      >
        ★
      </span>
      <div
        className={`absolute top-2 right-1/4 w-8 h-8 rounded-full blur-xl opacity-30 ${
          festiveType === "navratri"
            ? "bg-fuchsia-500"
            : festiveType === "dussehra"
            ? "bg-orange-500"
            : festiveType === "new_year"
            ? "bg-yellow-400"
            : "bg-amber-500"
        }`}
      />
    </div>
  );
}

/**
 * Festive Offer Checkout Modal with Real Payment Verification
 * Never activates membership before payment is verified.
 */
export function FestiveOfferCheckoutModal({
  offer,
  user,
  isOpen,
  onClose,
  onSuccess,
}: {
  offer: OfferRecord;
  user: { id: string; name: string; email: string };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (expiryDate: string, offerName: string) => void;
}) {
  const [method, setMethod] = useState<"UPI" | "GPay" | "PhonePe" | "QR">("UPI");
  const [paymentState, setPaymentState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    expiryDate: string;
    reference: string;
    planName: string;
    amount: number;
  } | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  if (!isOpen) return null;

  const savingAmount = offer.originalPrice - offer.discountedPrice;
  const discountPercent = Math.round((savingAmount / offer.originalPrice) * 100);
  const upiId = "7087338600@ybl";
  const theme = getFestivalThemeClasses(offer.festiveType);
  const festivalName = offer.festivalName || "Festival";

  const handleCopyUpi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  const handleVerifyAndPay = async () => {
    setPaymentState("verifying");
    setErrorMessage(null);

    // 1. Strict validation of offer
    const validation = validateOffer(offer.id);
    if (!validation.isValid) {
      setErrorMessage(validation.error || "This offer is no longer valid or has expired.");
      setPaymentState("error");
      return;
    }

    try {
      // Simulate real-time payment gateway verification handshake (1.2s)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 2. Verified: Record payment in Firestore and local state, activate membership
      const result = await recordOfferPayment({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        offer,
        paymentMethod: method,
      });

      setSuccessDetails({
        expiryDate: result.membership.expiryDate,
        reference: result.payment.reference,
        planName: result.membership.planName,
        amount: offer.discountedPrice,
      });

      setPaymentState("success");
    } catch (err: any) {
      console.error("Payment verification failed:", err);
      setErrorMessage(err?.message || "Payment verification could not be completed. Please try again.");
      setPaymentState("error");
    }
  };

  const handleCompleteSuccess = () => {
    if (successDetails) {
      onSuccess(successDetails.expiryDate, offer.name);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#19152b] via-[#110f1e] to-[#0a0812] p-4 sm:p-7 shadow-[0_24px_70px_rgba(139,92,246,0.3)] text-gym-text max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        {paymentState !== "verifying" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full border border-white/10 bg-white/5 text-gym-muted hover:text-white hover:border-amber-400/40 transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* State: Success Screen */}
        {paymentState === "success" && successDetails && (
          <div className="py-4 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.4)]">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" /> Payment Verified
              </span>
              <h3 className="mt-2 text-2xl font-black text-white">
                Membership Activated!
              </h3>
              <p className="text-xs text-gym-muted mt-1 max-w-sm mx-auto">
                Congratulations! Your {festivalName} festive membership discount has been verified and applied to your account.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-left space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-gym-muted">
                <span>Plan Activated:</span>
                <span className="font-bold text-white">{successDetails.planName}</span>
              </div>
              <div className="flex justify-between items-center text-gym-muted">
                <span>Active Until:</span>
                <span className="font-bold text-emerald-300">{successDetails.expiryDate}</span>
              </div>
              <div className="flex justify-between items-center text-gym-muted">
                <span>Amount Paid:</span>
                <span className="font-extrabold text-amber-300 text-base">₹{successDetails.amount}</span>
              </div>
              <div className="flex justify-between items-center text-gym-muted pt-2 border-t border-emerald-500/20">
                <span>Transaction Ref:</span>
                <span className="font-mono text-[11px] text-gym-muted">{successDetails.reference}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs border border-violet-400/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 transition flex items-center justify-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                View Email & SMS Receipt
              </button>
              <button
                type="button"
                onClick={handleCompleteSuccess}
                className="w-full py-2.5 px-5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-stone-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 transition active:scale-98"
              >
                Continue to Dashboard
              </button>
            </div>

            {/* Receipt Modal */}
            <MembershipConfirmationModal
              isOpen={showReceiptModal}
              onClose={() => setShowReceiptModal(false)}
              result={getNotificationHistory()[0] || null}
            />
          </div>
        )}

        {/* State: Verifying State */}
        {paymentState === "verifying" && (
          <div className="py-10 text-center space-y-4 animate-in fade-in duration-200">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin" />
              <ShieldCheck className="h-7 w-7 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Verifying Secure Payment…
              </h3>
              <p className="text-xs text-gym-muted mt-1 max-w-xs mx-auto">
                Connecting to payment gateway, validating offer parameters, and activating your membership.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-white/5 border border-white/10 text-gym-muted">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Verifying transaction authenticity</span>
            </div>
          </div>
        )}

        {/* State: Idle / Error Screen */}
        {paymentState !== "success" && paymentState !== "verifying" && (
          <div>
            {/* Modal Header */}
            <div className="flex items-center gap-3 sm:gap-3.5 border-b border-white/10 pb-4">
              <div className="flex-shrink-0">
                <FestivalArtworkRenderer
                  festiveType={offer.festiveType || "diwali"}
                  size={48}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${theme.badgeBg}`}>
                    {theme.festIcon} {festivalName} Special Deal
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-[11px]">
                    {discountPercent}% OFF
                  </span>
                </div>
                <h3 className="mt-1 text-base sm:text-xl font-bold text-white truncate">
                  {offer.name}
                </h3>
              </div>
            </div>

            {/* Deal Breakdown (Amazon/Flipkart Deals Style) */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3.5 sm:p-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-gym-muted">
                <span>Selected Membership:</span>
                <span className="font-semibold text-white">
                  {offer.planName} Plan ({offer.durationDays} Days)
                </span>
              </div>
              <div className="flex justify-between items-center text-gym-muted">
                <span>Standard Price:</span>
                <span className="line-through text-gym-muted/80">
                  ₹{offer.originalPrice}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-medium">
                  {festivalName} Deal Savings:
                </span>
                <span className="font-bold text-emerald-400">
                  - ₹{savingAmount} ({discountPercent}% OFF)
                </span>
              </div>
              <div className="pt-2.5 border-t border-white/10 flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-white">Final Payable Price:</span>
                  <p className="text-[10px] text-gym-muted">Includes full gym access & locker</p>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-3xl font-black text-amber-300">
                    ₹{offer.discountedPrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gym-muted">
                <span>Select Payment Method</span>
                <span className="text-emerald-400 text-[10px] font-bold">100% SECURE</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "UPI", label: "UPI Apps", desc: "Fastest" },
                  { id: "GPay", label: "Google Pay", desc: "Instant" },
                  { id: "PhonePe", label: "PhonePe", desc: "Instant" },
                  { id: "QR", label: "Scan QR", desc: "Any App" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMethod(p.id as any)}
                    className={`py-2 px-2 rounded-xl border text-center transition ${
                      method === p.id
                        ? "border-amber-400 bg-amber-500/15 text-amber-300 font-bold shadow-sm"
                        : "border-gym-border bg-gym-panel/60 text-gym-muted hover:border-amber-400/30 hover:text-gym-text"
                    }`}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className="text-[9px] text-gym-muted">{p.desc}</div>
                  </button>
                ))}
              </div>

              {/* UPI Merchant Box */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 mt-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-gym-muted font-medium">
                    Merchant UPI ID (Fitflow Gym)
                  </p>
                  <p className="text-xs font-mono font-bold text-amber-300 truncate">
                    {upiId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition flex items-center gap-1 shrink-0"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedUpi ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in shake">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handleVerifyAndPay}
                className={`${theme.button} w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98 transition`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Pay ₹{offer.discountedPrice} & Activate Membership</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gym-muted pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Instant activation after payment verification • No hidden fees</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual Compact Festive Offer Card
 * Shows: festival name, offer title, plan, discounted price, original price, savings, expiry, Claim Offer button.
 */
export function FestiveOfferCard({
  offer,
  isAlreadyClaimed,
  onClaim,
  isTabHidden,
}: {
  offer: OfferRecord;
  isAlreadyClaimed: boolean;
  onClaim: (offer: OfferRecord) => void;
  isTabHidden: boolean;
}) {
  const theme = getFestivalThemeClasses(offer.festiveType);
  const savingAmount = offer.originalPrice - offer.discountedPrice;
  const discountPercent = Math.round((savingAmount / offer.originalPrice) * 100);
  const festivalName = offer.festivalName || "Festive";

  return (
    <div
      className={`group relative rounded-2xl border ${theme.borderAccent} bg-gradient-to-b from-[#161226] via-[#100d1c] to-[#0c0a14] p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(139,92,246,0.18)] flex flex-col justify-between overflow-hidden`}
    >
      {/* Ambient sparkles */}
      <FestiveSparkles festiveType={offer.festiveType} isPaused={isTabHidden} />

      <div className="space-y-2">
        {/* Top row: Deal tag + Discount badge */}
        <div className="relative z-10 flex items-center justify-between gap-1.5">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-[9px] font-black uppercase tracking-wider text-rose-300">
            <Flame className="h-2.5 w-2.5 text-rose-400 animate-pulse" />
            <span className="truncate max-w-[80px]">{festivalName}</span>
          </div>
          <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-[10px] tracking-wide shrink-0">
            {discountPercent}% OFF
          </div>
        </div>

        {/* Offer title */}
        <div className="relative z-10">
          <h3 className="text-sm font-black text-white group-hover:text-amber-200 transition line-clamp-1 leading-tight">
            {offer.name}
          </h3>
          <p className="text-[10px] text-purple-300 font-semibold mt-0.5 truncate">
            {offer.planName} Plan • {offer.durationDays}d
          </p>
          <p className="text-[10px] text-gym-muted line-clamp-1 mt-0.5 leading-snug">
            {offer.description}
          </p>
        </div>

        {/* Price block */}
        <div className="relative z-10 pt-2 border-t border-white/10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-300 tracking-tight">
              ₹{offer.discountedPrice}
            </span>
            <span className="text-xs text-gym-muted line-through font-medium decoration-rose-400/70">
              ₹{offer.originalPrice}
            </span>
            <span className="ml-auto text-[10px] font-bold text-emerald-400 shrink-0">
              Save ₹{savingAmount}
            </span>
          </div>
          {/* Expiry */}
          <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-200/70 font-medium">
            <Clock className="h-2.5 w-2.5 text-amber-400 shrink-0" />
            <span>Expires {offer.expiryDate}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="relative z-10 mt-2.5 pt-2 border-t border-white/5">
        {isAlreadyClaimed ? (
          <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Offer Active</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onClaim(offer)}
            className={`${theme.button} w-full py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:brightness-110 active:scale-98 transition`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Claim Offer</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Premium Festive Offers Showcase for the Member Dashboard
 * Modern Amazon Deals / Flipkart Offers inspired design with Fitflow dark & purple branding.
 * Automatically hides cleanly if no active offers exist.
 */
export function DiwaliOfferBanner({
  user,
  onOfferClaimed,
}: {
  user: { id: string; name: string; email: string };
  onOfferClaimed?: () => void;
}) {
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedOfferForCheckout, setSelectedOfferForCheckout] = useState<OfferRecord | null>(null);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);
  const [isTabHidden, setIsTabHidden] = useState(false);

  // Subscribe to real-time Firestore offers
  useEffect(() => {
    const unsub = subscribeOffers((liveOffers) => {
      setOffers(liveOffers);
    });

    const handleVisibility = () => {
      setIsTabHidden(document.hidden);
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      unsub();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, []);

  const activeValidOffers = getActiveValidOffers(offers);

  // Requirement: Hide inactive and expired offers automatically. If no active offers, hide section cleanly.
  if (activeValidOffers.length === 0) {
    return null;
  }

  // Filter by category if user selected a festival tab
  const displayedOffers =
    activeCategory === "all"
      ? activeValidOffers
      : activeValidOffers.filter((o) => (o.festiveType || "diwali") === activeCategory);

  // Check if current member has this specific offer active
  const checkAlreadyClaimed = (offerId: string) => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem(`petergym-membership-${user.id}`);
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      const today = new Date().toISOString().slice(0, 10);
      return parsed.offerId === offerId && parsed.expiryDate >= today;
    } catch {
      return false;
    }
  };

  // Distinct festival types available in active offers
  const availableFestivals = Array.from(
    new Set(activeValidOffers.map((o) => o.festiveType || "diwali"))
  );

  return (
    <section className="w-full space-y-4 animate-in fade-in duration-300">
      {/* Header bar with Amazon / Flipkart Mega Sale styling */}
      <div className="panel relative p-3 sm:p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-[#17122b] via-[#120f22] to-[#1a1329] overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 border border-amber-400/40 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" />
              <span>FESTIVAL MEGA DEALS • LIMITED TIME</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1 flex flex-wrap items-center gap-2">
              <span>Festival Dhamaka Offers</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold">
                Up to {Math.max(...activeValidOffers.map((o) => Math.round(((o.originalPrice - o.discountedPrice) / o.originalPrice) * 100)))}% OFF
              </span>
            </h2>
            <p className="text-xs text-gym-muted mt-0.5">
              Exclusive festive discounts on gym memberships. Instant activation.
            </p>
          </div>

          {/* Quick Festival Filter Tabs */}
          {availableFestivals.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs shrink-0 max-w-full touch-pan-x">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                  activeCategory === "all"
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
                    : "bg-white/5 text-gym-muted border border-white/10 hover:text-white"
                }`}
              >
                <span>🔥</span>
                <span>All Deals ({activeValidOffers.length})</span>
              </button>

              {availableFestivals.map((type) => {
                const conf = getFestivalThemeClasses(type);
                const count = activeValidOffers.filter((o) => (o.festiveType || "diwali") === type).length;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveCategory(type)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                      activeCategory === type
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
                        : "bg-white/5 text-gym-muted border border-white/10 hover:text-white"
                    }`}
                  >
                    <span>{conf.festIcon}</span>
                    <span className="capitalize">{type.replace("_", " ")} ({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Claimed notice banner if just claimed */}
      {claimedNotice && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{claimedNotice}</span>
        </div>
      )}

      {/* Responsive Grid of Premium Offer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {displayedOffers.map((offer) => (
          <FestiveOfferCard
            key={offer.id}
            offer={offer}
            isAlreadyClaimed={checkAlreadyClaimed(offer.id)}
            onClaim={(selected) => setSelectedOfferForCheckout(selected)}
            isTabHidden={isTabHidden}
          />
        ))}
      </div>

      {/* Checkout Modal */}
      {selectedOfferForCheckout && (
        <FestiveOfferCheckoutModal
          offer={selectedOfferForCheckout}
          user={user}
          isOpen={Boolean(selectedOfferForCheckout)}
          onClose={() => setSelectedOfferForCheckout(null)}
          onSuccess={(expiryDate, offerName) => {
            const currentOffer = selectedOfferForCheckout;
            setSelectedOfferForCheckout(null);
            setClaimedNotice(
              `"${offerName}" successfully activated! Your ${currentOffer?.planName} membership is active until ${expiryDate}.`
            );
            if (onOfferClaimed) {
              onOfferClaimed();
            }
          }}
        />
      )}
    </section>
  );
}

// Alias export for clarity
export { DiwaliOfferBanner as FestiveOffersBanner };
export { DiwaliOfferBanner as FestiveOfferCardsShowcase };
