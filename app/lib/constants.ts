export function baseUrl(path: string): string {
  const base = import.meta.env.VITE_BASE || "/";
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  const suffix = path.startsWith("/") ? path.slice(1) : path;
  return `${prefix}/${suffix}`;
}

export const AVAILABLE_TAGS = [] as const;

export const AVAILABLE_COMMITTEES = [
  { code: "BOARD", name: "The DVRPC Board" },
  { code: "RTC", name: "Regional Technical Committee" },
  { code: "PPTF", name: "Public Participation Task Force" },
  { code: "DVGMTF", name: "Delaware Valley Goods Movement Task Force" },
  { code: "IREG", name: "Information Resources Exchange Group" },
  { code: "TOTF", name: "Transportation Operations Task Force" },
  { code: "RSTF", name: "Regional Safety Task Force" },
] as const;
