/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gym: {
          bg: "#090A0F",
          sidebar: "#0D0E14",
          panel: "#11141A",
          card: "#14151D",
          elevated: "#191A24",
          accent: "#8B5CF6",
          accentSoft: "rgba(139, 92, 246, 0.18)",
          success: "#34D399",
          successSoft: "rgba(52, 211, 153, 0.18)",
          text: "#F5F5FA",
          muted: "#9698AA",
          border: "#2A2B39",
          warning: "#FBBF24",
          danger: "#FB7185",
        },
      },
      boxShadow: {
        soft: "0 18px 40px rgba(19, 20, 28, 0.45)",
        glow: "0 0 0 1px rgba(139,92,246,0.26), 0 18px 32px rgba(139,92,246,0.18)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
