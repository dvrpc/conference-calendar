import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  basename: import.meta.env.VITE_BASE,
  allowedActionOrigins: ["cloud.dvrpc.org"],
} satisfies Config;
