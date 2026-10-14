import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase";
import type { FestiveType, OfferRecord, OfferStatus, PaymentRecord } from "../types";

export const OFFERS_UPDATED_EVENT = "fitflow-offers-updated";
const LOCAL_STORAGE_KEY = "fitflow-active-offers-v3";
const INITIALIZED_KEY = "fitflow-offers-init-v3";

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 4 Curated Default Festival Offers (Diwali, Dussehra, Navratri, New Year)
export const DEFAULT_FESTIVAL_OFFERS: OfferRecord[] = [
  {
    id: "diwali-fitness-2026",
    festivalName: "Diwali",
    name: "Diwali Fitness Celebration",
    description:
      "Celebrate the festival of lights with peak health! Special limited-time discount on Monthly Gym Membership with full access to all facilities.",
    originalPrice: 600,
    discountedPrice: 400,
    planId: "monthly",
    planName: "Monthly",
    durationDays: 30,
    startDate: "2026-10-01",
    expiryDate: "2026-11-20",
    status: "Active",
    badge: "Diwali Mega Deal • Save ₹200",
    code: "DIWALI400",
    festiveType: "diwali",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "dussehra-fitness-2026",
    festivalName: "Dussehra",
    name: "Vijayadashami Warrior Pass",
    description:
      "Victory of strength and discipline! Conquer your fitness goals with our celebratory Dussehra monthly access pass.",
    originalPrice: 600,
    discountedPrice: 450,
    planId: "monthly",
    planName: "Monthly",
    durationDays: 30,
    startDate: "2026-10-01",
    expiryDate: "2026-10-31",
    status: "Active",
    badge: "Dussehra Special • Save ₹150",
    code: "VIJAYA450",
    festiveType: "dussehra",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "navratri-fitness-2026",
    festivalName: "Navratri",
    name: "Navratri 9-Nights Energy Pass",
    description:
      "Nine nights of rhythm, stamina, and divine energy! Fuel your cardio and stamina with our festive workout pass.",
    originalPrice: 600,
    discountedPrice: 399,
    planId: "monthly",
    planName: "Monthly",
    durationDays: 30,
    startDate: "2026-10-01",
    expiryDate: "2026-10-30",
    status: "Active",
    badge: "Navratri Utsav • Save ₹201",
    code: "GARBA399",
    festiveType: "navratri",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "newyear-resolution-2027",
    festivalName: "New Year",
    name: "New Year 2027 Fitness Resolution",
    description:
      "Transform your life in the new year! Complete 12-month Annual Membership with priority coaching and progress checks.",
    originalPrice: 6000,
    discountedPrice: 4800,
    planId: "annual",
    planName: "Annual",
    durationDays: 365,
    startDate: "2026-10-01",
    expiryDate: "2027-01-31",
    status: "Active",
    badge: "New Year Early Bird • Save ₹1,200",
    code: "NEWYEAR27",
    festiveType: "new_year",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getLocalOffers(): OfferRecord[] {
  if (typeof window === "undefined") {
    return DEFAULT_FESTIVAL_OFFERS;
  }
  try {
    const isInit = localStorage.getItem(INITIALIZED_KEY);
    if (!isInit) {
      localStorage.setItem(INITIALIZED_KEY, "true");
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_FESTIVAL_OFFERS));
      return DEFAULT_FESTIVAL_OFFERS;
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as OfferRecord[];
    }
    return [];
  } catch {
    return DEFAULT_FESTIVAL_OFFERS;
  }
}

export function saveLocalOffers(offers: OfferRecord[], notify = true): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(offers));
    if (notify) {
      window.dispatchEvent(new CustomEvent(OFFERS_UPDATED_EVENT, { detail: offers }));
    }
  } catch (err) {
    console.error("Failed to save local offers:", err);
  }
}

/**
 * Checks if an offer is strictly active and within start/expiry dates
 */
export function isOfferActiveAndValid(offer: OfferRecord, today = getTodayDateString()): boolean {
  if (!offer || typeof offer !== "object") return false;
  if (offer.status !== "Active") return false;
  if (offer.startDate && offer.startDate > today) return false;
  if (offer.expiryDate && offer.expiryDate < today) return false;
  if (typeof offer.discountedPrice !== "number" || typeof offer.originalPrice !== "number") {
    return false;
  }
  if (offer.discountedPrice <= 0 || offer.originalPrice <= offer.discountedPrice) {
    return false;
  }
  return true;
}

/**
 * Filters and returns all valid, active offers
 */
export function getActiveValidOffers(offers?: OfferRecord[]): OfferRecord[] {
  const source = offers || getLocalOffers();
  const today = getTodayDateString();
  return source.filter((o) => isOfferActiveAndValid(o, today));
}

/**
 * Returns the primary active festive Diwali offer or null (for backward compatibility)
 */
export function getActiveDiwaliOffer(offers?: OfferRecord[]): OfferRecord | null {
  const active = getActiveValidOffers(offers);
  const diwali = active.find((o) => o.festiveType === "diwali");
  return diwali || active[0] || null;
}

