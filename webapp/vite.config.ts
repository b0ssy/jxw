import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      proxy: {
        "/v1": env.VITE_PROXY_BACKEND,
      },
    },

    // Fix usage of "websocket" library
    // https://stackoverflow.com/questions/75883720/504-outdated-optimize-dep-while-using-react-vite
    optimizeDeps: {
      exclude: ["js-big-decimal"],
    },
  };
});
