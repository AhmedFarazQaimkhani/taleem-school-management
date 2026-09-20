import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { TaleemLogo } from "@/components/taleem-logo";
import { Button } from "@/components/ui/button";
import { parseTenantSlug } from "@/lib/host";

export default async function HomePage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const host = headers().get("host") ?? "";
  const slug = parseTenantSlug(host, process.env.PLATFORM_DOMAIN ?? "localhost:3000");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <TaleemLogo size="sm" />
        <div className="flex items-center gap-3">
          <LocaleSwitcher current={locale} />
          <Button asChild variant="ghost">
            <Link href="/login">{t("nav.login")}</Link>
          </Button>
          <Button asChild>
            <Link href="/onboarding">{t("nav.onboard")}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            {t("home.eyebrow")}
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t("tagline")}
          </h1>
          <p className="max-w-xl text-muted-foreground">{t("home.body")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/onboarding">{t("nav.onboard")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={slug ? "/login" : "/login"}>{t("nav.login")}</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("home.localUrls")}</p>
          <ul className="mt-4 space-y-3 font-mono text-sm">
            <li className="rounded-lg bg-muted px-4 py-3">greenwood.localhost:3000</li>
            <li className="rounded-lg bg-muted px-4 py-3">citymodel.localhost:3000</li>
            <li className="rounded-lg bg-muted px-4 py-3">localhost:3000/super-admin</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
