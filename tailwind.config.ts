import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { ink: "#090a0c", cream: "#f5f7fa", sage: "#168bd2", lime: "#d9effc" },
      boxShadow: { soft: "0 18px 50px rgba(9,10,12,.09)" }
    }
  },
  plugins: []
} satisfies Config;
