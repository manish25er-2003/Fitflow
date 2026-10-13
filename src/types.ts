export type Role = "super_admin" | "gym_admin" | "trainer" | "member";

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
  date: string;
  checkIn: string;
  checkOut?: string;
  status: "Checked In" | "Checked Out";
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
