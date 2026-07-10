/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        stadium: {
          primary: "#0A1628",
          accent: "#C9A84C",
          green: "#1A6B3C",
          surface: "#F8F9FA",
          danger: "#C0392B"
        }
      },
      boxShadow: {
        stadium: "0 12px 30px rgba(10, 22, 40, 0.12)"
      }
    }
  },
  plugins: []
};

