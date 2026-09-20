import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { AuthShell } from "@/components/auth-shell";
import { parseTenantSlug } from "@/lib/host";
import { prisma } from "@/lib/prisma";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { slug?: string };
}) {
  const locale = await getLocale();
  const host = headers().get("host") ?? "";
  const slug =
    parseTenantSlug(host, process.env.PLATFORM_DOMAIN ?? "localhost:3000") ?? searchParams.slug ?? null;
  const tenant = slug
    ? await prisma.tenant.findUnique({
        where: { slug },
        select: { name: true, headerText: true, footerText: true, logoKey: true },
      })
    : null;

  return (
    <AuthShell locale={locale} tenant={tenant}>
      <ForgotPasswordForm defaultSlug={slug} schoolName={tenant?.name ?? null} />
      {tenant?.footerText ? (
        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">{tenant.footerText}</p>
      ) : null}
    </AuthShell>
  );
}
