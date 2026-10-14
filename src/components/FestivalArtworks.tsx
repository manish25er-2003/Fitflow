import type { FestiveType } from "../types";

/**
 * Diwali: Traditional glowing terracotta Diya with animated multi-layered flame
 */
export function DiwaliDiyaArtwork({
  size,
  className,
  isPaused = false,
}: {
  size?: number;
  className?: string;
  isPaused?: boolean;
}) {
  const sizeStyle = size ? { width: size, height: size } : undefined;
  return (
    <div
      className={`relative flex items-center justify-center select-none ${
        className || (size ? "" : "w-14 h-14 sm:w-16 sm:h-16 md:w-[68px] md:h-[68px]")
      }`}
      style={sizeStyle}
    >
      <div
        className={`absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-amber-500/25 via-yellow-400/20 to-orange-500/10 blur-xl pointer-events-none ${
          isPaused ? "" : "animate-diya-glow"
        }`}
      />
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_12px_rgba(245,158,11,0.45)]"
      >
        <defs>
          <radialGradient id="flameOuter" cx="50%" cy="70%" r="65%" fx="50%" fy="65%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.8" />
          </radialGradient>
          <linearGradient id="flameInner" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="clayBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9a3412" />
            <stop offset="40%" stopColor="#7c2d12" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="goldRim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="35%" stopColor="#fef08a" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="standGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#291003" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="85" rx="20" ry="5" fill="url(#standGrad)" />
        <path d="M38 78 L62 78 L58 84 L42 84 Z" fill="url(#standGrad)" stroke="#b45309" strokeWidth="0.75" />
        <path d="M15 62 Q 50 94 85 62 Q 74 76 50 78 Q 26 76 15 62 Z" fill="url(#clayBase)" />
        <path d="M26 68 Q 50 82 74 68" stroke="url(#goldRim)" strokeWidth="1.75" strokeDasharray="2 2" fill="none" opacity="0.9" />
        <circle cx="50" cy="74" r="1.75" fill="#fef08a" />
        <circle cx="42" cy="72.5" r="1.25" fill="#fbbf24" />
        <circle cx="58" cy="72.5" r="1.25" fill="#fbbf24" />
        <ellipse cx="50" cy="62" rx="35" ry="7" fill="#451a03" stroke="url(#goldRim)" strokeWidth="2" />
        <ellipse cx="50" cy="62" rx="30" ry="4.5" fill="#260e03" />
        <ellipse cx="50" cy="62.5" rx="26" ry="3" fill="#b45309" opacity="0.45" />
        <path d="M50 63 Q 48 53 50 48" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="50" cy="48" r="1.5" fill="#dc2626" />
        <g className={isPaused ? "" : "animate-flame"}>
          <circle cx="50" cy="36" r="16" fill="#f59e0b" opacity="0.25" filter="blur(3px)" />
          <path d="M50 14 C 54 26 62 34 62 43 C 62 50 56 54 50 54 C 44 54 38 50 38 43 C 38 34 46 26 50 14 Z" fill="url(#flameOuter)" />
          <path d="M50 24 C 52 30 57 37 57 44 C 57 49 53 51.5 50 51.5 C 47 51.5 43 49 43 44 C 43 37 48 30 50 24 Z" fill="url(#flameInner)" opacity="0.95" />
          <ellipse cx="50" cy="45" rx="3" ry="4.5" fill="#ffffff" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Dussehra: Ornate golden Bow & Arrow of Victory with solar radiance
 */
export function DussehraArtwork({
  size,
  className,
  isPaused = false,
}: {
  size?: number;
  className?: string;
  isPaused?: boolean;
}) {
  const sizeStyle = size ? { width: size, height: size } : undefined;
  return (
    <div
      className={`relative flex items-center justify-center select-none ${
        className || (size ? "" : "w-14 h-14 sm:w-16 sm:h-16 md:w-[68px] md:h-[68px]")
      }`}
      style={sizeStyle}
    >
      <div
        className={`absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-orange-500/25 via-amber-400/20 to-red-500/15 blur-xl pointer-events-none ${
          isPaused ? "" : "animate-victory-glow"
        }`}
      />
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_14px_rgba(249,115,22,0.55)]"
      >
        <defs>
          <linearGradient id="bowGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="arrowGlow" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fffbeb" />
          </linearGradient>
        </defs>

        {/* Radiant Solar Background Halo */}
        <circle cx="50" cy="50" r="38" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" />
        <circle cx="50" cy="50" r="44" stroke="#fb923c" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.3" />

        {/* Ornate Bow Curve */}
        <path
          d="M25 80 C 15 50 15 50 25 20 C 35 25 32 45 32 50 C 32 55 35 75 25 80 Z"
          fill="url(#bowGold)"
          stroke="#7c2d12"
          strokeWidth="1"
        />

        {/* Bowstring */}
        <path d="M25 20 L25 80" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="4 1" opacity="0.85" />

        {/* Grip Handle */}
        <rect x="23" y="44" width="7" height="12" rx="2" fill="#7c2d12" stroke="#f59e0b" strokeWidth="1" />

        {/* Victory Arrow aimed diagonally up-right */}
        <g className={isPaused ? "" : "animate-flame"}>
          {/* Arrow Shaft */}
          <line x1="20" y1="50" x2="82" y2="50" stroke="url(#arrowGlow)" strokeWidth="3" strokeLinecap="round" />
          {/* Arrowhead */}
          <path d="M82 50 L68 42 L72 50 L68 58 Z" fill="url(#arrowGlow)" stroke="#fff" strokeWidth="0.75" />
          {/* Arrowhead Core Spark */}
          <circle cx="82" cy="50" r="3" fill="#ffffff" className="drop-shadow-[0_0_6px_#fbbf24]" />
          {/* Arrow Feathers/Fletching */}
          <path d="M20 50 L12 43 L16 50 L12 57 Z" fill="#f59e0b" stroke="#7c2d12" strokeWidth="0.75" />
        </g>

        {/* Victory Sparkles */}
        <circle cx="78" cy="36" r="1.5" fill="#fef08a" opacity="0.9" />
        <circle cx="84" cy="62" r="1.5" fill="#fbbf24" opacity="0.8" />
        <circle cx="48" cy="24" r="1.2" fill="#fde047" opacity="0.7" />
      </svg>
    </div>
  );
}