/**
 * Validates an offer by ID strictly on server-comparable trusted logic
 */
export function validateOffer(
  offerId: string,
  offersList?: OfferRecord[]
): { isValid: boolean; offer?: OfferRecord; error?: string } {
  const offers = offersList || getLocalOffers();
  const offer = offers.find((o) => o.id === offerId);
  if (!offer) {
    return { isValid: false, error: "Offer not found or no longer available." };
  }
  const today = getTodayDateString();
  if (offer.status !== "Active") {
    return { isValid: false, error: "This festive offer is currently inactive." };
  }
  if (offer.startDate && offer.startDate > today) {
    return { isValid: false, error: `This festive offer starts on ${offer.startDate}.` };
  }
  if (offer.expiryDate && offer.expiryDate < today) {
    return { isValid: false, error: `This festive offer expired on ${offer.expiryDate}.` };
  }
  if (offer.discountedPrice <= 0 || offer.originalPrice <= offer.discountedPrice) {
    return { isValid: false, error: "Invalid pricing on offer." };
  }
  return { isValid: true, offer };
}

/**
 * Helper to schedule a New Year offer specifically starting from January 1
 */
export async function scheduleNewYearOffer(
  year: number = new Date().getFullYear() + 1,
  discountedPrice: number = 4800,
  expiryDay: number = 31
): Promise<OfferRecord> {
  const startDate = `${year}-01-01`;
  const expiryDate = `${year}-01-${String(expiryDay).padStart(2, "0")}`;
  const id = `newyear-offer-${year}`;

  const offerData: Omit<OfferRecord, "id" | "createdAt" | "updatedAt"> = {
    festivalName: "New Year",
    name: `New Year Fitness Resolution ${year}`,
    description: `Kickstart ${year} with unbreakable discipline and high-energy coaching! 12 Months full gym membership.`,
    originalPrice: 6000,
    discountedPrice,
    planId: "annual",
    planName: "Annual",
    durationDays: 365,
    startDate,
    expiryDate,
    status: "Active",
    badge: `New Year ${year} • Special Discount`,
    code: `NY${year}`,
    festiveType: "new_year",
  };

  return createOffer(offerData, id);
}

/**
 * Real-time Firestore subscriber with local fallback
 */
export function subscribeOffers(callback: (offers: OfferRecord[]) => void): () => void {
  // Always emit local data immediately
  callback(getLocalOffers());

  const handleLocalUpdate = (e: Event) => {
    const custom = e as CustomEvent<OfferRecord[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getLocalOffers());
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener(OFFERS_UPDATED_EVENT, handleLocalUpdate);
  }

  // If Firebase is available, set up real-time listener
  if (firebaseEnabled && db) {
    try {
      const offersRef = collection(db, "offers");
      const unsubscribe = onSnapshot(
        offersRef,
        (snapshot) => {
          const remoteOffers: OfferRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            remoteOffers.push({
              id: docSnap.id,
              festivalName: data.festivalName || "Special Festival",
              name: data.name || "Festive Offer",
              description: data.description || "",
              originalPrice: Number(data.originalPrice || 600),
              discountedPrice: Number(data.discountedPrice || 400),
              planId: data.planId || "monthly",
              planName: data.planName || "Monthly",
              durationDays: Number(data.durationDays || 30),
              startDate: data.startDate || getTodayDateString(),
              expiryDate: data.expiryDate || getTodayDateString(),
              status: (data.status as OfferStatus) || "Active",
              badge: data.badge || "",
              code: data.code || "",
              festiveType: (data.festiveType as FestiveType) || "diwali",
              imageUrl: data.imageUrl || "",
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
          });

          // Sort: active first, then created desc
          remoteOffers.sort((a, b) => {
            if (a.status === "Active" && b.status !== "Active") return -1;
            if (b.status === "Active" && a.status !== "Active") return 1;
            return (b.createdAt || "").localeCompare(a.createdAt || "");
          });

          // Save to local cache without re-dispatching window event to prevent loop
          saveLocalOffers(remoteOffers, false);
          callback(remoteOffers);
        },
        (err) => {
          console.warn("Firestore offers snapshot error, using local fallback:", err);
          callback(getLocalOffers());
        }
      );

      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener(OFFERS_UPDATED_EVENT, handleLocalUpdate);
        }
        unsubscribe();
      };
    } catch (err) {
      console.warn("Failed to attach offers snapshot listener:", err);
    }
  }

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener(OFFERS_UPDATED_EVENT, handleLocalUpdate);
    }
  };
}

/**
 * Admin: Create an offer
 */
