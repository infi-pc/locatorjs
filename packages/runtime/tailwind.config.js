/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,ts}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};
