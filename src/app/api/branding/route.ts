import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { prisma } from "@/lib/prisma";
import { brandingSchema } from "@/lib/validations/branding";

export const dynamic = "force-dynamic";

function emptyToNull(value?: string | null) {
  const text = value?.trim();
  return text ? text : null;
}

export async function GET() {
  try {
    const { schoolId } = await requireTenantUser(["ADMIN"]);
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: schoolId },
      select: { name: true, headerText: true, footerText: true, logoKey: true },
    });
    return jsonOk(tenant);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { schoolId } = await requireTenantUser(["ADMIN"]);
    const body = brandingSchema.parse(await request.json());
    const tenant = await prisma.tenant.update({
      where: { id: schoolId },
      data: {
        headerText: emptyToNull(body.headerText),
        footerText: emptyToNull(body.footerText),
      },
      select: { name: true, headerText: true, footerText: true, logoKey: true },
    });
    return jsonOk(tenant);
  } catch (error) {
    return handleRouteError(error);
  }
}
