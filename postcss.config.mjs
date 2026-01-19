cat > postcss.config.mjs <<'EOF'
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
EOF
