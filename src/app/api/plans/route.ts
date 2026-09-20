import { prisma } from "@/lib/prisma";
import { handleRouteError, jsonOk } from "@/lib/route";
import { parseFeatureFlags } from "@/lib/plan";
import { paisaToPkr } from "@/lib/money";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { priceMonthlyPaisa: "asc" } });
    return jsonOk({
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceMonthlyPkr: paisaToPkr(plan.priceMonthlyPaisa),
        priceMonthlyPaisa: plan.priceMonthlyPaisa,
        maxStudents: plan.maxStudents,
        featureFlags: parseFeatureFlags(plan.featureFlags),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
