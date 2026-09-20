import { useId } from "react";
import { cn } from "@/lib/utils";

export function TaleemMark({ className, title = "Taleem" }: { className?: string; title?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} role="img" aria-label={title}>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F3D32" />
          <stop offset="1" stopColor="#155E4A" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="16" y1="10" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F6E27A" />
          <stop offset="1" stopColor="#E0A106" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${uid}-bg)`} />
      <path
        d="M14 42c6 7 30 7 36 0-4 8-32 8-36 0Z"
        fill={`url(#${uid}-gold)`}
        opacity="0.95"
      />
      <path d="M32 18v22" stroke={`url(#${uid}-gold)`} strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M20 26c7-7 17-7 24 0"
        fill="none"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="16" r="3.2" fill="#F8E48B" />
      <path d="M18 41.5c5.5 3 22.5 3 28 0" fill="none" stroke="#0B2E26" strokeWidth="1.4" opacity="0.35" />
    </svg>
  );
}

export function TaleemLogo({
  size = "md",
  stacked = false,
  light = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  stacked?: boolean;
  light?: boolean;
  className?: string;
}) {
  const mark = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const word = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className={cn("flex items-center gap-3", stacked && "flex-col text-center", className)}>
      <TaleemMark className={cn(mark, "shadow-lg shadow-emerald-950/20 ring-1 ring-white/10")} />
      <div className={cn(stacked && "space-y-0.5")}>
        <p className={cn("font-semibold tracking-tight", word, light ? "text-white" : "text-emerald-950")}>Taleem</p>
        <p className={cn("text-[11px] font-medium tracking-[0.18em]", light ? "text-amber-200" : "text-amber-700")}>
          تعلیم
        </p>
      </div>
    </div>
  );
}
