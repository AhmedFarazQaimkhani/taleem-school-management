import { handleRouteError, jsonOk } from "@/lib/route";
import { unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createTenantClient } from "@/lib/prisma-tenant";
import { generateMonthlyInvoices } from "@/lib/services/invoices";
import { pakistanToday, shouldAutoGenerate } from "@/lib/billing-schedule";

export const dynamic = "force-dynamic";

function assertCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw unauthorized("CRON_SECRET is not configured");
  const header = request.headers.get("authorization") ?? "";
  if (header !== `Bearer ${secret}`) throw unauthorized("Invalid cron secret");
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

async function run(request: Request) {
  try {
    assertCron(request);
    const today = pakistanToday();
    const tenants = await prisma.tenant.findMany({
      where: {
        autoInvoiceEnabled: true,
        status: { in: ["ACTIVE", "TRIAL"] },
      },
      select: { id: true, slug: true, invoiceDueDay: true, invoiceGenerateDay: true },
    });

    const results = [];
    for (const tenant of tenants) {
      if (!shouldAutoGenerate(today, tenant.invoiceGenerateDay)) {
        results.push({ schoolId: tenant.id, slug: tenant.slug, ran: false, reason: "not_due_yet" });
        continue;
      }
      const db = createTenantClient(tenant.id);
      const generated = await generateMonthlyInvoices(db, {
        schoolId: tenant.id,
        dueDay: tenant.invoiceDueDay,
        year: today.year,
        month: today.month,
      });
      results.push({ schoolId: tenant.id, slug: tenant.slug, ran: true, ...generated });
    }

    return jsonOk({ date: `${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`, results });
  } catch (error) {
    return handleRouteError(error);
  }
}
