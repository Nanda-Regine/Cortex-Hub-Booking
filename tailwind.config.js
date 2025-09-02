/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0b1f3a",
        lightblue: "#3ba3ff",
        skysoft: "#e9f4ff"
      },
      boxShadow: {
        soft: "0 10px 20px rgba(0,0,0,0.07)"
      },
      borderRadius: {
        '2xl': '1.25rem'
      }
    },
  },
  plugins: [],
}
