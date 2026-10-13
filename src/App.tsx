import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Dumbbell,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MoonStar,
  Search,
  Settings,
  ShieldCheck,
  Signature,
  Sparkles,
  SunMedium,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  attendanceRecords,
  demoUsers,
  gymProfile,
  membershipDistribution,
  membershipPlans,
  notifications,
  paymentRecords,
  revenueSeries,
  seedMembers,
  systemActivity,
  trainers,
  workoutPlans,
} from "./data/mockData";
import profilePhoto from "./assets/manish-profile.svg";
import gymPhoto1 from "./assets/WhatsApp Image 2026-10-13 at 2.45.43 PM (1).jpeg";
import gymPhoto2 from "./assets/WhatsApp Image 2026-10-13 at 2.45.43 PM.jpeg";
import gymPhoto3 from "./assets/WhatsApp Image 2026-10-13 at 1.51.41 PM (1).jpeg";
import gymPhoto4 from "./assets/WhatsApp Image 2026-10-13 at 1.51.41 PM.jpeg";
import dumbbellImage from "/public/gym/dumbbell-1.jpg";
import machineImage from "/public/gym/machine-1.jpg";
import strengthImage from "/public/gym/strength-1.jpg";
import { auth, db, firebaseEnabled } from "./lib/firebase";
import type {
  MemberRecord,
  MemberStatus,
  PaymentRecord,
  PaymentStatus,
  PlanRecord,
  Role,
  TrainerRecord,
  WorkoutRecord,
} from "./types";

type UserSession = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  gymId: string;
};

type AuthContextType = {
  user: UserSession | null;
  login: (email: string, password: string) => Promise<UserSession | null>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: Role,
  ) => Promise<UserSession | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const gymGallery = [gymPhoto1, gymPhoto2, gymPhoto3, gymPhoto4];
const equipmentGallery = [dumbbellImage, machineImage, strengthImage];

const sidebarMenus: Record<
  Role,
  { to: string; label: string; icon: typeof LayoutDashboard }[]
> = {
  super_admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/members", label: "Members", icon: Users },
    { to: "/admin/memberships", label: "Membership", icon: Signature },
    { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/admin/attendance", label: "Attendance", icon: CalendarDays },
    { to: "/admin/workouts", label: "Workouts", icon: Dumbbell },
    { to: "/admin/classes", label: "Classes & Schedule", icon: CalendarDays },
    { to: "/admin/payments", label: "Payments", icon: WalletCards },
    { to: "/admin/reports", label: "Reports", icon: TrendingUp },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/my-profile", label: "My Profile", icon: Users },
    {
      to: "/admin/developer-profile",
      label: "Developer Profile",
      icon: ShieldCheck,
    },
    { to: "/admin/settings", label: "Settings", icon: Settings },
    { to: "/login", label: "Logout", icon: LogOut },
  ],
  trainer: [
    { to: "/trainer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/trainer/members", label: "Members", icon: Users },
    { to: "/trainer/membership", label: "Membership", icon: Signature },
    { to: "/trainer/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/trainer/attendance", label: "Attendance", icon: CalendarDays },
    { to: "/trainer/workouts", label: "Workouts", icon: Dumbbell },
    { to: "/trainer/classes", label: "Classes & Schedule", icon: CalendarDays },
    { to: "/trainer/notifications", label: "Notifications", icon: Bell },
    { to: "/trainer/my-profile", label: "My Profile", icon: Users },
    {
      to: "/trainer/developer-profile",
      label: "Developer Profile",
      icon: ShieldCheck,
    },
    { to: "/login", label: "Logout", icon: LogOut },
  ],
  member: [
    { to: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/member/membership", label: "Membership", icon: Signature },
    { to: "/member/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/member/attendance", label: "Attendance", icon: CalendarDays },
    { to: "/member/workouts", label: "Workouts", icon: Dumbbell },
    { to: "/member/classes", label: "Classes & Schedule", icon: CalendarDays },
    { to: "/member/payments", label: "Payments", icon: WalletCards },
    { to: "/member/notifications", label: "Notifications", icon: Bell },
    { to: "/member/my-profile", label: "My Profile", icon: Users },
    {
      to: "/member/developer-profile",
      label: "Developer Profile",
      icon: ShieldCheck,
    },
    { to: "/login", label: "Logout", icon: LogOut },
  ],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getRoleRoute(role: Role) {
  if (role === "member") return "/member/dashboard";
  if (role === "trainer") return "/trainer/dashboard";
  return "/admin/dashboard";
}

function resolveRoleFromEmail(email: string): Role {
  const normalized = email.toLowerCase();
  if (normalized.includes("admin") || normalized.includes("super")) {
    return "super_admin";
  }
  if (normalized.includes("trainer")) {
    return "trainer";
  }
  return "member";
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const INSTALL_PROMPT_DISMISSED_KEY = "petergym-install-popup-dismissed";

function isPwaInstalled() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
    )
  );
}