/**
 * Navratri: Traditional Dandiya sticks crossed with radiant festive mandala
 */
export function NavratriArtwork({
  size = 72,
  isPaused = false,
}: {
  size?: number;
  isPaused?: boolean;
}) {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <div
        className={`absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-fuchsia-500/25 via-purple-500/20 to-pink-500/15 blur-xl pointer-events-none ${
          isPaused ? "" : "animate-diya-glow"
        }`}
      />
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_14px_rgba(217,70,239,0.55)]"
      >
        <defs>
          <linearGradient id="stick1Grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="stick2Grad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Background Mandala Ring */}
        <circle cx="50" cy="50" r="38" stroke="#d946ef" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        <circle cx="50" cy="50" r="44" stroke="#a855f7" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.3" />

        {/* Decorative central petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse
            key={angle}
            cx="50"
            cy="50"
            rx="5"
            ry="18"
            fill="none"
            stroke="#e879f9"
            strokeWidth="0.75"
            opacity="0.25"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}

        {/* Dandiya Sticks in Festive Crossed Action */}
        <g className={isPaused ? "" : "animate-garba-sway"}>
          {/* Stick 1 (Diagonal Left-to-Right) */}
          <rect
            x="47"
            y="12"
            width="6"
            height="76"
            rx="3"
            fill="url(#stick1Grad)"
            stroke="#fff"
            strokeWidth="0.5"
            transform="rotate(-35 50 50)"
          />
          {/* Stick 1 Festive Grip Ribbons */}
          <line x1="30" y1="28" x2="35" y2="35" stroke="#fff" strokeWidth="1.5" />
          <line x1="42" y1="44" x2="47" y2="51" stroke="#fde047" strokeWidth="1.5" />

          {/* Stick 2 (Diagonal Right-to-Left) */}
          <rect
            x="47"
            y="12"
            width="6"
            height="76"
            rx="3"
            fill="url(#stick2Grad)"
            stroke="#fff"
            strokeWidth="0.5"
            transform="rotate(35 50 50)"
          />
          {/* Stick 2 Festive Grip Ribbons */}
          <line x1="65" y1="28" x2="60" y2="35" stroke="#fff" strokeWidth="1.5" />
          <line x1="53" y1="44" x2="48" y2="51" stroke="#fde047" strokeWidth="1.5" />

          {/* Central Clack Spark Point */}
          <circle cx="50" cy="50" r="4" fill="#ffffff" className="drop-shadow-[0_0_8px_#fde047]" />
          <circle cx="50" cy="50" r="1.5" fill="#f59e0b" />
        </g>

        {/* Tiny hanging bells at bottom ends */}
        <circle cx="28" cy="80" r="2.5" fill="#fbbf24" stroke="#78350f" strokeWidth="0.5" />
        <circle cx="72" cy="80" r="2.5" fill="#fbbf24" stroke="#78350f" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

