import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const baseUrl = loadEnv(mode, process.cwd()).VITE_BASE;
  return {
    base: baseUrl,
    resolve: { tsconfigPaths: true },
    plugins: [tailwindcss(), reactRouter()],
    server: {
      watch: {
        usePolling: true,
      },
    },
  };
});