function BrandLogo({
  mode = "full",
  className = "",
}: {
  mode?: "full" | "mark" | "white";
  className?: string;
}) {
  if (mode === "mark") {
    return (
      <div
        aria-label="Peter-GYM app logo"
        className={`relative flex items-center justify-center overflow-hidden rounded-[20px] border border-violet-400/50 bg-[#090A0F] shadow-[0_0_0_1px_rgba(139,92,246,0.22),0_0_22px_rgba(139,92,246,0.45)] ${className}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.7),transparent_28%),radial-gradient(circle_at_70%_100%,rgba(52,211,153,0.5),transparent_34%),linear-gradient(135deg,#090A0F_0%,#141827_35%,#090A0F_100%)]" />
        <div className="absolute inset-[7px] rounded-[16px] border border-violet-400/40 bg-[#0F131A]/80" />
        <span
          className="relative font-black tracking-[-0.18em] text-white"
          style={{
            fontSize: "clamp(1.15rem, 1vw + 0.8rem, 2.3rem)",
            lineHeight: 1,
          }}
        >
          P
        </span>
      </div>
    );
  }

  return (
    <div
      aria-label="Peter-GYM brand name"
      className={`inline-flex items-center justify-center ${className}`}
    >
      <span
        className={`font-black tracking-[-0.08em] ${
          mode === "white" ? "text-white" : "text-white"
        }`}
        style={{
          fontSize: "clamp(1rem, 0.9vw + 0.8rem, 1.9rem)",
          lineHeight: 1,
        }}
      >
        Peter-GYM
      </span>
    </div>
  );
}

function ProfileAvatar({
  className = "",
  alt = "Peter-GYM profile",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={profilePhoto}
      alt={alt}
      className={`h-full w-full object-cover object-center ${className}`}
    />
  );
}

function SplashIntroPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(3);
  const didAdvanceRef = useRef(false);
  const destination = user ? getRoleRoute(user.role) : "/home";

  const advance = useCallback(() => {
    if (didAdvanceRef.current) return;
    didAdvanceRef.current = true;
    sessionStorage.setItem("petergym-intro-seen", "true");
    navigate(destination, { replace: true });
  }, [destination, navigate]);

  useEffect(() => {
    if (sessionStorage.getItem("petergym-intro-seen") === "true") {
      navigate(destination, { replace: true });
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          advance();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [advance, destination, navigate]);

  return (
    <div className="min-h-screen bg-[#090A0F] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-1.25rem)] max-w-4xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-violet-400/20 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.24),transparent_28%),radial-gradient(circle_at_bottom,_rgba(52,211,153,0.18),transparent_32%),#090A0F] p-4 shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_25px_80px_rgba(15,17,24,0.9)] sm:p-5 lg:p-7">
          <div className="mb-5 flex items-center justify-center gap-3">
            <BrandLogo mode="mark" className="h-12 w-12 sm:h-14 sm:w-14" />
            <div className="text-left">
              <div className="text-[9px] font-medium uppercase tracking-[0.32em] text-violet-200/80">
                Peter-GYM
              </div>
              <div className="mt-1 text-xs text-slate-400">Welcome aboard</div>
            </div>
          </div>

          <div className="grid items-center gap-6 rounded-[28px] border border-violet-400/20 bg-slate-950/80 p-4 shadow-[0_0_30px_rgba(139,92,246,0.14)] backdrop-blur-md sm:p-5 lg:grid-cols-[0.82fr_1.18fr] lg:p-6">
            <div className="relative mx-auto flex h-52 w-52 items-center justify-center rounded-full border border-violet-400/30 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.25),transparent_38%),radial-gradient(circle_at_bottom,_rgba(52,211,153,0.14),transparent_35%),#0A0D14] p-2 shadow-[0_0_40px_rgba(139,92,246,0.25)] sm:h-60 sm:w-60">
              <img
                src={profilePhoto}
                alt="Er. Manish Kumar Yadav"
                className="h-full w-full rounded-full object-cover object-center ring-4 ring-violet-500/30"
              />
            </div>

            <div className="space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Software Development Engineer
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
                  Er. Manish Kumar Yadav
                </h2>
                <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.28em] text-violet-200/80">
                  Peter-GYM
                </p>
              </div>

              <p className="mx-auto max-w-xl text-sm text-slate-300 lg:mx-0">
                “Building smarter fitness experiences through technology.”
              </p>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-400">
                  <span>Welcome</span>
                  <span>{countdown}s</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-violet-400 to-emerald-400 transition-all duration-1000"
                    style={{ width: `${(countdown / 3) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={advance}
                  className="btn-secondary border-violet-400/30 bg-violet-500/10 text-violet-100 hover:border-violet-300/60"
                >
                  Skip Intro
                </button>
                <button type="button" onClick={advance} className="btn-primary">
                  Continue to Website
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    if (location.pathname !== "/home") {
      setShowInstallPrompt(false);
      return;
    }

    if (isPwaInstalled()) {
      setShowInstallPrompt(false);
      return;
    }

    const wasDismissed =
      typeof window !== "undefined" &&
      window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === "true";

    if (wasDismissed) {
      setShowInstallPrompt(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowInstallPrompt(true);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);

      if (location.pathname === "/home" && !isPwaInstalled()) {
        const wasDismissed =
          window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === "true";

        if (!wasDismissed) {
          setShowInstallPrompt(true);
        }
      }
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setShowInstallPrompt(false);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "true");
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [location.pathname]);

  const handleInstallApp = async () => {
    if (installPromptEvent) {
      try {
        await installPromptEvent.prompt();
        const choice = await installPromptEvent.userChoice;
        if (choice.outcome === "accepted") {
          setShowInstallPrompt(false);
          return;
        }
      } catch (error) {
        console.warn("PWA install prompt failed", error);
      }
    }

    setShowInstallPrompt(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "true");
    }
  };

  const handleDismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "true");
    }
  };

  const handleShowInstallPromptAgain = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(INSTALL_PROMPT_DISMISSED_KEY);
    }
    setShowInstallPrompt(true);
  };

  const handleDashboard = () => {
    if (user) {
      navigate(getRoleRoute(user.role));
      return;
    }
    navigate("/login");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/home");
  };

  const navItems = [
    { label: "Home", href: "/home" },
    { label: "Features", href: "#features" },
    { label: "About Developer", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen bg-[#090A0F] text-white">
      <header className="sticky top-0 z-50 border-b border-violet-400/10 bg-[#090A0F]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="flex items-center gap-3"
          >
            <BrandLogo mode="mark" className="h-10 w-10 rounded-2xl" />
            <div className="text-left">
              <div className="text-sm font-bold tracking-wide text-white">
                Peter-GYM
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Performance Club
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            {navItems.map((item) =>
              item.href.startsWith("#") ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="transition hover:text-white"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className="transition hover:text-white"
                >
                  {item.label}
                </button>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="hidden rounded-full border border-violet-400/30 bg-violet-500/5 px-4 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-300/60 sm:inline-flex"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="inline-flex rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-[#090A0F] shadow-[0_0_20px_rgba(139,92,246,0.45)] transition hover:brightness-110"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleDashboard}
                  className="hidden rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 sm:inline-flex"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-violet-400/30 hover:text-white"
                >
                  Logout
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileNavOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-violet-400/10 bg-[#090A0F] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) =>
                item.href.startsWith("#") ? (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      navigate(item.href);
                      setMobileNavOpen(false);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200"
                  >
                    {item.label}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => {
                  navigate("/login");
                  setMobileNavOpen(false);
                }}
                className="mt-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-100"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {location.pathname === "/home" && showInstallPrompt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#05070b]/80 px-4 py-6 backdrop-blur-sm">
            <div className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-violet-400/20 bg-[#0b1017]/90 p-4 shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_30px_80px_rgba(15,17,24,0.7)] ring-1 ring-white/10 sm:p-5">
              <button
                type="button"
                onClick={handleDismissInstallPrompt}
                aria-label="Close install prompt"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-violet-400/30 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center pt-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-violet-400/30 bg-gradient-to-br from-violet-500/20 via-slate-900 to-emerald-400/20 shadow-[0_0_26px_rgba(139,92,246,0.28)]">
                  <BrandLogo mode="mark" className="h-12 w-12 rounded-[16px]" />
                </div>
              </div>

              <div className="mt-5 text-center">
                <h3 className="text-2xl font-black tracking-tight text-white">
                  Install Peter-GYM
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Add Peter-GYM to your home screen for quick access to your gym
                  dashboard anytime.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-emerald-400 px-4 py-3 text-sm font-bold text-[#090A0F] shadow-[0_0_24px_rgba(139,92,246,0.38)] transition hover:brightness-110 active:scale-[0.99]"
                >
                  Install App
                </button>

                <button
                  type="button"
                  onClick={handleDismissInstallPrompt}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-violet-400/30 hover:text-white"
                >
                  Maybe Later
                </button>
              </div>

              {!installPromptEvent && (
                <div className="mt-5 rounded-2xl border border-violet-400/15 bg-violet-500/5 p-3 text-center text-xs text-slate-300">
                  Install isn’t supported on this browser yet. Open the browser
                  menu and choose “Add to Home Screen” or “Install App”.
                </div>
              )}

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleShowInstallPromptAgain}
                  className="text-[11px] uppercase tracking-[0.18em] text-violet-200/80 transition hover:text-violet-100"
                >
                  Show reminder again
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(52,211,153,0.18),transparent_25%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:px-8 lg:py-20">
            <div className="flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
              <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Modern Gym Management
              </span>

              <h1 className="max-w-xl text-[2.1rem] font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Sculpt the body. Lead the gym.
              </h1>

              <p className="mt-5 max-w-xl text-sm text-slate-300 sm:text-base lg:text-lg">
                Peter-GYM brings high-performance training culture and smart gym
                operations together so athletes push harder, teams stay
                organized, and every member can track visible progress with
                premium, real-world systems.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="inline-flex rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 px-5 py-3 text-sm font-semibold text-[#090A0F] shadow-[0_0_26px_rgba(139,92,246,0.45)] transition hover:brightness-110 sm:px-6"
                >
                  Get Started
                </button>
                <a
                  href="#features"
                  className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-400/30 hover:bg-violet-500/5 sm:px-6"
                >
                  Explore Features
                </a>
              </div>

              <div className="mt-10 grid w-full max-w-lg grid-cols-3 gap-3">
                {[
                  { label: "Members", value: "5.6K" },
                  { label: "Retention", value: "99.2%" },
                  { label: "Growth", value: "45%" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-violet-400/10 bg-white/5 p-3 text-center backdrop-blur-sm"
                  >
                    <div className="text-lg font-bold text-white sm:text-xl">
                      {item.value}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-violet-400/20 bg-[#11141C] p-3 shadow-[0_30px_80px_rgba(15,17,24,0.7)] sm:rounded-[32px] sm:p-4">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.25),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.2),transparent_28%)]" />
                <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#141823] p-3 sm:rounded-[24px] sm:p-4">
                  <div className="relative overflow-hidden rounded-[18px] sm:rounded-[20px] ring-1 ring-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                    <img
                      src="/gym/hero.jpeg"
                      alt="Peter-GYM bodybuilder hero image"
                      className="h-[260px] w-full rounded-[18px] object-cover object-center sm:h-[460px] [object-position:center_8%] scale-[1.12] contrast-[1.08] saturate-[0.9] -translate-y-3 sm:-translate-y-6"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/25 to-[#090A0F]/10" />
                  </div>

                  <div className="absolute left-3 top-2 rounded-xl border border-violet-400/20 bg-[#090A0F]/70 p-2 shadow-lg backdrop-blur-md sm:left-6 sm:top-5 sm:p-2.5">
                    <div className="text-[8px] uppercase tracking-[0.22em] text-slate-400 sm:text-[9px]">
                      Body score
                    </div>
                    <div className="mt-1.5 text-lg font-bold text-white sm:text-xl">
                      88%
                    </div>
                    <div className="mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-white/5 sm:w-20">
                      <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-violet-500 to-emerald-400" />
                    </div>
                  </div>

                  <div className="absolute right-3 bottom-2 rounded-xl border border-emerald-400/20 bg-[#090A0F]/70 p-2 shadow-lg backdrop-blur-md sm:right-6 sm:bottom-3 sm:p-2.5">
                    <div className="text-[8px] uppercase tracking-[0.18em] text-slate-400 sm:text-[9px]">
                      Weekly gain
                    </div>
                    <div className="mt-1 text-base font-bold text-white sm:text-xl">
                      +18.2%
                    </div>
                    <div className="mt-0.5 text-[8px] text-emerald-300 sm:text-[9px]">
                      strength & definition
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-200/80">
              Body transformation
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Precision training for a sharper, stronger physique
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                badge: "Cut & define",
                title: "Lean strength",
                description:
                  "Build a tighter physique with disciplined programming and measurable progress.",
                image: equipmentGallery[2],
              },
              {
                badge: "Mass drive",
                title: "Power build",
                description:
                  "Train for explosive strength, size, and confidence with guided performance blocks.",
                image: equipmentGallery[1],
              },
              {
                badge: "Elite routine",
                title: "Performance mode",
                description:
                  "Turn repetition into results with premium coaching and a stronger training rhythm.",
                image: equipmentGallery[0],
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group overflow-hidden rounded-[30px] border border-violet-400/10 bg-[#11141B] shadow-[0_20px_60px_rgba(15,17,24,0.5)] transition duration-300 hover:-translate-y-1 hover:border-violet-400/30"
              >
                <div className="relative h-[440px] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105 grayscale-[0.08] [object-position:center_20%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090A0F] via-[#090A0F]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <span className="inline-flex rounded-full border border-white/10 bg-[#090A0F]/55 px-2.5 py-1 text-[9px] uppercase tracking-[0.22em] text-violet-100 backdrop-blur-sm">
                      {item.badge}
                    </span>
                    <h3 className="mt-3 text-2xl font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mb-10 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-violet-200/80">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Everything your gym needs to grow
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Member Management",
                icon: Users,
                desc: "Track members, onboarding, renewals, and engagement at a glance.",
              },
              {
                title: "Membership Plans",
                icon: CreditCard,
                desc: "Build premium membership tiers and keep billing simple.",
              },
              {
                title: "Attendance Tracking",
                icon: CalendarDays,
                desc: "Monitor check-ins and studio activity in real time.",
              },
              {
                title: "Workout Management",
                icon: Dumbbell,
                desc: "Create plans, assign routines, and track performance.",
              },
              {
                title: "Performance Insights",
                icon: ShieldCheck,
                desc: "Monitor progress, retention, and performance without extra role complexity.",
              },
              {
                title: "Classes and Scheduling",
                icon: Bell,
                desc: "Plan sessions, capacity, and events with zero complexity.",
              },
              {
                title: "Payments and Reports",
                icon: TrendingUp,
                desc: "See revenue, collect payments, and analyze growth trends.",
              },
              {
                title: "Unified Dashboards",
                icon: LayoutDashboard,
                desc: "Deliver optimized experiences for a single admin workflow and member access.",
              },
            ].map(({ title, icon: Icon, desc }) => (
              <div
                key={title}
                className="group rounded-[24px] border border-violet-400/10 bg-[#11141B] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-[0_18px_40px_rgba(139,92,246,0.12)]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-emerald-400/20 text-violet-100 ring-1 ring-violet-400/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-violet-400/10 bg-[#0d0f15]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-violet-200/80">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white">
                Start building your fitness system in minutes
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Register your account",
                  desc: "Create your gym profile and get your personalized workspace ready in a few clicks.",
                },
                {
                  step: "02",
                  title: "Find or join a gym",
                  desc: "Connect with your gym, manage memberships, and organize your routine around real needs.",
                },
                {
                  step: "03",
                  title: "Manage your fitness journey",
                  desc: "Track workouts, attendance, schedules, and progress all from one dashboard.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-[26px] border border-violet-400/10 bg-[#11141B] p-6 text-center"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-emerald-400 text-sm font-black text-[#090A0F]">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[30px] border border-violet-400/10 bg-[linear-gradient(135deg,rgba(139,92,246,0.12),rgba(52,211,153,0.08),rgba(17,20,27,1))] p-8 text-center shadow-[0_0_0_1px_rgba(139,92,246,0.06)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-violet-200/80">
              Get started
            </p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Build a stronger, smarter gym experience.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
              Whether you're running a gym or joining one, Peter-GYM gives every
              stakeholder the tools to perform better, plan smarter, and stay
              motivated.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="inline-flex rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 px-6 py-3 text-sm font-semibold text-[#090A0F]"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-violet-400/30"
              >
                Login
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="contact"
        className="border-t border-violet-400/10 bg-[#090A0F]"
      >
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-slate-300 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr] lg:px-8">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <BrandLogo mode="mark" className="h-9 w-9 rounded-xl" />
              <div>
                <div className="font-semibold text-white">Peter-GYM</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Smarter fitness
                </div>
              </div>
            </div>
            <p className="max-w-xs text-sm leading-6 text-slate-400">
              Built to streamline operations, improve member experience, and
              help your gym grow sustainably.
            </p>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-white">
              Quick links
            </div>
            <div className="space-y-2 text-slate-400">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="block text-left hover:text-white"
              >
                Home
              </button>
              <a href="#features" className="block hover:text-white">
                Features
              </a>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="block text-left hover:text-white"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="block text-left hover:text-white"
              >
                Register
              </button>
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-white">
              Developer
            </div>
            <div className="space-y-2 text-slate-400">
              <a
                href="https://roomspot.manish25er.workers.dev/portfolio"
                target="_blank"
                rel="noreferrer"
                className="block hover:text-white"
              >
                Portfolio
              </a>
              <a
                href="mailto:manish25er@gmail.com"
                className="block hover:text-white"
              >
                manish25er@gmail.com
              </a>
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-white">Contact</div>
            <div className="space-y-2 text-slate-400">
              <a
                href="mailto:manish25er@gmail.com"
                className="block hover:text-white"
              >
                manish25er@gmail.com
              </a>
              <a href="tel:+916283092662" className="block hover:text-white">
                +91 6283092662
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-violet-400/10 py-4 text-center text-xs text-slate-400">
          © 2026 Peter-GYM. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("gymflow-user");
    return saved ? (JSON.parse(saved) as UserSession) : null;
  });

  useEffect(() => {
    if (!firebaseEnabled || !auth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        const saved = localStorage.getItem("gymflow-user");
        setUser(saved ? (JSON.parse(saved) as UserSession) : null);
        return;
      }

      try {
        const profileDoc = db
          ? await getDoc(doc(db, "users", firebaseUser.uid))
          : null;
        const profile = profileDoc?.exists() ? profileDoc.data() : null;

        const session: UserSession = {
          id: firebaseUser.uid,
          name:
            profile?.name ||
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "Gym User",
          email: firebaseUser.email || profile?.email || "",
          role:
            (profile?.role as Role) ||
            resolveRoleFromEmail(firebaseUser.email || ""),
          avatar:
            profile?.avatar ||
            (firebaseUser.email
              ? firebaseUser.email.slice(0, 2).toUpperCase()
              : "GU"),
          gymId: profile?.gymId || "gym_1",
        };

        localStorage.setItem("gymflow-user", JSON.stringify(session));
        setUser(session);
      } catch {
        const saved = localStorage.getItem("gymflow-user");
        setUser(saved ? (JSON.parse(saved) as UserSession) : null);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<UserSession | null> => {
    const demoMatch = demoUsers.find(
      (item) => item.email.toLowerCase() === email.toLowerCase(),
    );

    if (firebaseEnabled && auth) {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);

        const profileDoc = db
          ? await getDoc(doc(db, "users", result.user.uid))
          : null;
        const profile = profileDoc?.exists() ? profileDoc.data() : null;

        const session: UserSession = {
          id: result.user.uid,
          name:
            profile?.name ||
            result.user.displayName ||
            result.user.email?.split("@")[0] ||
            "Gym User",
          email: result.user.email || profile?.email || email,
          role:
            (profile?.role as Role) ||
            resolveRoleFromEmail(result.user.email || email),
          avatar:
            profile?.avatar ||
            (result.user.email
              ? result.user.email.slice(0, 2).toUpperCase()
              : "GU"),
          gymId: profile?.gymId || "gym_1",
        };

        localStorage.setItem("gymflow-user", JSON.stringify(session));
        setUser(session);
        return session;
      } catch {
        if (!demoMatch || password !== "demo1234") {
          return null;
        }
      }
    }

    if (!demoMatch || password !== "demo1234") return null;

    const session: UserSession = {
      id: demoMatch.id,
      name: demoMatch.name,
      email: demoMatch.email,
      role: demoMatch.role,
      avatar: demoMatch.avatar,
      gymId: demoMatch.gymId,
    };

    localStorage.setItem("gymflow-user", JSON.stringify(session));
    setUser(session);
    return session;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: Role = "member",
  ): Promise<UserSession | null> => {
    const sanitizedName = name.trim() || "Gym Member";
    const normalizedRole: Role = role === "member" ? "member" : "member";
    const initials =
      sanitizedName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "GM";

    if (firebaseEnabled && auth && db) {
      try {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const session: UserSession = {
          id: result.user.uid,
          name: sanitizedName,
          email: result.user.email || email,
          role: normalizedRole,
          avatar: initials,
          gymId: "gym_1",
        };

        await setDoc(doc(db, "users", result.user.uid), {
          ...session,
          createdAt: new Date().toISOString(),
        });

        localStorage.setItem("gymflow-user", JSON.stringify(session));
        setUser(session);
        return session;
      } catch {
        return null;
      }
    }

    const session: UserSession = {
      id: `demo-${Date.now()}`,
      name: sanitizedName,
      email,
      role: normalizedRole,
      avatar: initials,
      gymId: "gym_1",
    };

    localStorage.setItem("gymflow-user", JSON.stringify(session));
    setUser(session);
    return session;
  };

  const logout = async () => {
    if (firebaseEnabled && auth) {
      await signOut(auth).catch(() => undefined);
    }

    localStorage.removeItem("gymflow-user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("Auth context missing");
  return context;
}

function ProtectedRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("gymlane-theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    localStorage.setItem("gymlane-theme", theme);
  }, [theme]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const menu = sidebarMenus[user.role];

  const handleLogout = async () => {
    await logout();
    navigate("/home");
  };

  return (
    <div
      className={`${theme === "dark" ? "theme-dark" : "theme-light"} min-h-screen bg-gym-bg text-gym-text`}
    >
      <div className="flex min-h-screen">
        <aside
          className={`${sidebarOpen ? "w-72" : "w-24"} hidden border-r border-gym-border bg-gym-sidebar/90 lg:flex lg:flex-col`}
        >
          <div className="flex items-center justify-between border-b border-gym-border px-4 py-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <BrandLogo mode="mark" className="h-9 w-9 rounded-xl" />
              {sidebarOpen && (
                <div className="text-sm font-semibold text-gym-text">
                  Peter-GYM
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                className="rounded-lg p-1.5 text-gym-muted transition hover:bg-gym-card hover:text-gym-text"
                onClick={() => setSidebarOpen(false)}
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </button>
            )}
          </div>

          <nav className="flex-1 space-y-1.5 overflow-auto px-3 py-4">
            {menu.map(({ to, label, icon: Icon }) => {
              const isLogout = label === "Logout";

              return (
                <NavLink
                  key={to}
                  to={to === "/login" ? "#" : to}
                  onClick={
                    isLogout
                      ? (event) => {
                          event.preventDefault();
                          void handleLogout();
                        }
                      : undefined
                  }
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border border-violet-400/30 bg-violet-500/10 text-violet-200 shadow-[0_0_18px_rgba(139,92,246,0.12)]"
                        : "text-gym-text/70 hover:bg-gym-card hover:text-gym-text"
                    } ${isLogout ? "mt-2 border border-red-500/20 bg-red-500/5 text-red-200 hover:bg-red-500/10" : ""}`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {sidebarOpen && <span>{label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="native-toolbar px-3 py-3 sm:px-4 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                  className="rounded-xl border border-gym-border bg-gym-panel p-2.5 lg:hidden"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div className="flex min-w-0 items-center gap-2 rounded-xl border border-gym-border bg-gym-panel px-2 py-2 text-[11px] text-gym-text/75 sm:text-sm">
                  <BrandLogo mode="mark" className="h-6 w-6 rounded-lg" />
                  <span className="truncate font-medium text-gym-text">
                    {gymProfile.name}
                  </span>
                  <span className="mx-1.5 hidden text-gym-muted sm:mx-2 sm:inline">
                    •
                  </span>
                  <span className="hidden sm:inline">
                    {gymProfile.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden items-center gap-2 rounded-xl border border-gym-border bg-gym-panel px-3 py-2 md:flex">
                  <Search className="h-4 w-4 text-gym-muted" />
                  <input
                    placeholder="Search"
                    className="w-28 bg-transparent text-sm text-gym-text outline-none placeholder:text-gym-muted xl:w-32"
                  />
                </div>
                <button className="rounded-xl border border-gym-border bg-gym-panel p-2.5 text-gym-text/80">
                  <Bell className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="hidden rounded-xl border border-gym-border bg-gym-panel p-2.5 text-gym-text/80 sm:inline-flex"
                  onClick={() =>
                    setTheme((current) =>
                      current === "dark" ? "light" : "dark",
                    )
                  }
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <SunMedium className="h-4 w-4" />
                  ) : (
                    <MoonStar className="h-4 w-4" />
                  )}
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gym-border bg-gym-panel p-1.5 shadow-soft">
                  <BrandLogo mode="mark" className="h-full w-full rounded-lg" />
                </div>
                <div className="hidden items-center gap-2 rounded-xl border border-gym-border bg-gym-panel px-2 py-1.5 sm:flex sm:gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-gym-border bg-gym-card shadow-soft">
                    <ProfileAvatar alt={user.name} className="rounded-full" />
                  </div>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-medium text-gym-text">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-gym-muted">
                      {user.role.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-auto p-3 pb-24 sm:p-4 sm:pb-6 md:p-6">
            {pathname === "/" ? (
              <Navigate to={getRoleRoute(user.role)} replace />
            ) : null}
            <Outlet />
          </main>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-20 bg-slate-950/50 transition-opacity duration-200 lg:hidden ${mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 -translate-x-full border-r border-gym-border bg-gym-panel shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-200 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-gym-border px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandLogo mode="mark" className="h-8 w-8 rounded-xl" />
            <div className="text-sm font-semibold text-gym-text">Peter-GYM</div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1.5 text-gym-muted transition hover:bg-gym-card hover:text-gym-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1.5 p-3">
          {menu.map(({ to, label, icon: Icon }) => {
            const isLogout = label === "Logout";
            return (
              <NavLink
                key={to}
                to={to === "/login" ? "#" : to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? "border border-violet-400/30 bg-violet-500/10 text-violet-200" : "text-gym-text/75 hover:bg-gym-card hover:text-gym-text"} ${isLogout ? "mt-2 border border-red-500/20 bg-red-500/5 text-red-200 hover:bg-red-500/10" : ""}`
                }
                onClick={(event) => {
                  if (isLogout) {
                    event.preventDefault();
                    void handleLogout();
                  }
                  setMobileMenuOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gym-border bg-gym-sidebar/95 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {menu.slice(0, 4).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] ${isActive ? "bg-gym-accent/15 text-gym-accent" : "text-gym-text/65"}`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  accent = "lime",
  detail,
}: {
  label: string;
  value: string;
  change?: string;
  accent?: "lime" | "cyan" | "amber" | "purple";
  detail?: string;
}) {
  const styles: Record<string, string> = {
    lime: "bg-gym-accent/10 text-gym-accent",
    cyan: "bg-cyan-400/10 text-cyan-300",
    amber: "bg-amber-400/10 text-amber-300",
    purple: "bg-violet-400/10 text-violet-300",
  };

  return (
    <div className="panel p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-gym-muted sm:text-sm">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gym-text sm:text-3xl">
            {value}
          </p>
        </div>
        {change && (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-medium sm:text-xs ${styles[accent]}`}
          >
            {change}
          </span>
        )}
      </div>
      {detail && (
        <p className="mt-3 text-[10px] text-gym-muted sm:text-xs">{detail}</p>
      )}
    </div>
  );
}

function DashboardHeroBanner() {
  const totalRevenue = paymentRecords
    .filter((payment) => payment.status === "Paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="relative isolate overflow-hidden rounded-[28px] border border-gym-border bg-gradient-to-r from-[#180f29] via-[#0f141a] to-[#0d1820] p-4 shadow-soft sm:p-5">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: `url(${gymGallery[2]})`,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.42),transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(52,211,153,0.28),transparent_28%)]" />

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500 via-purple-500 to-emerald-400 p-1.5 shadow-glow">
              <BrandLogo mode="mark" className="h-full w-full rounded-xl" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-gym-muted">
                GymLane
              </p>
              <h2 className="mt-1 text-xl font-semibold text-gym-text sm:text-2xl">
                Dashboard overview
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gym-text/75 sm:text-xs">
            <span className="chip border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
              +18.2% this month
            </span>
            <span className="chip border-violet-400/30 bg-violet-500/10 text-violet-200">
              42 classes live
            </span>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-[#11141b]/70 p-3 backdrop-blur-sm sm:p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gym-muted">
              Today
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-gym-text sm:text-3xl">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-gym-muted">
                  Gross monthly revenue
                </p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                +12.4%
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary px-3 py-2 text-xs sm:text-sm">
                Book class
              </button>
              <button className="btn-secondary px-3 py-2 text-xs sm:text-sm">
                View schedule
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121720]/70 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-[11px] text-gym-muted">
              <span>Live studio</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-[#1c2430]">
                <img
                  src={gymGallery[1]}
                  alt="Gym training"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gym-text">
                  HIIT Burn Session
                </p>
                <p className="text-[11px] text-gym-muted">
                  6:30 PM • 24 members
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-gym-text/80">
              <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                <div className="text-base font-semibold text-gym-text">18</div>
                <div className="mt-1">Boxes</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                <div className="text-base font-semibold text-gym-text">92%</div>
                <div className="mt-1">Fill</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-2">
                <div className="text-base font-semibold text-gym-text">6</div>
                <div className="mt-1">Classes</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gym-muted">
              Attendance
            </p>
            <p className="mt-2 text-xl font-semibold text-gym-text">1,284</p>
            <p className="mt-1 text-[11px] text-emerald-300">+96 today</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gym-muted">
              Members
            </p>
            <p className="mt-2 text-xl font-semibold text-gym-text">
              {seedMembers.length}
            </p>
            <p className="mt-1 text-[11px] text-violet-200">+14 new joins</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gym-muted">
              Revenue
            </p>
            <p className="mt-2 text-xl font-semibold text-gym-text">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-amber-300">+12.4% growth</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const totalMembers = seedMembers.length;
  const activeMembers = seedMembers.filter(
    (member) => member.status === "Active",
  ).length;
  const pendingPayments = paymentRecords.filter(
    (payment) => payment.status === "Pending" || payment.status === "Overdue",
  ).length;
  const revenue = paymentRecords
    .filter((payment) => payment.status === "Paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-gym-muted sm:text-sm">
            Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gym-text sm:text-3xl">
            Overview
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select className="input max-w-[110px] bg-gym-panel px-3 py-2 text-xs sm:text-sm">
            <option>7D</option>
            <option>30D</option>
            <option>90D</option>
            <option>1Y</option>
          </select>
          <button className="btn-primary px-3 py-2.5 text-xs sm:text-sm">
            Export
          </button>
        </div>
      </div>

      <DashboardHeroBanner />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Members"
          value={String(totalMembers)}
          change="+12.3%"
          accent="lime"
          detail="vs last month"
        />
        <StatCard
          label="Active"
          value={String(activeMembers)}
          change="+8.4%"
          accent="cyan"
          detail="This week"
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(revenue)}
          change="+15.2%"
          accent="amber"
          detail="Paid"
        />
        <StatCard
          label="Pending"
          value={String(pendingPayments)}
          change="-2.1%"
          accent="purple"
          detail="Needs review"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="panel p-3 sm:p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <div>
              <h3 className="text-base font-semibold sm:text-lg">
                Revenue overview
              </h3>
              <p className="text-xs text-gym-muted sm:text-sm">
                Daily performance
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gym-muted sm:gap-2 sm:text-xs">
              <span className="chip px-2 py-1">Daily</span>
              <span className="chip px-2 py-1">Weekly</span>
            </div>
          </div>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.72} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#A0A7A0"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  stroke="#A0A7A0"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number"
                      ? formatCurrency(value)
                      : formatCurrency(Number(value ?? 0))
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-3 sm:p-4 md:p-5">
          <h3 className="mb-3 text-base font-semibold sm:text-lg">
            Membership mix
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={membershipDistribution}
                  dataKey="value"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={3}
                  stroke="#111315"
                  strokeWidth={4}
                >
                  {membershipDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={
                        ["#8B5CF6", "#34D399", "#FBBF24", "#A78BFA"][index % 4]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number"
                      ? `${value}%`
                      : `${Number(value ?? 0)}%`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-xs sm:text-sm">
            {membershipDistribution.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: [
                        "#8B5CF6",
                        "#34D399",
                        "#FBBF24",
                        "#A78BFA",
                      ][index % 4],
                    }}
                  />
                  {item.name}
                </span>
                <span className="text-gym-muted">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-3 sm:p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold sm:text-lg">Attendance</h3>
            <button className="btn-secondary px-2.5 py-1.5 text-[10px] sm:px-3 sm:py-2 sm:text-xs">
              This Week
            </button>
          </div>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries}>
                <XAxis
                  dataKey="name"
                  stroke="#A0A7A0"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  stroke="#A0A7A0"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <Bar dataKey="members" radius={[6, 6, 0, 0]} fill="#34D399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-3 sm:p-4 md:p-5">
          <h3 className="mb-3 text-base font-semibold sm:text-lg">
            Quick actions
          </h3>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <button
              className="flex items-center gap-2 rounded-2xl border border-gym-border bg-gym-panel p-3 text-left text-[11px] font-medium hover:border-gym-accent/60 sm:gap-3 sm:p-4 sm:text-sm"
              onClick={() => (window.location.href = "/admin/members/new")}
            >
              <Users className="h-4 w-4 text-gym-accent sm:h-5 sm:w-5" /> Add
              Member
            </button>
            <button className="flex items-center gap-2 rounded-2xl border border-gym-border bg-gym-panel p-3 text-left text-[11px] font-medium hover:border-gym-accent/60 sm:gap-3 sm:p-4 sm:text-sm">
              <CreditCard className="h-4 w-4 text-gym-accent sm:h-5 sm:w-5" />{" "}
              Payment
            </button>
            <button className="flex items-center gap-2 rounded-2xl border border-gym-border bg-gym-panel p-3 text-left text-[11px] font-medium hover:border-gym-accent/60 sm:gap-3 sm:p-4 sm:text-sm">
              <CheckCircle2 className="h-4 w-4 text-gym-accent sm:h-5 sm:w-5" />{" "}
              Check-in
            </button>
            <button className="flex items-center gap-2 rounded-2xl border border-gym-border bg-gym-panel p-3 text-left text-[11px] font-medium hover:border-gym-accent/60 sm:gap-3 sm:p-4 sm:text-sm">
              <Dumbbell className="h-4 w-4 text-gym-accent sm:h-5 sm:w-5" />{" "}
              Trainer
            </button>
          </div>
        </div>
      </div>

      <div className="panel p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-gym-muted sm:text-sm">
              Website features
            </p>
            <h3 className="mt-2 text-xl font-semibold text-gym-text">
              Gym essentials available
            </h3>
          </div>
          <button
            className="btn-secondary px-3 py-2 text-xs"
            onClick={() => (window.location.href = "/admin/features")}
          >
            Open feature hub
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Group Classes",
              detail: "Strength, yoga, HIIT, and bootcamp bookings.",
              metric: "18 live classes",
            },
            {
              title: "Personal Coaching",
              detail: "Nutrition plans and personal trainer assignments.",
              metric: "24 active coaches",
            },
            {
              title: "Progress Tracking",
              detail: "Body metrics, weight goals, and workout streaks.",
              metric: "94% retention",
            },
            {
              title: "Membership Automation",
              detail: "Auto-renewals, billing reminders, and plan updates.",
              metric: "4 plans live",
            },
            {
              title: "Member Engagement",
              detail: "Push alerts, community updates, and milestone pushes.",
              metric: "1.2k messages",
            },
            {
              title: "Smart Check-ins",
              detail: "Fast member entry, attendance gates, and access logs.",
              metric: "870 today",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gym-border bg-gym-panel p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="rounded-xl bg-gym-accent/10 p-2 text-gym-accent">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="chip px-2 py-1 text-[10px]">Enabled</span>
              </div>
              <p className="mt-4 text-base font-semibold text-gym-text">
                {feature.title}
              </p>
              <p className="mt-2 text-sm text-gym-muted">{feature.detail}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gym-accent">
                {feature.metric}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-3 sm:p-4 md:p-5">
          <h3 className="mb-3 text-base font-semibold sm:text-lg">
            Recent registrations
          </h3>
          <div className="space-y-2.5 sm:space-y-3">
            {seedMembers.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-gym-border bg-gym-panel px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gym-accent/15 text-[11px] font-semibold text-gym-accent sm:h-10 sm:w-10 sm:text-sm">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gym-text sm:text-sm">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-gym-muted sm:text-xs">
                      {member.plan} • {member.membershipEnd}
                    </p>
                  </div>
                </div>
                <span className="chip px-2 py-1 text-[10px] sm:text-[11px]">
                  {member.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-3 sm:p-4 md:p-5">
          <h3 className="mb-3 text-base font-semibold sm:text-lg">Payments</h3>
          <div className="space-y-2.5 sm:space-y-3">
            {paymentRecords.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-xl border border-gym-border bg-gym-panel px-3 py-2.5"
              >
                <div>
                  <p className="text-xs font-medium text-gym-text sm:text-sm">
                    {payment.member}
                  </p>
                  <p className="text-[10px] text-gym-muted sm:text-xs">
                    {payment.method} • {payment.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gym-text sm:text-sm">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-[10px] text-gym-muted sm:text-xs">
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MembersPage() {
  const [members, setMembers] = useState<MemberRecord[]>(seedMembers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const filteredMembers = members.filter((member) => {
    const matchesQuery = [
      member.name,
      member.email,
      member.phone,
      member.memberId,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesStatus = status === "All" || member.status === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
            Members
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Member directory</h1>
        </div>
        <a href="/admin/members/new" className="btn-primary">
          Add member
        </a>
      </div>

      <div className="panel p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
            placeholder="Search name, email, phone, ID"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input"
          >
            <option value="All">All status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
          <button className="btn-secondary">Export CSV</button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gym-border text-left text-sm">
            <thead className="bg-gym-panel">
              <tr>
                <th className="px-4 py-3 font-medium text-gym-muted">Member</th>
                <th className="px-4 py-3 font-medium text-gym-muted">Plan</th>
                <th className="px-4 py-3 font-medium text-gym-muted">
                  Trainer
                </th>
                <th className="px-4 py-3 font-medium text-gym-muted">Expiry</th>
                <th className="px-4 py-3 font-medium text-gym-muted">Status</th>
                <th className="px-4 py-3 font-medium text-gym-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border bg-gym-card/60">
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gym-accent/15 font-semibold text-gym-accent">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gym-text">
                          {member.name}
                        </p>
                        <p className="text-xs text-gym-muted">
                          {member.memberId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gym-text/90">{member.plan}</td>
                  <td className="px-4 py-3 text-gym-text/90">
                    {member.trainer}
                  </td>
                  <td className="px-4 py-3 text-gym-text/90">
                    {member.membershipEnd}
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip">{member.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary px-2.5 py-1.5 text-xs"
                        onClick={() =>
                          (window.location.href = `/admin/members/${member.id}`)
                        }
                      >
                        View
                      </button>
                      <button
                        className="btn-primary px-2.5 py-1.5 text-xs"
                        onClick={() =>
                          (window.location.href = `/admin/members/${member.id}/edit`)
                        }
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MemberFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "Premium",
    trainer: "Daniel Lee",
    status: "Active" as MemberStatus,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const newMember: MemberRecord = {
      id: `m${Date.now()}`,
      memberId: `GF-${Math.floor(1000 + Math.random() * 9000)}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      avatar: form.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
      dob: "1995-01-01",
      emergencyContact: "Not provided",
      address: "New member profile",
      joinDate: new Date().toISOString().slice(0, 10),
      plan: form.plan,
      membershipStart: new Date().toISOString().slice(0, 10),
      membershipEnd: new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .slice(0, 10),
      trainer: form.trainer,
      status: form.status,
      notes: "Created from add member form",
    };
    seedMembers.unshift(newMember);
    navigate("/admin/members");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
          Members
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Add new member</h1>
      </div>

      <form onSubmit={handleSubmit} className="panel space-y-5 p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-gym-muted">
            <span>Full name</span>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="space-y-2 text-sm text-gym-muted">
            <span>Email</span>
            <input
              required
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="space-y-2 text-sm text-gym-muted">
            <span>Phone</span>
            <input
              required
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="space-y-2 text-sm text-gym-muted">
            <span>Membership plan</span>
            <select
              className="input"
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
            >
              {membershipPlans.map((plan) => (
                <option key={plan.id}>{plan.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-gym-muted">
            <span>Assigned trainer</span>
            <select
              className="input"
              value={form.trainer}
              onChange={(e) => setForm({ ...form, trainer: e.target.value })}
            >
              {trainers.map((trainer) => (
                <option key={trainer.id}>{trainer.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-gym-muted">
            <span>Status</span>
            <select
              className="input"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as MemberStatus })
              }
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/admin/members")}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save member
          </button>
        </div>
      </form>
    </div>
  );
}

function MembershipsPage() {
  const [plans, setPlans] = useState<PlanRecord[]>(membershipPlans);

  const togglePlan = (planId: string) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              status: plan.status === "Active" ? "Archived" : "Active",
            }
          : plan,
      ),
    );
  };

  const [billingCycle, setBillingCycle] = useState<
    "Monthly" | "Quarterly" | "Annual"
  >("Monthly");
  const cycleKey = billingCycle.toLowerCase() as
    | "monthly"
    | "quarterly"
    | "annual";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
            Memberships
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Plans and renewals</h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gym-border bg-gym-panel p-1">
          {(["Monthly", "Quarterly", "Annual"] as const).map((cycle) => (
            <button
              key={cycle}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${billingCycle === cycle ? "bg-gym-accent text-[#0d0e14]" : "text-gym-muted hover:text-gym-text"}`}
              onClick={() => setBillingCycle(cycle)}
            >
              {cycle}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {plans.map((plan) => {
          const price = plan.pricing?.[cycleKey] ?? plan.price;
          return (
            <div key={plan.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-semibold text-gym-text">
                    {plan.name}
                  </p>
                  <p className="mt-1 text-sm text-gym-muted">
                    {plan.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] ${plan.status === "Active" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}
                >
                  {plan.status}
                </span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold">
                    {formatCurrency(price)}
                  </p>
                  <p className="text-xs text-gym-muted">
                    {billingCycle} billing
                  </p>
                </div>
                <button
                  className="btn-secondary px-3 py-2 text-xs"
                  onClick={() => togglePlan(plan.id)}
                >
                  {plan.status === "Active" ? "Archive" : "Activate"}
                </button>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gym-muted">
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gym-accent" />{" "}
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentQrCode({ size = 92 }: { size?: number }) {
  const cells = Array.from({ length: 25 }, (_, index) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const isFinder =
      (row < 2 && col < 2) || (row < 2 && col > 2) || (row > 2 && col < 2);
    const isCenter = row === 2 && col === 2;
    const isFilled = isFinder || isCenter || (row + col + index) % 3 === 0;
    return { row, col, isFilled };
  });

  return (
    <div
      className="grid place-items-center rounded-2xl border border-violet-200/40 bg-white p-2 shadow-lg shadow-violet-500/10"
      style={{ width: size, height: size }}
    >
      <div
        className="grid grid-cols-5 gap-1"
        style={{ width: size - 18, height: size - 18 }}
      >
        {cells.map((cell, index) => (
          <span
            key={`${cell.row}-${cell.col}-${index}`}
            className={`block rounded-[2px] ${cell.isFilled ? "bg-violet-900" : "bg-transparent"}`}
          />
        ))}
      </div>
    </div>
  );
}

function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>(paymentRecords);
  const [form, setForm] = useState({
    member: "Sarah L.",
    amount: "4999",
    method: "UPI",
    status: "Paid" as PaymentStatus,
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "UPI" | "Google Pay" | "PhonePe"
  >("UPI");
  const [paymentState, setPaymentState] = useState<
    "idle" | "processing" | "success"
  >("idle");
  const [showToast, setShowToast] = useState(false);
  const upiId = "7087338600@ybl";

  const paymentOptions = [
    {
      id: "UPI",
      name: "UPI",
      accent: "from-violet-500 to-purple-500",
      badge: "UPI",
    },
    {
      id: "Google Pay",
      name: "Google Pay",
      accent: "from-blue-500 to-cyan-400",
      badge: "G",
    },
    {
      id: "PhonePe",
      name: "PhonePe",
      accent: "from-indigo-500 to-violet-500",
      badge: "P",
    },
  ] as const;

  const handlePayNow = () => {
    const amount = Number(form.amount || 0);
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("GymLane")}&am=${amount}&cu=INR&tn=${encodeURIComponent("GymLane Membership Payment")}`;

    setPaymentState("processing");
    setShowToast(false);
    setForm((current) => ({ ...current, status: "Pending" }));

    window.setTimeout(() => {
      setPaymentState("success");
      setShowToast(true);
      setForm((current) => ({ ...current, status: "Paid" }));
      setPayments((current) => [
        {
          id: `pay${Date.now()}`,
          member: form.member,
          memberId: "GF-9999",
          amount: Number(form.amount),
          currency: "INR",
          method: selectedPaymentMethod as PaymentRecord["method"],
          date: new Date().toISOString().slice(0, 10),
          status: "Paid",
          reference: `AUTO-${Date.now()}`,
          notes: "UPI payment confirmation",
        },
        ...current,
      ]);

      window.setTimeout(() => {
        setShowToast(false);
      }, 2200);
    }, 900);

    try {
      window.location.href = upiLink;
    } catch {
      // fallback if the app cannot open the UPI scheme
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const newPayment: PaymentRecord = {
      id: `pay${Date.now()}`,
      member: form.member,
      memberId: "GF-9999",
      amount: Number(form.amount),
      currency: "INR",
      method: form.method as PaymentRecord["method"],
      date: new Date().toISOString().slice(0, 10),
      status: form.status,
      reference: `AUTO-${Date.now()}`,
      notes: "Manual entry",
    };
    setPayments((current) => [newPayment, ...current]);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
          Payments
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Billing and revenue</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        {showToast && (
          <div className="fixed right-4 top-24 z-50 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 shadow-lg shadow-emerald-500/10 backdrop-blur-md sm:right-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-lg">
              ✓
            </div>
            Payment successful — membership is now active.
          </div>
        )}

        <form onSubmit={handleSubmit} className="panel space-y-4 p-5">
          <div className="rounded-2xl border border-gym-border bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-emerald-500/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] text-gym-muted">
                  Wallet
                </p>
                <h3 className="mt-2 text-xl font-semibold text-gym-text">
                  Secure checkout
                </h3>
              </div>
              <span className="chip border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                SSL secure
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between gap-2">
              <div>
                <p className="text-[11px] text-gym-muted">Total amount</p>
                <p className="mt-1 text-3xl font-semibold text-gym-text">
                  {formatCurrency(Number(form.amount || 0))}
                </p>
              </div>
              <div className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[10px] text-violet-200">
                {selectedPaymentMethod}
              </div>
            </div>
          </div>

          {paymentState === "success" && (
            <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 to-emerald-400/5 p-4 shadow-lg shadow-emerald-500/10 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-xl text-emerald-300">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-300">
                    Payment successful
                  </p>
                  <p className="text-xs text-gym-muted">
                    Your membership payment has been confirmed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {paymentState === "processing" && (
            <div className="rounded-2xl border border-violet-400/30 bg-violet-500/5 p-3 text-sm text-violet-200">
              Processing your secure payment…
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {paymentOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelectedPaymentMethod(option.id);
                  setForm((current) => ({ ...current, method: option.id }));
                }}
                className={`rounded-2xl border p-3 text-left transition ${selectedPaymentMethod === option.id ? "border-gym-accent bg-gym-accent/10" : "border-gym-border bg-gym-panel"}`}
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${option.accent} font-black text-white`}
                >
                  {option.badge}
                </div>
                <p className="text-sm font-medium text-gym-text">
                  {option.name}
                </p>
              </button>
            ))}
          </div>

          <label className="space-y-2 text-sm text-gym-muted">
            <span>Member</span>
            <input
              className="input"
              value={form.member}
              onChange={(e) => setForm({ ...form, member: e.target.value })}
            />
          </label>
          <label className="space-y-2 text-sm text-gym-muted">
            <span>Amount</span>
            <input
              type="number"
              className="input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>

          <div className="rounded-2xl border border-gym-border bg-gym-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gym-muted">
                  UPI ID
                </p>
                <p className="mt-2 text-sm font-medium text-gym-text">
                  {upiId}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePayNow}
                className="btn-primary px-3 py-2 text-xs"
              >
                Pay now
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gym-border bg-gym-card p-3">
              <PaymentQrCode size={88} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gym-text">
                  Scan to pay
                </p>
                <p className="mt-1 text-xs text-gym-muted">
                  Open any UPI app and scan this code to complete payment
                  securely.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gym-border bg-[#0f1217] p-3">
              <div className="flex items-center justify-between text-xs text-gym-muted">
                <span>Amount</span>
                <span className="font-semibold text-gym-text">
                  {formatCurrency(Number(form.amount || 0))}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gym-muted">
                <span>Method</span>
                <span className="font-semibold text-gym-text">
                  {selectedPaymentMethod}
                </span>
              </div>
            </div>

            {paymentState === "success" && (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">
                      Receipt
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gym-text">
                      Membership activated
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200">
                    Received
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gym-muted">
                  <span>Reference</span>
                  <span className="font-medium text-gym-text">
                    AUTO-{Date.now().toString().slice(-6)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <label className="space-y-2 text-sm text-gym-muted">
            <span>Status</span>
            <select
              className="input"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as PaymentStatus })
              }
            >
              <option>Paid</option>
              <option>Pending</option>
              <option>Failed</option>
              <option>Refunded</option>
              <option>Overdue</option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handlePayNow}
              className="btn-primary w-full"
              disabled={paymentState === "processing"}
            >
              {paymentState === "processing" ? "Processing..." : "Pay via UPI"}
            </button>
            <button type="submit" className="btn-secondary w-full">
              Save payment
            </button>
          </div>
        </form>

        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gym-border text-sm">
              <thead className="bg-gym-panel">
                <tr>
                  <th className="px-4 py-3 text-left text-gym-muted">Member</th>
                  <th className="px-4 py-3 text-left text-gym-muted">Amount</th>
                  <th className="px-4 py-3 text-left text-gym-muted">Method</th>
                  <th className="px-4 py-3 text-left text-gym-muted">Status</th>
                  <th className="px-4 py-3 text-left text-gym-muted">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-gym-text">
                      {payment.member}
                    </td>
                    <td className="px-4 py-3 text-gym-text">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-gym-text/80">
                      {payment.method}
                    </td>
                    <td className="px-4 py-3">
                      <span className="chip">{payment.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gym-text/80">
                      {payment.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendancePage() {
  const [attendance, setAttendance] = useState(attendanceRecords);

  const checkInMember = () => {
    const member = seedMembers[0];
    setAttendance((current) => [
      {
        id: `att-${Date.now()}`,
        memberId: member.memberId,
        memberName: member.name,
        date: new Date().toISOString().slice(0, 10),
        checkIn: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        status: "Checked In",
      },
      ...current,
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
            Attendance
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Check-ins and visits</h1>
        </div>
        <button className="btn-primary" onClick={checkInMember}>
          Check member in
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gym-border text-sm">
            <thead className="bg-gym-panel">
              <tr>
                <th className="px-4 py-3 text-left text-gym-muted">Member</th>
                <th className="px-4 py-3 text-left text-gym-muted">Date</th>
                <th className="px-4 py-3 text-left text-gym-muted">Check-in</th>
                <th className="px-4 py-3 text-left text-gym-muted">
                  Check-out
                </th>
                <th className="px-4 py-3 text-left text-gym-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border">
              {attendance.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3 font-medium text-gym-text">
                    {entry.memberName}
                  </td>
                  <td className="px-4 py-3 text-gym-text/80">{entry.date}</td>
                  <td className="px-4 py-3 text-gym-text/80">
                    {entry.checkIn}
                  </td>
                  <td className="px-4 py-3 text-gym-text/80">
                    {entry.checkOut || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="chip">{entry.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TrainersPage() {
  const [list, setList] = useState<TrainerRecord[]>(trainers);
  const [form, setForm] = useState({
    name: "",
    email: "",
    specialty: "Strength",
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const newTrainer: TrainerRecord = {
      id: `t${Date.now()}`,
      name: form.name,
      email: form.email,
      phone: "+91 9999888777",
      avatar: form.name.slice(0, 2).toUpperCase(),
      specialties: [form.specialty],
      experience: "2 years",
      certifications: ["Certified Trainer"],
      availability: "Mon-Sun 9am-5pm",
      status: "Active",
    };
    setList((current) => [newTrainer, ...current]);
    setForm({ name: "", email: "", specialty: "Strength" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
            Trainers
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Coach management</h1>
        </div>
        <button
          className="btn-primary"
          onClick={() =>
            document
              .getElementById("trainer-form")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Add trainer
        </button>
      </div>

      <form
        id="trainer-form"
        onSubmit={handleSubmit}
        className="panel grid gap-4 p-5 md:grid-cols-3"
      >
        <input
          className="input"
          placeholder="Trainer name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Trainer email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <select
          className="input"
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
        >
          <option>Strength</option>
          <option>Cardio</option>
          <option>Yoga</option>
          <option>Mobility</option>
        </select>
        <button type="submit" className="btn-primary md:col-span-3">
          Save trainer
        </button>
      </form>

      <div className="grid gap-4 xl:grid-cols-2">
        {list.map((trainer) => (
          <div key={trainer.id} className="panel p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gym-accent/15 font-semibold text-gym-accent">
                  {trainer.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gym-text">{trainer.name}</p>
                  <p className="text-xs text-gym-muted">
                    {trainer.specialties.join(", ")}
                  </p>
                </div>
              </div>
              <span className="chip">{trainer.status}</span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-gym-muted">
              <p>Email: {trainer.email}</p>
              <p>Experience: {trainer.experience}</p>
              <p>Availability: {trainer.availability}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkoutsPage() {
  const [plans, setPlans] = useState<WorkoutRecord[]>(workoutPlans);

  const addWorkout = () => {
    setPlans((current) => [
      {
        id: `w${Date.now()}`,
        title: "HIIT Burn",
        day: "Saturday",
        duration: "40 min",
        focus: "Fat loss",
        exercises: ["Jump squat", "Burpees", "Band rows", "Mountain climbers"],
      },
      ...current,
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
            Workouts
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Programs & goals</h1>
        </div>
        <button className="btn-primary" onClick={addWorkout}>
          Add workout
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-gym-text">
                  {plan.title}
                </p>
                <p className="text-sm text-gym-muted">
                  {plan.day} • {plan.duration}
                </p>
              </div>
              <span className="chip">{plan.focus}</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gym-muted">
              {plan.exercises.map((exercise) => (
                <li key={exercise} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gym-accent" />{" "}
                  {exercise}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(14);
  const [monthOffset, setMonthOffset] = useState(0);

  const currentMonth = new Date();
  currentMonth.setMonth(currentMonth.getMonth() + monthOffset);

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const startDay = firstDay.getDay();
  const totalDays = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();

  const days = Array.from({ length: 42 }, (_, index) => {
    const day = index - startDay + 1;
    return day > 0 && day <= totalDays ? day : null;
  });

  const events = [
    { time: "6:30 AM", title: "HIIT Burn", color: "violet" },
    { time: "9:00 AM", title: "Strength Lab", color: "emerald" },
    { time: "5:30 PM", title: "Yoga Flow", color: "amber" },
    { time: "7:15 PM", title: "Power Circuit", color: "violet" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
            Calendar
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Classes & schedule</h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gym-border bg-gym-panel p-1">
          <button
            className="btn-secondary px-2.5 py-1.5 text-xs"
            onClick={() => setMonthOffset((current) => current - 1)}
          >
            Prev
          </button>
          <button
            className="btn-secondary px-2.5 py-1.5 text-xs"
            onClick={() => setMonthOffset((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-3 sm:p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{monthLabel}</h2>
            <span className="chip">{events.length} sessions</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase tracking-[0.2em] text-gym-muted sm:text-[11px]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              const isSelected = day === selectedDate;
              return (
                <button
                  key={`${day ?? "empty"}-${index}`}
                  type="button"
                  onClick={() => day && setSelectedDate(day)}
                  className={`min-h-[54px] rounded-xl border text-sm transition ${
                    day === null
                      ? "border-transparent bg-transparent text-transparent"
                      : isSelected
                        ? "border-violet-400/40 bg-violet-500/10 text-violet-200"
                        : "border-gym-border bg-gym-panel text-gym-text hover:border-gym-accent/60"
                  }`}
                >
                  {day ?? ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-sm uppercase tracking-[0.2em] text-gym-muted">
              Selected day
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              {selectedDate} {monthLabel.split(" ")[0]}
            </h3>
          </div>

          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={`${event.time}-${event.title}`}
                className="rounded-2xl border border-gym-border bg-gym-panel p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-gym-muted">
                    {event.time}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      event.color === "violet"
                        ? "bg-violet-400"
                        : event.color === "emerald"
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                    }`}
                  />
                </div>
                <p className="mt-2 font-medium text-gym-text">{event.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
          Reports
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Analytics & exports</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="New registrations"
          value="128"
          change="+22%"
          accent="lime"
        />
        <StatCard
          label="Member retention"
          value="89%"
          change="+4.5%"
          accent="cyan"
        />
        <StatCard
          label="Revenue total"
          value={formatCurrency(264000)}
          change="+19%"
          accent="amber"
        />
        <StatCard
          label="Overdue invoices"
          value="14"
          change="-6%"
          accent="purple"
        />
      </div>
    </div>
  );
}

function GymFeaturesPage() {
  const features = [
    {
      title: "Smart membership",
      description: "Flexible plans, auto-renewals, and payment reminders.",
      status: "Live",
      tone: "bg-gym-accent/10 text-gym-accent",
    },
    {
      title: "Group class booking",
      description:
        "Book sessions, manage capacity, and automate confirmation texts.",
      status: "Live",
      tone: "bg-emerald-400/10 text-emerald-300",
    },
    {
      title: "Trainer tracking",
      description:
        "Assign members, schedule sessions, and monitor coach performance.",
      status: "Live",
      tone: "bg-cyan-400/10 text-cyan-300",
    },
    {
      title: "Nutrition coaching",
      description:
        "Meal plans, habit tracking, and progress check-ins for members.",
      status: "Beta",
      tone: "bg-amber-400/10 text-amber-300",
    },
    {
      title: "Member rewards",
      description:
        "Loyalty points, referral incentives, and achievement badges.",
      status: "Live",
      tone: "bg-violet-400/10 text-violet-300",
    },
    {
      title: "Gym CRM alerts",
      description:
        "Proactive retention workflows, attendance nudges, and reminders.",
      status: "Live",
      tone: "bg-rose-400/10 text-rose-300",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
          Feature hub
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Gym website capabilities
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-gym-text">
                  {feature.title}
                </p>
                <p className="mt-2 text-sm text-gym-muted">
                  {feature.description}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${feature.tone}`}
              >
                {feature.status}
              </span>
            </div>
            <div className="mt-5 rounded-2xl border border-gym-border bg-gym-panel p-3 text-sm text-gym-text/85">
              <div className="flex items-center justify-between">
                <span>Availability</span>
                <span className="font-semibold text-gym-accent">Ready</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gym-card">
                <div className="h-full w-[82%] rounded-full bg-gym-accent" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsPage() {
  const [items, setItems] = useState(notifications);

  const markRead = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
          Notifications
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Alerts & inbox</h1>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`panel flex items-start justify-between gap-4 p-4 ${item.read ? "border-gym-border" : "border-gym-accent/30 bg-gym-card"}`}
          >
            <div>
              <p className="font-medium text-gym-text">{item.title}</p>
              <p className="mt-1 text-sm text-gym-muted">{item.message}</p>
            </div>
            <div className="flex items-center gap-3">
              {!item.read && (
                <span className="h-2.5 w-2.5 rounded-full bg-gym-accent" />
              )}
              <button
                className="btn-secondary px-2.5 py-1.5 text-xs"
                onClick={() => markRead(item.id)}
              >
                Mark read
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type DeveloperProfileRecord = {
  name: string;
  title: string;
  project: string;
  portfolio: string;
  tagline: string;
  bio: string;
  email: string;
  phone: string;
  image: string;
};

const defaultDeveloperProfile: DeveloperProfileRecord = {
  name: "Er. Manish Kumar",
  title: "Software Engineer",
  project: "Peter-GYM",
  portfolio: "https://roomspot.manish25er.workers.dev/portfolio",
  tagline: "Building smarter fitness experiences through technology.",
  bio: "I design digital experiences that connect performance, coaching, and modern gym operations into one premium ecosystem.",
  email: "manish25er@gmail.com",
  phone: "6283092662 / 7087338600",
  image: profilePhoto,
};

function MyProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold">My Profile</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-gym-border bg-gym-card shadow-soft">
              <ProfileAvatar alt={user.name} className="rounded-full" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gym-text">{user.name}</p>
              <p className="text-sm text-gym-muted">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gym-border bg-gym-panel p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-gym-muted">
                Email
              </p>
              <p className="mt-2 text-sm text-gym-text">{user.email}</p>
            </div>
            <div className="rounded-2xl border border-gym-border bg-gym-panel p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-gym-muted">
                Gym ID
              </p>
              <p className="mt-2 text-sm text-gym-text">{user.gymId}</p>
            </div>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Preferences</h2>
          <div className="mt-4 space-y-3 text-sm text-gym-muted">
            <div className="flex items-center justify-between rounded-xl border border-gym-border bg-gym-panel px-3 py-2">
              <span>Theme mode</span>
              <span className="text-gym-text">System sync</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gym-border bg-gym-panel px-3 py-2">
              <span>Notification alerts</span>
              <span className="text-gym-text">Enabled</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gym-border bg-gym-panel px-3 py-2">
              <span>Security</span>
              <span className="text-gym-text">Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeveloperProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DeveloperProfileRecord | null>(null);
  const [form, setForm] = useState<DeveloperProfileRecord>(
    defaultDeveloperProfile,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = !!user && user.role === "super_admin";

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        if (!db) {
          if (active) {
            setProfile(defaultDeveloperProfile);
            setForm(defaultDeveloperProfile);
          }
          return;
        }

        const snapshot = await getDoc(doc(db, "developerProfile", "profile"));
        const nextProfile = snapshot.exists()
          ? ({
              ...defaultDeveloperProfile,
              ...snapshot.data(),
            } as DeveloperProfileRecord)
          : defaultDeveloperProfile;

        if (active) {
          setProfile(nextProfile);
          setForm(nextProfile);
        }
      } catch {
        if (active) {
          setError(
            "Unable to load the developer profile. Displaying a fallback profile.",
          );
          setProfile(defaultDeveloperProfile);
          setForm(defaultDeveloperProfile);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setError("");

    try {
      if (db) {
        await setDoc(doc(db, "developerProfile", "profile"), {
          ...form,
          updatedAt: new Date().toISOString(),
        });
      }
      setProfile(form);
      setIsEditing(false);
    } catch {
      setError("The developer profile could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-gym-muted">Loading developer profile…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo mode="mark" className="h-10 w-10 rounded-xl" />
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
                Developer profile
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-gym-text">
                {profile?.project ?? "Peter-GYM"}
              </h1>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditing((value) => !value)}
            >
              {isEditing ? "Cancel" : "Edit profile"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {isEditing && canEdit ? (
        <form onSubmit={handleSave} className="panel space-y-4 p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gym-muted">
              <span>Full name</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm text-gym-muted">
              <span>Professional title</span>
              <input
                className="input"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm text-gym-muted">
              <span>Project</span>
              <input
                className="input"
                value={form.project}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    project: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm text-gym-muted">
              <span>Portfolio URL</span>
              <input
                className="input"
                value={form.portfolio}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    portfolio: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm text-gym-muted md:col-span-2">
              <span>Professional introduction</span>
              <textarea
                className="input min-h-[110px]"
                value={form.bio}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm text-gym-muted">
              <span>Email</span>
              <input
                className="input"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm text-gym-muted">
              <span>Phone</span>
              <input
                className="input"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="panel p-5 sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-violet-400/30 bg-gym-panel p-2 shadow-[0_0_30px_rgba(139,92,246,0.18)] md:mx-0">
                <img
                  src={profile?.image ?? profilePhoto}
                  alt={profile?.name ?? "Er. Manish Kumar Yadav"}
                  className="h-full w-full rounded-full object-cover object-center ring-2 ring-violet-500/30"
                />
              </div>

              <div className="flex-1">
                <div className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.24em] text-emerald-300">
                  {profile?.project ?? "Peter-GYM"}
                </div>
                <h2 className="mt-3 text-3xl font-bold text-gym-text">
                  {profile?.name ?? "Er. Manish Kumar Yadav"}
                </h2>
                <p className="mt-2 text-sm uppercase tracking-[0.24em] text-violet-200/80">
                  {profile?.title ?? "Software Development Engineer"}
                </p>
                <p className="mt-4 max-w-xl text-gym-muted">
                  {profile?.bio ??
                    "I design digital experiences that connect performance, coaching, and modern gym operations into one premium ecosystem."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={
                  profile?.portfolio ??
                  "https://roomspot.manish25er.workers.dev/portfolio"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                View Portfolio
              </a>
              <span className="inline-flex items-center rounded-full border border-gym-border bg-gym-panel px-3 py-2 text-sm text-gym-muted">
                {profile?.tagline ??
                  "Building smarter fitness experiences through technology."}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="panel p-5">
              <h3 className="text-lg font-semibold">Contact information</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-gym-border bg-gym-panel p-3">
                  <Mail className="h-4 w-4 text-violet-300" />
                  <span className="text-sm text-gym-text">
                    {profile?.email ?? "your.email@example.com"}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-gym-border bg-gym-panel p-3">
                  <Users className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm text-gym-text">
                    {profile?.phone ?? "+91 00000 00000"}
                  </span>
                </div>
              </div>
            </div>

            <div className="panel p-5">
              <h3 className="text-lg font-semibold">Brand</h3>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-gym-border bg-gym-panel p-3">
                <BrandLogo mode="mark" className="h-10 w-10 rounded-xl" />
                <div>
                  <p className="font-medium text-gym-text">Peter-GYM</p>
                  <p className="text-xs text-gym-muted">
                    Premium gym technology experiences
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Gym configuration</h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Business profile</h2>
          <div className="mt-4 space-y-3 text-sm text-gym-muted">
            <p>Name: {gymProfile.name}</p>
            <p>Location: {gymProfile.location}</p>
            <p>Timezone: {gymProfile.timezone}</p>
            <p>Currency: {gymProfile.currency}</p>
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">Security</h2>
          <div className="mt-4 space-y-3 text-sm text-gym-muted">
            <p>Firebase Auth: enabled</p>
            <p>App Check: enabled</p>
            <p>Firestore rules: protected</p>
            <p>Session cookies: secure</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
          Users
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Role access</h1>
      </div>
      <div className="panel overflow-hidden">
        <table className="min-w-full divide-y divide-gym-border text-sm">
          <thead className="bg-gym-panel">
            <tr>
              <th className="px-4 py-3 text-left text-gym-muted">Name</th>
              <th className="px-4 py-3 text-left text-gym-muted">Email</th>
              <th className="px-4 py-3 text-left text-gym-muted">Role</th>
              <th className="px-4 py-3 text-left text-gym-muted">Gym</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gym-border">
            {demoUsers.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-3 text-gym-text">{entry.name}</td>
                <td className="px-4 py-3 text-gym-text/80">{entry.email}</td>
                <td className="px-4 py-3 text-gym-text/80">{entry.role}</td>
                <td className="px-4 py-3 text-gym-text/80">
                  {gymProfile.name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemberDashboardPage() {
  const profile = seedMembers[0];
  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
              Welcome back
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{profile.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gym-accent/15 text-xl font-semibold text-gym-accent">
              {profile.avatar}
            </div>
            <div>
              <p className="font-medium text-gym-text">{profile.plan}</p>
              <p className="text-sm text-gym-muted">
                Expires on {profile.membershipEnd}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current plan"
          value={profile.plan}
          change="Active"
          accent="lime"
        />
        <StatCard label="Attendance" value="18" change="+4" accent="cyan" />
        <StatCard
          label="Workout streak"
          value="9 days"
          change="Strong"
          accent="amber"
        />
        <StatCard
          label="Payments"
          value={formatCurrency(4999)}
          change="Paid"
          accent="purple"
        />
      </div>
    </div>
  );
}

function TrainerDashboardPage() {
  const members = seedMembers.slice(0, 3);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-gym-muted">
          Trainer dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Assigned members</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Assigned members"
          value="28"
          change="+7%"
          accent="lime"
        />
        <StatCard label="Today sessions" value="11" change="+3" accent="cyan" />
        <StatCard
          label="Completion rate"
          value="89%"
          change="+6%"
          accent="amber"
        />
      </div>
      <div className="panel p-5">
        <h2 className="mb-4 text-lg font-semibold">Member performance</h2>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-gym-border bg-gym-panel px-3 py-2.5"
            >
              <div>
                <p className="font-medium text-gym-text">{member.name}</p>
                <p className="text-xs text-gym-muted">
                  {member.plan} • {member.membershipEnd}
                </p>
              </div>
              <button className="btn-secondary px-2.5 py-1.5 text-xs">
                Update plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [name, setName] = useState("Er. Manish Kumar Yadav");
  const [email, setEmail] = useState("member@petergym.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to={getRoleRoute(user.role)} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const session = await register(name, email, password);
    if (!session) {
      setError(
        "Unable to create the account. Please check the details and try again.",
      );
      setIsSubmitting(false);
      return;
    }

    navigate(getRoleRoute(session.role));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090A0F] px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-[28px] border border-violet-400/20 bg-slate-950/80 p-5 shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_20px_60px_rgba(15,17,24,0.8)] backdrop-blur-md sm:p-7">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/10">
            <BrandLogo mode="mark" className="h-8 w-8" />
          </div>
          <BrandLogo mode="full" className="h-7 w-auto" />
        </div>

        <div className="mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-violet-200/80">
            Create account
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">Join Peter-GYM</h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Full name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Er. Manish Kumar Yadav"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>Email address</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@petergym.com"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a secure password"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-300">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-semibold text-violet-300 underline underline-offset-2"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("superadmin@gymflow.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = [
    { label: "Admin", email: "superadmin@gymflow.local", password: "demo1234" },
    { label: "Trainer", email: "trainer@gymflow.local", password: "demo1234" },
    { label: "Member", email: "member@gymflow.local", password: "demo1234" },
  ];

  if (user) {
    return <Navigate to={getRoleRoute(user.role)} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    const session = await login(email, password);
    if (!session) {
      setError("Invalid credentials. Use the demo account listed below.");
      setIsSubmitting(false);
      return;
    }

    navigate(getRoleRoute(session.role));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090A0F] px-4 py-8 sm:px-6">
      <div className="w-full max-w-md rounded-[28px] border border-violet-400/20 bg-slate-950/80 p-5 shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_20px_60px_rgba(15,17,24,0.8)] backdrop-blur-md sm:p-7">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/10">
            <BrandLogo mode="mark" className="h-8 w-8" />
          </div>
          <BrandLogo mode="full" className="h-7 w-auto" />
        </div>

        <div className="mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-violet-200/80">
            Welcome back
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">Sign in</h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Email address</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                className="input pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@petergym.com"
              />
            </div>
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>Password</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                className="input pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                onClick={() => setShowPassword((value) => !value)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end text-sm">
            <a
              href="/forgot-password"
              className="font-medium text-violet-300 hover:underline"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-violet-400/15 bg-violet-500/5 p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-violet-200/80">
            Demo accounts
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {demoAccounts.map((account) => (
              <button
                key={account.label}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-left text-[11px] text-slate-200 transition hover:border-violet-400/30 hover:bg-violet-500/5"
              >
                <div className="font-semibold text-white">{account.label}</div>
                <div className="mt-1 truncate text-slate-400">{account.email}</div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-slate-300">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-semibold text-violet-300 underline underline-offset-2"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel w-full max-w-lg p-8">
        <div className="mb-6 flex justify-center">
          <BrandLogo mode="full" className="h-9 w-auto" />
        </div>
        <p className="text-sm uppercase tracking-[0.2em] text-gym-muted">
          Password recovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-gym-muted">
          We will email you a secure reset link if the account exists.
        </p>
        <form className="mt-6 space-y-4">
          <input
            className="input"
            placeholder="Enter your email"
            type="email"
          />
          <button className="btn-primary w-full">Send reset link</button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel w-full max-w-lg p-8">
        <div className="mb-6 flex justify-center">
          <BrandLogo mode="full" className="h-9 w-auto" />
        </div>
        <p className="text-sm uppercase tracking-[0.2em] text-gym-muted">
          Secure reset
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Reset password</h1>
        <form className="mt-6 space-y-4">
          <input className="input" type="password" placeholder="New password" />
          <input
            className="input"
            type="password"
            placeholder="Confirm password"
          />
          <button className="btn-primary w-full">Update password</button>
        </form>
      </div>
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel max-w-lg p-8 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-gym-accent" />
        <h1 className="mt-4 text-3xl font-semibold">Unauthorized</h1>
        <p className="mt-2 text-gym-muted">
          You do not have permission to access this area.
        </p>
        <a href="/login" className="btn-primary mt-6">
          Back to login
        </a>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel max-w-lg p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-gym-accent" />
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-gym-muted">
          The page you requested does not exist.
        </p>
        <a href="/" className="btn-primary mt-6">
          Go home
        </a>
      </div>
    </div>
  );
}

function AppEntry() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={getRoleRoute(user.role)} replace />;
  }

  const introSeen = sessionStorage.getItem("petergym-intro-seen") === "true";
  return <Navigate to={introSeen ? "/home" : "/intro"} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<AppEntry />} />
        <Route path="/intro" element={<SplashIntroPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
          <Route path="/admin" element={<AppShell />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="features" element={<GymFeaturesPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="members/new" element={<MemberFormPage />} />
            <Route path="memberships" element={<MembershipsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="classes" element={<AttendancePage />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="my-profile" element={<MyProfilePage />} />
            <Route
              path="developer-profile"
              element={<DeveloperProfilePage />}
            />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["trainer"]} />}>
          <Route path="/trainer" element={<AppShell />}>
            <Route path="dashboard" element={<TrainerDashboardPage />} />
            <Route path="features" element={<GymFeaturesPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="membership" element={<MembershipsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="classes" element={<AttendancePage />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="my-profile" element={<MyProfilePage />} />
            <Route
              path="developer-profile"
              element={<DeveloperProfilePage />}
            />
            <Route path="schedule" element={<AttendancePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["member"]} />}>
          <Route path="/member" element={<AppShell />}>
            <Route path="dashboard" element={<MemberDashboardPage />} />
            <Route path="features" element={<GymFeaturesPage />} />
            <Route path="membership" element={<MembershipsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="classes" element={<AttendancePage />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="my-profile" element={<MyProfilePage />} />
            <Route
              path="developer-profile"
              element={<DeveloperProfilePage />}
            />
            <Route path="profile" element={<MyProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
