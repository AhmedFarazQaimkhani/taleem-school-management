import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { subjectSchema } from "@/lib/validations/setup";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER", "ACCOUNTANT"]);
    const subjects = await db.subject.findMany({
      include: { class: true },
      orderBy: { name: "asc" },
    });
    return jsonOk({ subjects });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    const body = subjectSchema.parse(await request.json());
    const subject = await db.subject.create({
      data: {
        schoolId,
        name: body.name,
        nameUrdu: body.nameUrdu || null,
        code: body.code || null,
        classId: body.classId || null,
      },
    });
    return jsonOk({ subject }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
