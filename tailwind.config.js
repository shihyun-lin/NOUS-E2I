module.exports = {
  content: ["./index.html", "./assets/**/*.js"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0F2233',
          600: '#243849',
          400: '#5B6B75',
        },
        line: 'rgb(217 229 226 / <alpha-value>)',
        brand: {
          600: '#216572',
          500: '#2F8C8F',
          400: '#4FA7A7',
          200: '#BFE2DE',
        },
        state: {
          success: 'rgb(16 185 129 / <alpha-value>)',
          warn: 'rgb(245 158 11 / <alpha-value>)',
          danger: 'rgb(244 63 94 / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
