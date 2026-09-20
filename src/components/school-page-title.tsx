"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const TITLES: Array<{ prefix: string; key: string }> = [
  { prefix: "/dashboard", key: "overview" },
  { prefix: "/portal", key: "portal" },
  { prefix: "/setup", key: "setup" },
  { prefix: "/settings", key: "settings" },
  { prefix: "/students", key: "students" },
  { prefix: "/staff", key: "staff" },
  { prefix: "/attendance", key: "attendance" },
  { prefix: "/fees", key: "fees" },
  { prefix: "/payroll", key: "payroll" },
  { prefix: "/timetable", key: "timetable" },
  { prefix: "/exams", key: "exams" },
  { prefix: "/announcements", key: "announcements" },
  { prefix: "/social-posts", key: "socialPosts" },
  { prefix: "/certificates", key: "certificates" },
  { prefix: "/reports", key: "reports" },
];

export function SchoolPageTitle() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const match = TITLES.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  if (!match) return null;
  return <p className="truncate text-sm font-medium text-emerald-950">{t(match.key)}</p>;
}
