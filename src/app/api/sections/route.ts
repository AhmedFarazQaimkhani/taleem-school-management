import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { sectionSchema } from "@/lib/validations/setup";
import { notFound } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER", "ACCOUNTANT"]);
    const classId = new URL(request.url).searchParams.get("classId");
    const sections = await db.section.findMany({
      where: classId ? { classId } : {},
      include: { class: true },
      orderBy: { name: "asc" },
    });
    return jsonOk({ sections });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    const body = sectionSchema.parse(await request.json());
    const klass = await db.class.findFirst({ where: { id: body.classId } });
    if (!klass) throw notFound("Class not found");
    const section = await db.section.create({
      data: { schoolId, classId: body.classId, name: body.name },
    });
    return jsonOk({ section }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
