export type Role = "super_admin" | "trainer" | "member";

export type MemberStatus = "Active" | "Inactive" | "Suspended";
export type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Failed"
  | "Refunded"
  | "Overdue";
export type PlanStatus = "Active" | "Archived";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  gymId: string;
  avatar: string;
  phone: string;
}

export interface MemberRecord {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  dob: string;
  emergencyContact: string;
  address: string;
  joinDate: string;
  plan: string;
  membershipStart: string;
  membershipEnd: string;
  trainer: string;
  status: MemberStatus;
  notes: string;
}

export interface PlanRecord {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  currency: string;
  benefits: string[];
  sessionLimit?: number;
  status: PlanStatus;
  pricing?: {
    monthly: number;
    quarterly: number;
    annual: number;
  };
}

export interface PaymentRecord {
  id: string;
  member: string;
  memberId: string;
  amount: number;
  currency: string;
  method: "Cash" | "Bank Transfer" | "UPI" | "Online" | "Other";
  date: string;
  status: PaymentStatus;
  reference: string;
  notes: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  gymId?: string;
  userId?: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  duration?: string;
  durationMinutes?: number;
  status: "Checked In" | "Checked Out";
  checkInTimestamp?: any;
  checkOutTimestamp?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface TrainerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  specialties: string[];
  experience: string;
  certifications: string[];
  availability: string;
  status: "Active" | "Inactive";
}

export interface WorkoutRecord {
  id: string;
  title: string;
  day: string;
  duration: string;
  focus: string;
  exercises: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: "membership" | "payment" | "attendance" | "workout" | "system";
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
}

export type OfferStatus = "Active" | "Inactive";
export type FestiveType = "diwali" | "dussehra" | "navratri" | "new_year" | "custom";

export interface OfferRecord {
  id: string;
  festivalName: string; // e.g. "Diwali" | "Dussehra" | "Navratri" | "New Year" | "Custom"
  name: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  planId: string;
  planName: string;
  durationDays: number;
  startDate: string;
  expiryDate: string;
  status: OfferStatus;
  badge?: string;
  code?: string;
  festiveType: FestiveType;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