/**
 * New Year: Celebratory Champagne & Resolution Stars with Midnight Purple/Gold Aura
 */
export function NewYearArtwork({
  size = 72,
  isPaused = false,
}: {
  size?: number;
  isPaused?: boolean;
}) {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <div
        className={`absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-yellow-500/25 via-purple-600/20 to-blue-500/15 blur-xl pointer-events-none ${
          isPaused ? "" : "animate-diya-glow"
        }`}
      />
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_14px_rgba(250,204,21,0.55)]"
      >
        <defs>
          <linearGradient id="goldGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="40%" stopColor="#fef08a" />
            <stop offset="80%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="sparkleGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>

        {/* Starlight Constellation Ring */}
        <circle cx="50" cy="50" r="40" stroke="#ca8a04" strokeWidth="0.75" strokeDasharray="3 4" opacity="0.4" />

        {/* Festive Fitness Badge / Shield */}
        <path
          d="M50 16 L76 26 C 76 56 50 82 50 82 C 50 82 24 56 24 26 Z"
          fill="#131126"
          stroke="url(#goldGlass)"
          strokeWidth="1.8"
        />

        {/* Central Celebratory Star */}
        <g className={isPaused ? "" : "animate-flame"}>
          <path
            d="M50 30 L53 42 L65 42 L55 50 L59 62 L50 54 L41 62 L45 50 L35 42 L47 42 Z"
            fill="url(#goldGlass)"
            stroke="#fff"
            strokeWidth="0.75"
          />
          <circle cx="50" cy="46" r="3.5" fill="#ffffff" className="drop-shadow-[0_0_8px_#fde047]" />
        </g>

        {/* Year Celebration Typography: "2027" */}
        <text
          x="50"
          y="74"
          textAnchor="middle"
          fill="#fef08a"
          fontSize="9"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.08em"
        >
          2027
        </text>

        {/* Festive Confetti particles */}
        <g className={isPaused ? "" : "animate-confetti"}>
          <circle cx="20" cy="28" r="1.8" fill="#fde047" />
          <rect x="76" y="22" width="2.5" height="2.5" rx="0.5" fill="#f43f5e" transform="rotate(25 76 22)" />
          <circle cx="82" cy="48" r="1.5" fill="#a855f7" />
          <circle cx="16" cy="62" r="1.8" fill="#38bdf8" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Universal Festival Artwork Dispatcher
 */
export function FestivalArtworkRenderer({
  festiveType,
  size = 72,
  isPaused = false,
}: {
  festiveType: FestiveType;
  size?: number;
  isPaused?: boolean;
}) {
  switch (festiveType) {
    case "dussehra":
      return <DussehraArtwork size={size} isPaused={isPaused} />;
    case "navratri":
      return <NavratriArtwork size={size} isPaused={isPaused} />;
    case "new_year":
      return <NewYearArtwork size={size} isPaused={isPaused} />;
    case "diwali":
    default:
      return <DiwaliDiyaArtwork size={size} isPaused={isPaused} />;
  }
}

