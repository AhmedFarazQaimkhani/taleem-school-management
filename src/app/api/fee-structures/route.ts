import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { feeStructureSchema } from "@/lib/validations/fees";
import { pkrToPaisa } from "@/lib/money";
import { notFound } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const structures = await db.feeStructure.findMany({
      include: { class: true, academicYear: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ structures });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const body = feeStructureSchema.parse(await request.json());
    const year = await db.academicYear.findFirst({ where: { id: body.academicYearId } });
    if (!year) throw notFound("Academic year not found");
    const structure = await db.feeStructure.create({
      data: {
        schoolId,
        academicYearId: body.academicYearId,
        classId: body.classId || null,
        name: body.name,
        amountPaisa: pkrToPaisa(body.amountPkr),
        frequency: body.frequency,
      },
    });
    return jsonOk({ structure }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
