import { PrintButton } from "@/components/print-button";
import { SchoolLogo } from "@/components/school-logo";
import { brandFooter, brandHeader, type SchoolBrand } from "@/lib/branding";

export function PrintDocument({
  brand,
  title,
  titleUr,
  children,
}: {
  brand: SchoolBrand;
  title: string;
  titleUr?: string;
  children: React.ReactNode;
}) {
  const header = brandHeader(brand);
  const footer = brandFooter(brand);

  return (
    <div className="mx-auto max-w-3xl space-y-4 print:max-w-none">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>
      <article className="document-sheet relative overflow-hidden bg-white px-8 py-10 text-center shadow-xl print:shadow-none sm:px-12">
        <div className="pointer-events-none absolute inset-3 rounded-sm border-2 border-amber-700/70" />
        <div className="pointer-events-none absolute inset-4 rounded-sm border border-emerald-800/40" />
        <header className="relative space-y-3">
          <div className="flex justify-center">
            <SchoolLogo name={brand.name} logoKey={brand.logoKey} size="lg" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">{header}</p>
          <div className="mx-auto h-px w-40 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-emerald-950">{title}</h1>
          {titleUr ? (
            <p className="text-xl text-emerald-900" dir="rtl">
              {titleUr}
            </p>
          ) : null}
        </header>
        <div className="relative mt-8 space-y-5 text-left">{children}</div>
        {footer ? (
          <footer className="relative mt-10 border-t border-amber-700/30 pt-4 text-xs leading-5 text-emerald-900/80">
            {footer}
          </footer>
        ) : null}
      </article>
    </div>
  );
}
