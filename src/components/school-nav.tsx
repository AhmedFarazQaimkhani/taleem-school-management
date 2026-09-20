"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Award,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  DoorOpen,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Menu,
  Share2,
  School,
  Settings,
  UserCog,
  Users,
  Wallet,
  Banknote,
  X,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SchoolLogo } from "@/components/school-logo";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types/roles";
import type { FeatureFlag, FeatureFlags } from "@/lib/plan";

const LINKS: Array<{
  href: string;
  key: "overview" | "portal" | "setup" | "settings" | "students" | "staff" | "attendance" | "fees" | "payroll" | "timetable" | "exams" | "announcements" | "socialPosts" | "certificates" | "reports";
  roles: AppRole[];
  feature?: FeatureFlag;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/dashboard", key: "overview", roles: ["ADMIN", "TEACHER", "ACCOUNTANT"], icon: LayoutDashboard },
  { href: "/portal", key: "portal", roles: ["PARENT", "STUDENT"], icon: DoorOpen },
  { href: "/setup", key: "setup", roles: ["ADMIN"], icon: School },
  { href: "/settings", key: "settings", roles: ["ADMIN"], icon: Settings },
  { href: "/students", key: "students", roles: ["ADMIN", "TEACHER", "ACCOUNTANT"], icon: Users },
  { href: "/staff", key: "staff", roles: ["ADMIN", "ACCOUNTANT"], icon: UserCog },
  { href: "/attendance", key: "attendance", roles: ["ADMIN", "TEACHER"], icon: CalendarCheck },
  { href: "/fees", key: "fees", roles: ["ADMIN", "ACCOUNTANT"], icon: Wallet },
  { href: "/payroll", key: "payroll", roles: ["ADMIN", "ACCOUNTANT"], feature: "payroll", icon: Banknote },
  { href: "/timetable", key: "timetable", roles: ["ADMIN", "TEACHER"], feature: "timetable", icon: CalendarDays },
  { href: "/exams", key: "exams", roles: ["ADMIN", "TEACHER"], feature: "exams", icon: GraduationCap },
  { href: "/announcements", key: "announcements", roles: ["ADMIN", "TEACHER", "PARENT", "STUDENT"], icon: Megaphone },
  { href: "/social-posts", key: "socialPosts", roles: ["ADMIN", "TEACHER"], icon: Share2 },
  { href: "/certificates", key: "certificates", roles: ["ADMIN"], feature: "certificates", icon: Award },
  { href: "/reports", key: "reports", roles: ["ADMIN", "TEACHER", "ACCOUNTANT"], icon: BarChart3 },
];

export function SchoolNav({
  schoolName,
  logoKey,
  role,
  locale,
  features,
}: {
  schoolName: string;
  logoKey?: string | null;
  role: AppRole;
  locale: string;
  features: FeatureFlags;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const roles = useTranslations("roles");
  const brand = useTranslations();
  const [open, setOpen] = useState(false);

  const links = LINKS.filter((link) => {
    if (!link.roles.includes(role)) return false;
    if (link.href === "/portal") {
      if (role === "PARENT") return features.parentPortal;
      if (role === "STUDENT") return features.studentPortal;
    }
    if (link.feature && !features[link.feature]) return false;
    return true;
  });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function brandBlock() {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <SchoolLogo name={schoolName} logoKey={logoKey} size="sm" className="ring-white/20" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">{brand("brand")}</p>
          <p className="truncate font-semibold leading-tight">{schoolName}</p>
          <p className="text-[11px] text-white/60">{roles(role)}</p>
        </div>
      </div>
    );
  }

  function linkList() {
    return links.map((link) => {
      const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
      const Icon = link.icon;
      return (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
            active
              ? "bg-gradient-to-r from-amber-300 to-amber-400 font-medium text-emerald-950 shadow-sm"
              : "text-white/75 hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {t(link.key)}
        </Link>
      );
    });
  }

  return (
    <>
      <div className="app-shell-nav sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-[hsl(162_42%_12%)] px-4 py-3 text-white print:hidden lg:hidden">
        {brandBlock()}
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-white/20 bg-white/5"
          onClick={() => setOpen(true)}
          aria-label={common("menu")}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <aside className="app-shell-nav hidden h-screen w-64 shrink-0 flex-col border-e border-white/10 bg-[hsl(162_42%_12%)] text-white print:hidden lg:flex">
        <div className="px-4 py-5">{brandBlock()}</div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">{linkList()}</nav>
        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-3">
          <LocaleSwitcher current={locale} dark />
          <SignOutButton className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" />
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label={common("closeMenu")} onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-[min(20rem,88vw)] flex-col bg-[hsl(162_42%_12%)] text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 px-4 py-4">
              {brandBlock()}
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/5"
                onClick={() => setOpen(false)}
                aria-label={common("closeMenu")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">{linkList()}</nav>
            <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-3">
              <LocaleSwitcher current={locale} dark />
              <SignOutButton className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
