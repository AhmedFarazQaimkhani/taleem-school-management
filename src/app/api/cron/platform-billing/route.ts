import { handleRouteError, jsonOk } from "@/lib/route";
import { unauthorized } from "@/lib/api";
import { generatePlatformInvoices, settleOverdueAndRemind } from "@/lib/services/platform-billing";

export const dynamic = "force-dynamic";

function assertCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw unauthorized("CRON_SECRET is not configured");
  if ((request.headers.get("authorization") ?? "") !== `Bearer ${secret}`) {
    throw unauthorized("Invalid cron secret");
  }
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
    const generated = await generatePlatformInvoices();
    const settled = await settleOverdueAndRemind();
    return jsonOk({ generated, settled });
  } catch (error) {
    return handleRouteError(error);
  }
}