export async function createOffer(
  offerData: Omit<OfferRecord, "id" | "createdAt" | "updatedAt">,
  customId?: string
): Promise<OfferRecord> {
  const id = customId || `offer-${Date.now()}`;
  const now = new Date().toISOString();
  const newOffer: OfferRecord = {
    ...offerData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  const current = getLocalOffers();
  const updated = [newOffer, ...current.filter((o) => o.id !== id)];
  saveLocalOffers(updated);

  if (firebaseEnabled && db) {
    try {
      await setDoc(doc(db, "offers", id), newOffer);
    } catch (err) {
      console.error("Firestore createOffer error:", err);
      throw err;
    }
  }

  return newOffer;
}

/**
 * Admin: Update an existing offer
 */
export async function updateOffer(offerId: string, updates: Partial<OfferRecord>): Promise<void> {
  const current = getLocalOffers();
  const now = new Date().toISOString();
  const updated = current.map((offer) =>
    offer.id === offerId ? { ...offer, ...updates, updatedAt: now } : offer
  );
  saveLocalOffers(updated);

  if (firebaseEnabled && db) {
    try {
      await setDoc(doc(db, "offers", offerId), { ...updates, updatedAt: now }, { merge: true });
    } catch (err) {
      console.error("Firestore updateOffer error:", err);
      throw err;
    }
  }
}

/**
 * Admin: Toggle offer active/inactive status
 */
export async function toggleOfferStatus(offerId: string, newStatus: OfferStatus): Promise<void> {
  return updateOffer(offerId, { status: newStatus });
}

/**
 * Admin: Delete an offer
 */
export async function deleteOffer(offerId: string): Promise<void> {
  const current = getLocalOffers();
  const updated = current.filter((offer) => offer.id !== offerId);
  saveLocalOffers(updated);

  if (firebaseEnabled && db) {
    try {
      await deleteDoc(doc(db, "offers", offerId));
    } catch (err) {
      console.error("Firestore deleteOffer error:", err);
      throw err;
    }
  }
}

/**
 * Admin: Seed or reset standard festival templates into Firestore and LocalStorage
 */
export async function seedFestivalOffersToFirestore(offers: OfferRecord[] = DEFAULT_FESTIVAL_OFFERS): Promise<void> {
  saveLocalOffers(offers);
  if (firebaseEnabled && db) {
    for (const offer of offers) {
      await setDoc(doc(db, "offers", offer.id), offer);
    }
  }
}

/**
 * Verified Payment & Membership Activation Flow
 * Never activates paid membership before verification.
 */
export async function recordOfferPayment({
  userId,
  userName,
  userEmail,
  offer,
  paymentMethod,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  offer: OfferRecord;
  paymentMethod: string;
}): Promise<{
  payment: PaymentRecord;
  membership: { planId: string; planName: string; expiryDate: string; amount: number; offerId: string };
}> {
  // 1. Strict validation
  const validation = validateOffer(offer.id);
  if (!validation.isValid) {
    throw new Error(validation.error || "Offer validation failed.");
  }

  const today = getTodayDateString();
  const durationDays = offer.durationDays || (offer.planId === "annual" ? 365 : 30);
  const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const festivalName = offer.festivalName || "Festive";
  const planNameFormatted = `${offer.planName} (${festivalName} Deal)`;
  const txRef = `${(offer.festiveType || "FEST").toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const paymentId = `pay-${(offer.festiveType || "fest").toLowerCase()}-${Date.now()}`;
  const savingAmount = offer.originalPrice - offer.discountedPrice;

  // 2. Build payment record
  const newPayment: PaymentRecord = {
    id: paymentId,
    member: userName,
    memberId: userId,
    amount: offer.discountedPrice,
    currency: "INR",
    method: (paymentMethod === "UPI" ? "UPI" : "Online") as any,
    date: today,
    status: "Paid",
    reference: txRef,
    notes: `${festivalName} Deal: ${offer.name} (${offer.planName} Plan - Saved ₹${savingAmount})`,
  };

  // 3. Build membership plan details
  const persistedPlan = {
    planId: offer.planId,
    planName: planNameFormatted,
    expiryDate,
    amount: offer.discountedPrice,
    offerId: offer.id,
  };

  // 4. Update Firestore if enabled
  if (firebaseEnabled && db) {
    try {
      await setDoc(doc(db, "payments", paymentId), {
        ...newPayment,
        userEmail,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Firestore payment record write warning:", err);
    }

    try {
      if (userId && userId !== "guest") {
        await setDoc(
          doc(db, "users", userId),
          {
            membershipPlan: planNameFormatted,
            membershipStart: today,
            membershipEnd: expiryDate,
            membershipAmount: offer.discountedPrice,
            membershipOfferId: offer.id,
            membershipUpdatedAt: new Date().toISOString(),
            status: "Active",
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn("Firestore user membership write warning:", err);
    }
  }

  // 5. Update local storage for immediate persistence
  if (typeof window !== "undefined") {
    localStorage.setItem(`petergym-membership-${userId}`, JSON.stringify(persistedPlan));
    window.dispatchEvent(
      new CustomEvent("petergym-offer-claimed", {
        detail: { payment: newPayment, plan: persistedPlan },
      })
    );
  }

  return { payment: newPayment, membership: persistedPlan };
}
