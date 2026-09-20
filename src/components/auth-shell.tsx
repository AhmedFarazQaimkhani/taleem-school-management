"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BookOpen, CalendarCheck, GraduationCap, Wallet } from "lucide-react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SchoolLogo } from "@/components/school-logo";
import { TaleemLogo } from "@/components/taleem-logo";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { key: "attendance", icon: CalendarCheck },
  { key: "fees", icon: Wallet },
  { key: "exams", icon: GraduationCap },
  { key: "records", icon: BookOpen },
] as const;

export function AuthShell({
  locale,
  tenant,
  children,
}: {
  locale: string;
  tenant?: { name: string; headerText?: string | null; logoKey?: string | null } | null;
  children: React.ReactNode;
}) {
  const t = useTranslations("auth");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((index) => (index + 1) % HIGHLIGHTS.length), 3200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_minmax(0,1fr)]">
      <aside className="relative overflow-hidden bg-[hsl(162_42%_12%)] px-6 py-8 text-white lg:px-12 lg:py-10">
        <div className="auth-orb auth-orb-a" />
        <div className="auth-orb auth-orb-b" />
        <div className="relative z-10 flex h-full flex-col">
          <Link href="/" className="w-fit">
            <TaleemLogo light />
          </Link>
          <div className="mt-10 max-w-md space-y-4 lg:mt-16">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">{t("eyebrow")}</p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{t("headline")}</h1>
            <p className="text-sm leading-6 text-white/75">{t("body")}</p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActive(index)}
                  className={cn(
                    "rounded-2xl border p-4 text-start transition-all",
                    active === index
                      ? "border-amber-300/70 bg-white/10 shadow-lg shadow-black/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active === index ? "text-amber-300" : "text-white/70")} />
                  <p className="mt-3 text-sm font-medium">{t(`highlights.${item.key}.title`)}</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">{t(`highlights.${item.key}.body`)}</p>
                </button>
              );
            })}
          </div>
          {tenant ? (
            <div className="mt-auto hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 lg:flex">
              <SchoolLogo name={tenant.name} logoKey={tenant.logoKey} />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-amber-200">{t("signingInto")}</p>
                <p className="font-medium">{tenant.name}</p>
              </div>
            </div>
          ) : (
            <p className="mt-auto hidden text-xs text-white/50 lg:block">{t("footer")}</p>
          )}
        </div>
      </aside>
      <main className="relative flex min-h-screen flex-col px-4 py-6 sm:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="lg:hidden">
            <TaleemLogo size="sm" />
          </Link>
          <div className="ms-auto">
            <LocaleSwitcher current={locale} />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-10">{children}</div>
      </main>
    </div>
  );
}
