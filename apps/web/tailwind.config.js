module.exports = {
  content: [
    "./blocks/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cabin'", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#6F0C7D",
          50: "#DB52EE",
          100: "#D740ED",
          200: "#CF1AE9",
          300: "#B113C7",
          400: "#9010A2",
          500: "#6F0C7D",
          600: "#42074A",
          700: "#140217",
          800: "#000000",
          900: "#000000",
        },
      },
    },
  },
  plugins: [],
};
