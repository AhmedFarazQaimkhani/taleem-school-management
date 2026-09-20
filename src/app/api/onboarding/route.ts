import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { onboardTenantSchema } from "@/lib/validations/tenant";
import { handleRouteError, jsonOk } from "@/lib/route";
import { conflict, notFound } from "@/lib/api";
import { isReservedSubdomain } from "@/lib/host";
import { pkrToPaisa } from "@/lib/money";

export async function POST(request: Request) {
  try {
    const body = onboardTenantSchema.parse(await request.json());

    if (isReservedSubdomain(body.slug)) {
      throw conflict("This subdomain is reserved");
    }

    const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
    if (!plan) throw notFound("Plan not found");

    const existing = await prisma.tenant.findUnique({ where: { slug: body.slug } });
    if (existing) throw conflict("That subdomain is already taken");

    const passwordHash = await bcrypt.hash(body.adminPassword, 12);
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: body.schoolName,
          slug: body.slug,
          status: "TRIAL",
          planId: plan.id,
          trialEndsAt,
        },
      });

      const admin = await tx.user.create({
        data: {
          schoolId: tenant.id,
          email: body.adminEmail,
          phone: body.adminPhone,
          passwordHash,
          role: "ADMIN",
          status: "ACTIVE",
          name: body.adminName,
        },
      });

      await tx.platformSubscriptionPayment.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          periodStart: now,
          periodEnd,
          amountPaisa: 0,
          status: "PENDING",
          paymentMethod: "trial",
        },
      });

      return { tenant, admin };
    });

    return jsonOk(
      {
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug,
          status: result.tenant.status,
        },
        admin: {
          id: result.admin.id,
          email: result.admin.email,
        },
        trialPricePaisa: pkrToPaisa(0),
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
