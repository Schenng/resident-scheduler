import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        attending: { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
        resident: { bg: "#dcfce7", text: "#166534", border: "#86efac" },
        crna: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
        free: { bg: "#f3e8ff", text: "#6b21a8", border: "#d8b4fe" },
      },
    },
  },
  plugins: [],
};

export default config;
