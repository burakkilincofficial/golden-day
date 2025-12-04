import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        foreground: "#f9fafb",
        gold: {
          DEFAULT: "#fbbf24",
          soft: "#facc15",
          dark: "#b45309"
        },
        navy: {
          DEFAULT: "#0f172a",
          soft: "#1e293b"
        },
        border: "#1e293b",
        muted: {
          DEFAULT: "#1f2937",
          foreground: "#9ca3af"
        },
        card: {
          DEFAULT: "#020617",
          foreground: "#e5e7eb"
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff"
        }
      },
      borderRadius: {
        lg: "0.7rem",
        md: "0.5rem",
        sm: "0.35rem"
      },
      boxShadow: {
        "soft-gold": "0 10px 30px rgba(251, 191, 36, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;


