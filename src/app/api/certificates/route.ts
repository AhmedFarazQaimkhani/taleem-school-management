import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { assertFeatureEnabled } from "@/lib/plan-limits";
import { certificateSchema } from "@/lib/validations/phase2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    await assertFeatureEnabled(schoolId, "certificates");
    const certificates = await db.certificate.findMany({
      include: { student: { select: { name: true, admissionNo: true } } },
      orderBy: { issuedAt: "desc" },
      take: 50,
    });
    return jsonOk({ certificates });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    await assertFeatureEnabled(schoolId, "certificates");
    const body = certificateSchema.parse(await request.json());
    const certificate = await db.certificate.create({
      data: { schoolId, studentId: body.studentId, type: body.type },
    });
    return jsonOk({ certificate }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
