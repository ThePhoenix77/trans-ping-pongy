import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A192F",
        foreground: "#EBEBEB",
        primary: "#00BCD4",
        secondary: "#4A658A",
        muted: "#1A2744",
        "muted-foreground": "#8892B0",
      },
    },
  },
  plugins: [],
};
export default config;
