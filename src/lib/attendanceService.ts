import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db, firebaseEnabled } from "./firebase";
import { attendanceRecords as defaultSeedAttendance } from "../data/mockData";
import type { AttendanceRecord, Role } from "../types";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  gymId: string;
};

const LOCAL_STORAGE_KEY = "fitflow_attendance_records_v1";
export const ATTENDANCE_UPDATED_EVENT = "fitflow-attendance-updated";

// Helper to get today's date formatted as YYYY-MM-DD in local time
export function getLocalDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to format a time as hh:mm AM/PM or 24h
export function formatLocalTimeString(d = new Date()): string {
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Calculate session duration in text and minutes
export function calculateDuration(
  startTime: Date | number,
  endTime: Date | number = new Date(),
): { durationText: string; durationMinutes: number } {
  const startMs = typeof startTime === "number" ? startTime : startTime.getTime();
  const endMs = typeof endTime === "number" ? endTime : endTime.getTime();
  const diffMs = Math.max(0, endMs - startMs);
  const totalMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let durationText = "";
  if (hours > 0) {
    durationText = `${hours}h ${minutes}m`;
  } else {
    durationText = `${minutes}m`;
  }

  return { durationText, durationMinutes: totalMinutes };
}

// Format live timer ticking as HH:MM:SS
export function formatLiveTimer(startTime: Date | number): string {
  const startMs = typeof startTime === "number" ? startTime : startTime.getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

// Parse timestamp to Date instance
export function parseTimestampToDate(val: any, fallbackDateStr?: string, fallbackTimeStr?: string): Date {
  if (val instanceof Timestamp) {
    return val.toDate();
  }
  if (val && typeof val.toDate === "function") {
    return val.toDate();
  }
  if (typeof val === "number" && !isNaN(val)) {
    return new Date(val);
  }
  if (typeof val === "string" && !isNaN(Date.parse(val))) {
    return new Date(val);
  }
  // Try combining fallback date and time strings
  if (fallbackDateStr && fallbackTimeStr) {
    const combined = `${fallbackDateStr} ${fallbackTimeStr}`;
    const parsed = Date.parse(combined);
    if (!isNaN(parsed)) return new Date(parsed);
  }
  return new Date();
}

// Read from localStorage
export function getLocalAttendanceRecords(): AttendanceRecord[] {
  if (typeof window === "undefined") return [...defaultSeedAttendance];
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as AttendanceRecord[];
    }
  } catch {
    // ignore json error
  }
  return [...defaultSeedAttendance];
}

// Save to localStorage and notify window
export function saveLocalAttendanceRecords(records: AttendanceRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(
      new CustomEvent(ATTENDANCE_UPDATED_EVENT, { detail: records }),
    );
  } catch {
    // ignore
  }
}

