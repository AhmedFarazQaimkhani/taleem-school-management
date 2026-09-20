import { Suspense } from "react";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { AuthShell } from "@/components/auth-shell";
import { parseTenantSlug } from "@/lib/host";
import { prisma } from "@/lib/prisma";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const locale = await getLocale();
  const host = headers().get("host") ?? "";
  const slug = parseTenantSlug(host, process.env.PLATFORM_DOMAIN ?? "localhost:3000");
  const tenant = slug
    ? await prisma.tenant.findUnique({
        where: { slug },
        select: { name: true, headerText: true, footerText: true, logoKey: true },
      })
    : null;

  return (
    <AuthShell locale={locale} tenant={tenant}>
      <Suspense>
        <ResetPasswordForm token={searchParams.token ?? ""} />
      </Suspense>
    </AuthShell>
  );
}
