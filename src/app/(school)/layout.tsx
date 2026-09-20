import { getLocale } from "next-intl/server";
import { requireSchoolPage } from "@/lib/school-page";
import { SchoolNav } from "@/components/school-nav";
import { SchoolLogo } from "@/components/school-logo";
import { SchoolPageTitle } from "@/components/school-page-title";
import { brandFooter, brandHeader } from "@/lib/branding";

export default async function SchoolLayout({ children }: { children: React.ReactNode }) {
  const { tenant, session, features } = await requireSchoolPage();
  const locale = await getLocale();
  const header = brandHeader(tenant);
  const footer = brandFooter(tenant);

  return (
    <div className="min-h-screen lg:flex lg:h-screen lg:overflow-hidden">
      <SchoolNav
        schoolName={tenant.name}
        logoKey={tenant.logoKey}
        role={session.user.role}
        locale={locale}
        features={features}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-y-auto">
        <header className="app-shell-header print:hidden border-b bg-white/80 px-4 py-3 shadow-sm backdrop-blur lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <SchoolLogo name={tenant.name} logoKey={tenant.logoKey} size="sm" className="hidden sm:grid" />
              <div className="min-w-0">
                <SchoolPageTitle />
                <p className="truncate text-xs text-muted-foreground">{header}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">{children}</main>
        {footer ? (
          <footer className="app-shell-footer print:hidden border-t bg-white/70 px-4 py-3 text-center text-xs leading-5 text-muted-foreground lg:px-8">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
