import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  basename: import.meta.env.VITE_BASE,
} satisfies Config;
