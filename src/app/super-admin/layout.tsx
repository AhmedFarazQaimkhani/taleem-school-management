import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { SignOutButton } from "@/components/sign-out-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/login?callbackUrl=/super-admin");
  }
  const t = await getTranslations("superAdmin");
  const nav = await getTranslations("nav");
  const locale = await getLocale();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("platform")}</p>
            <p className="font-semibold">{t("brand")}</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/super-admin" className="hover:underline">
              {nav("tenants")}
            </Link>
            <Link href="/super-admin/billing" className="hover:underline">
              {nav("billing")}
            </Link>
            <Link href="/super-admin/reports" className="hover:underline">
              {nav("reports")}
            </Link>
            <Link href="/" className="text-muted-foreground hover:underline">
              {nav("home")}
            </Link>
            <LocaleSwitcher current={locale} />
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
