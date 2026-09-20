import { cn } from "@/lib/utils";
import { logoSrc, schoolInitials } from "@/lib/branding";

export function SchoolLogo({
  name,
  logoKey,
  size = "md",
  className,
}: {
  name: string;
  logoKey?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const src = logoSrc(logoKey);
  const dim = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-11 w-11 text-sm";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${name} logo`}
        className={cn("shrink-0 rounded-xl object-contain bg-white shadow-sm ring-1 ring-black/5", dim, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 font-semibold text-emerald-950 shadow-sm",
        dim,
        className,
      )}
      aria-hidden
    >
      {schoolInitials(name)}
    </span>
  );
}
