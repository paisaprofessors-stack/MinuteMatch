import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./store/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08090f",
        panel: "#12131c",
        panelSoft: "#191b27",
        line: "rgba(255,255,255,0.12)",
        neonPink: "#ff007f",
        neonBlue: "#00f0ff",
        neonGreen: "#9ff84d",
        warning: "#fb7185",
        obsidian: "#030303",
        glass: "rgba(9, 9, 11, 0.6)",
        glassBorder: "rgba(255, 255, 255, 0.08)"
      },
      boxShadow: {
        glow: "0 0 60px rgba(126, 87, 255, 0.25)",
        glowGreen: "0 0 24px rgba(159, 248, 77, 0.25)",
        glowBlue: "0 0 24px rgba(0, 240, 255, 0.25)",
        glowPink: "0 0 24px rgba(255, 0, 127, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