// Normalize record from Firestore snapshot
function mapDocToAttendanceRecord(id: string, data: any): AttendanceRecord {
  const checkInDate = data.checkInTimestamp
    ? parseTimestampToDate(data.checkInTimestamp, data.date, data.checkIn)
    : parseTimestampToDate(null, data.date, data.checkIn);

  const checkOutDate = data.checkOutTimestamp
    ? parseTimestampToDate(data.checkOutTimestamp, data.date, data.checkOut)
    : data.checkOut
    ? parseTimestampToDate(null, data.date, data.checkOut)
    : undefined;

  let duration = data.duration;
  let durationMinutes = data.durationMinutes;

  if (!duration && checkInDate && checkOutDate) {
    const calc = calculateDuration(checkInDate, checkOutDate);
    duration = calc.durationText;
    durationMinutes = calc.durationMinutes;
  }

  return {
    id,
    userId: data.userId || data.memberId || id,
    memberId: data.memberId || data.userId || id,
    memberName: data.memberName || "Gym Member",
    memberEmail: data.memberEmail || "",
    gymId: data.gymId || "gym_1",
    date: data.date || getLocalDateString(checkInDate),
    checkIn: data.checkIn || formatLocalTimeString(checkInDate),
    checkOut: data.checkOut || (checkOutDate ? formatLocalTimeString(checkOutDate) : undefined),
    duration,
    durationMinutes,
    status: data.status === "Checked In" ? "Checked In" : "Checked Out",
    checkInTimestamp: data.checkInTimestamp || checkInDate.getTime(),
    checkOutTimestamp: data.checkOutTimestamp || (checkOutDate ? checkOutDate.getTime() : undefined),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Check In a member.
 * Ensures:
 * - Real user authentication identity is used.
 * - Duplicate active check-ins are prevented.
 * - Stored in Firestore when enabled, falling back to persistent localStorage.
 */
export async function checkInMember(user: SessionUser): Promise<{
  success: boolean;
  record?: AttendanceRecord;
  error?: string;
}> {
  if (!user || !user.id) {
    return { success: false, error: "Authentication required to check in." };
  }

  const effectiveUserId = auth?.currentUser?.uid || user.id;
  const effectiveName = auth?.currentUser?.displayName || user.name || "Gym Member";
  const effectiveEmail = auth?.currentUser?.email || user.email || "";
  const effectiveGymId = user.gymId || "gym_1";

  const todayStr = getLocalDateString();
  const timeNowStr = formatLocalTimeString();
  const nowMs = Date.now();

  if (firebaseEnabled && db) {
    try {
      // Check for any currently active session in Firestore for this user
      const activeQuery = query(
        collection(db, "attendance"),
        where("userId", "==", effectiveUserId),
        where("status", "==", "Checked In"),
      );

      const activeSnap = await getDocs(activeQuery);
      const openDocs = activeSnap.docs.filter((docItem) => {
        const d = docItem.data();
        return !d.checkOut && d.status === "Checked In";
      });

      if (openDocs.length > 0) {
        return {
          success: false,
          error: "You already have an active check-in session in progress. Please check out first.",
        };
      }

      // Create new document in attendance collection
      const newDocRef = doc(collection(db, "attendance"));
      const newRecordPayload = {
        id: newDocRef.id,
        userId: effectiveUserId,
        memberId: effectiveUserId,
        memberName: effectiveName,
        memberEmail: effectiveEmail,
        gymId: effectiveGymId,
        date: todayStr,
        checkIn: timeNowStr,
        status: "Checked In" as const,
        checkInTimestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(newDocRef, newRecordPayload);

      const createdRecord: AttendanceRecord = {
        ...newRecordPayload,
        checkInTimestamp: nowMs,
      };

      // Also sync to local cache for instant offline responsiveness
      const currentLocal = getLocalAttendanceRecords();
      saveLocalAttendanceRecords([createdRecord, ...currentLocal]);

      return { success: true, record: createdRecord };
    } catch (err: any) {
      console.error("Firestore check-in failed, attempting fallback:", err);
      // Fallback below
    }
  }

  // Fallback / Offline / Demo mode
  const current = getLocalAttendanceRecords();
  const existingActive = current.find(
    (r) =>
      (r.userId === effectiveUserId || r.memberId === effectiveUserId) &&
      r.status === "Checked In" &&
      !r.checkOut,
  );

  if (existingActive) {
    return {
      success: false,
      error: "You already have an active check-in session. Please check out first.",
    };
  }

  const fallbackRecord: AttendanceRecord = {
    id: `att-${Date.now()}`,
    userId: effectiveUserId,
    memberId: effectiveUserId,
    memberName: effectiveName,
    memberEmail: effectiveEmail,
    gymId: effectiveGymId,
    date: todayStr,
    checkIn: timeNowStr,
    status: "Checked In",
    checkInTimestamp: nowMs,
    createdAt: nowMs,
    updatedAt: nowMs,
  };

  saveLocalAttendanceRecords([fallbackRecord, ...current]);
  return { success: true, record: fallbackRecord };
}

/**
 * Check Out a member.
 * Ensures:
 * - Only active sessions can be checked out.
 * - Computes total session duration.
 * - Allows checking in again afterwards for a new session.
 */
export async function checkOutMember(user: SessionUser): Promise<{
  success: boolean;
  record?: AttendanceRecord;
  error?: string;
}> {
  if (!user || !user.id) {
    return { success: false, error: "Authentication required to check out." };
  }

  const effectiveUserId = auth?.currentUser?.uid || user.id;
  const timeNowStr = formatLocalTimeString();
  const nowMs = Date.now();

  if (firebaseEnabled && db) {
    try {
      // Find active record in Firestore
      const activeQuery = query(
        collection(db, "attendance"),
        where("userId", "==", effectiveUserId),
        where("status", "==", "Checked In"),
      );

      const activeSnap = await getDocs(activeQuery);
      const activeDoc = activeSnap.docs.find((docItem) => {
        const d = docItem.data();
        return !d.checkOut && d.status === "Checked In";
      });

      if (!activeDoc) {
        return {
          success: false,
          error: "No active check-in session found to check out.",
        };
      }

      const activeData = activeDoc.data();
      const checkInDate = activeData.checkInTimestamp
        ? parseTimestampToDate(activeData.checkInTimestamp, activeData.date, activeData.checkIn)
        : parseTimestampToDate(null, activeData.date, activeData.checkIn);

      const { durationText, durationMinutes } = calculateDuration(checkInDate, nowMs);

      await updateDoc(doc(db, "attendance", activeDoc.id), {
        checkOut: timeNowStr,
        checkOutTimestamp: serverTimestamp(),
        duration: durationText,
        durationMinutes,
        status: "Checked Out",
        updatedAt: serverTimestamp(),
      });

      const updatedRecord: AttendanceRecord = {
        ...mapDocToAttendanceRecord(activeDoc.id, activeData),
        checkOut: timeNowStr,
        checkOutTimestamp: nowMs,
        duration: durationText,
        durationMinutes,
        status: "Checked Out",
      };

      // Sync local cache
      const localRecords = getLocalAttendanceRecords().map((r) =>
        r.id === activeDoc.id ? updatedRecord : r,
      );
      saveLocalAttendanceRecords(localRecords);

      return { success: true, record: updatedRecord };
    } catch (err: any) {
      console.error("Firestore check-out failed, attempting fallback:", err);
    }
  }

  // Fallback / Offline / Demo mode
  const current = getLocalAttendanceRecords();
  const activeIndex = current.findIndex(
    (r) =>
      (r.userId === effectiveUserId || r.memberId === effectiveUserId) &&
      r.status === "Checked In" &&
      !r.checkOut,
  );

  if (activeIndex === -1) {
    return {
      success: false,
      error: "No active check-in session found to check out.",
    };
  }

  const target = current[activeIndex];
  const checkInDate = target.checkInTimestamp
    ? parseTimestampToDate(target.checkInTimestamp, target.date, target.checkIn)
    : parseTimestampToDate(null, target.date, target.checkIn);

  const { durationText, durationMinutes } = calculateDuration(checkInDate, nowMs);

  const updatedRecord: AttendanceRecord = {
    ...target,
    checkOut: timeNowStr,
    checkOutTimestamp: nowMs,
    duration: durationText,
    durationMinutes,
    status: "Checked Out",
    updatedAt: nowMs,
  };

  const updatedList = [...current];
  updatedList[activeIndex] = updatedRecord;
  saveLocalAttendanceRecords(updatedList);

  return { success: true, record: updatedRecord };
}

/**
 * Real-time listener for attendance records.
 * Uses Firestore `onSnapshot` when connected.
 * Gracefully subscribes to local changes when offline or in demo mode.
 */
export function subscribeAttendance(
  user: SessionUser | null,
  onUpdate: (records: AttendanceRecord[]) => void,
  onError?: (error: any) => void,
): Unsubscribe {
  if (typeof window === "undefined") {
    return () => {};
  }

  // If Firebase is available and configured
  if (firebaseEnabled && db) {
    try {
      let q;
      const colRef = collection(db, "attendance");

      if (user?.role === "member") {
        const effectiveUid = auth?.currentUser?.uid || user.id;
        q = query(colRef, where("userId", "==", effectiveUid));
      } else if (user?.role === "trainer") {
        const gymId = user.gymId || "gym_1";
        q = query(colRef, where("gymId", "==", gymId));
      } else {
        // super_admin: sees all or authorized gym records
        q = colRef;
      }

      const unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const records: AttendanceRecord[] = snapshot.docs.map((docItem) =>
            mapDocToAttendanceRecord(docItem.id, docItem.data()),
          );

          // Sort records descending by checkInTimestamp or date
          records.sort((a, b) => {
            const timeA = typeof a.checkInTimestamp === "number"
              ? a.checkInTimestamp
              : parseTimestampToDate(a.checkInTimestamp, a.date, a.checkIn).getTime();
            const timeB = typeof b.checkInTimestamp === "number"
              ? b.checkInTimestamp
              : parseTimestampToDate(b.checkInTimestamp, b.date, b.checkIn).getTime();
            return timeB - timeA;
          });

          // Update local cache and fire callback
          saveLocalAttendanceRecords(records);
          onUpdate(records);
        },
        (err) => {
          console.warn("Firestore onSnapshot error, falling back to local storage:", err);
          if (onError) onError(err);
          // Fall back to local data on error
          onUpdate(getLocalAttendanceRecords());
        },
      );

      return () => {
        unsubscribeFirestore();
      };
    } catch (err) {
      console.error("Error setting up Firestore snapshot listener:", err);
      if (onError) onError(err);
    }
  }

  // Fallback: localStorage listener
  const emitLocal = () => {
    let records = getLocalAttendanceRecords();
    if (user?.role === "member") {
      records = records.filter((r) => r.userId === user.id || r.memberId === user.id);
    } else if (user?.role === "trainer") {
      const gymId = user.gymId || "gym_1";
      records = records.filter((r) => !r.gymId || r.gymId === gymId);
    }
    records.sort((a, b) => {
      const timeA = typeof a.checkInTimestamp === "number"
        ? a.checkInTimestamp
        : parseTimestampToDate(a.checkInTimestamp, a.date, a.checkIn).getTime();
      const timeB = typeof b.checkInTimestamp === "number"
        ? b.checkInTimestamp
        : parseTimestampToDate(b.checkInTimestamp, b.date, b.checkIn).getTime();
      return timeB - timeA;
    });
    onUpdate(records);
  };

  // Immediate initial load
  emitLocal();

  const handleUpdate = () => emitLocal();
  window.addEventListener(ATTENDANCE_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(ATTENDANCE_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

// Find currently active session for a user
export function findActiveSession(
  records: AttendanceRecord[],
  userId: string,
): AttendanceRecord | null {
  return (
    records.find(
      (r) =>
        (r.userId === userId || r.memberId === userId) &&
        r.status === "Checked In" &&
        !r.checkOut,
    ) || null
  );
}

// Find today's latest session for a user
export function findTodayLatestSession(
  records: AttendanceRecord[],
  userId: string,
): AttendanceRecord | null {
  const todayStr = getLocalDateString();
  return (
    records.find(
      (r) =>
        (r.userId === userId || r.memberId === userId) &&
        r.date === todayStr,
    ) || null
  );
}

// Generate weekly chart data for attendance (last 7 days)
export function getWeeklyAttendanceData(records: AttendanceRecord[]): { name: string; members: number }[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days: { [key: string]: { name: string; count: number; dateStr: string } } = {};

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayName = dayNames[d.getDay()];
    days[dateStr] = { name: dayName, count: 0, dateStr };
  }

  for (const r of records) {
    if (days[r.date]) {
      days[r.date].count += 1;
    }
  }

  return Object.values(days).map((d) => ({
    name: d.name,
    members: d.count,
  }));
}

