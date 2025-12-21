module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    cssnano: process.env.NODE_ENV === 'production' ? {} : false,
  },
}
