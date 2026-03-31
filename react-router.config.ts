import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  prerender: ["/", "/new", "/login"],
  basename: import.meta.env.VITE_BASE,
} satisfies Config;
