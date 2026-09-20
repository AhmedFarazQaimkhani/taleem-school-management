import { requireSuperAdmin } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { prisma } from "@/lib/prisma";
import { generatePlatformInvoices, markPlatformPaid } from "@/lib/services/platform-billing";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();
    const invoices = await prisma.platformSubscriptionPayment.findMany({
      include: { tenant: { select: { name: true, slug: true, status: true } }, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ invoices });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = z.object({ action: z.enum(["generate", "pay"]), id: z.string().optional(), method: z.string().optional() }).parse(
      await request.json(),
    );
    if (body.action === "generate") {
      const result = await generatePlatformInvoices();
      return jsonOk(result, 201);
    }
    if (!body.id) throw new Error("Invoice id required");
    const paid = await markPlatformPaid(body.id, body.method ?? "BANK");
    return jsonOk({ invoice: paid });
  } catch (error) {
    return handleRouteError(error);
  }
}
