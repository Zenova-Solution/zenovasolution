/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--fg)",
        primary: {
          DEFAULT: "#ff813a",
          foreground: "#fff",
        },
        destructive: {
          DEFAULT: "var(--adm-danger-text)",
          foreground: "#fff",
        },
        muted: {
          DEFAULT: "var(--card)",
          foreground: "var(--fg-dim)",
        },
        accent: {
          DEFAULT: "var(--card-hover)",
          foreground: "var(--fg)",
        },
        secondary: {
          DEFAULT: "var(--card)",
          foreground: "var(--fg)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--fg)",
        },
        input: "var(--line)",
        ring: "#ff813a",
      },
      borderColor: {
        DEFAULT: "var(--line)",
      },
    },
  },
  plugins: [],
};
