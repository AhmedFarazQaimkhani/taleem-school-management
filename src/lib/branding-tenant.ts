import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseTenantSlug } from "@/lib/host";

const brandSelect = {
  id: true,
  name: true,
  slug: true,
  headerText: true,
  footerText: true,
  logoKey: true,
} as const;

export async function resolveBrandingTenant() {
  const session = await getServerSession(authOptions);
  if (session?.user.schoolId && session.user.role !== "SUPER_ADMIN") {
    return prisma.tenant.findUnique({
      where: { id: session.user.schoolId },
      select: brandSelect,
    });
  }

  const host = headers().get("host") ?? "";
  const slug = parseTenantSlug(host, process.env.PLATFORM_DOMAIN ?? "localhost:3000");
  if (!slug) return null;
  return prisma.tenant.findUnique({
    where: { slug },
    select: brandSelect,
  });
}
