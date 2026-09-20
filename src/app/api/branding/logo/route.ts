import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { resolveBrandingTenant } from "@/lib/branding-tenant";
import { MAX_LOGO_BYTES_LIMIT, sniffImage } from "@/lib/branding";
import { getFileStorage } from "@/lib/services/storage";
import { badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const tenant = await resolveBrandingTenant();
    if (!tenant?.logoKey) {
      return new NextResponse(null, { status: 404 });
    }
    const stored = await getFileStorage().read(tenant.id, tenant.logoKey);
    return new NextResponse(new Uint8Array(stored.body), {
      status: 200,
      headers: {
        "Content-Type": stored.contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

export async function POST(request: Request) {
  try {
    const { schoolId } = await requireTenantUser(["ADMIN"]);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw badRequest("Choose a PNG, JPEG, or WebP logo");
    }
    if (file.size > MAX_LOGO_BYTES_LIMIT) {
      throw badRequest("Logo must be 1 MB or smaller");
    }

    const body = Buffer.from(await file.arrayBuffer());
    const image = sniffImage(body);
    if (!image) {
      throw badRequest("Logo must be a PNG, JPEG, or WebP image");
    }

    const storage = getFileStorage();
    const current = await prisma.tenant.findUnique({
      where: { id: schoolId },
      select: { logoKey: true },
    });
    if (current?.logoKey) {
      await storage.remove(schoolId, current.logoKey);
    }

    const logoKey = `branding/logo-${Date.now()}.${image.ext}`;
    await storage.put(schoolId, logoKey, body, image.contentType);
    const tenant = await prisma.tenant.update({
      where: { id: schoolId },
      data: { logoKey },
      select: { name: true, headerText: true, footerText: true, logoKey: true },
    });
    return jsonOk(tenant);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE() {
  try {
    const { schoolId } = await requireTenantUser(["ADMIN"]);
    const current = await prisma.tenant.findUnique({
      where: { id: schoolId },
      select: { logoKey: true },
    });
    if (current?.logoKey) {
      await getFileStorage().remove(schoolId, current.logoKey);
    }
    const tenant = await prisma.tenant.update({
      where: { id: schoolId },
      data: { logoKey: null },
      select: { name: true, headerText: true, footerText: true, logoKey: true },
    });
    return jsonOk(tenant);
  } catch (error) {
    return handleRouteError(error);
  }
}
