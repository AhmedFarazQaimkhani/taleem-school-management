import { Prisma } from "@prisma/client";
import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { studentSchema } from "@/lib/validations/student";
import { parseListQuery, listMeta } from "@/lib/pagination";
import { assertStudentCap } from "@/lib/plan-limits";
import { parseDateOnly } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER", "ACCOUNTANT"]);
    const url = new URL(request.url);
    const { page, pageSize, skip, q } = parseListQuery(url);
    const classId = url.searchParams.get("classId") ?? "";
    const sectionId = url.searchParams.get("sectionId") ?? "";
    const statusParam = url.searchParams.get("status") ?? "";
    const status =
      statusParam === "ACTIVE" || statusParam === "INACTIVE" || statusParam === "SUSPENDED" ? statusParam : "";

    const where: Prisma.StudentWhereInput = {
      deletedAt: null,
      ...(classId ? { classId } : {}),
      ...(sectionId ? { sectionId } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { admissionNo: { contains: q, mode: "insensitive" } },
              { nameUrdu: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, students] = await Promise.all([
      db.student.count({ where }),
      db.student.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          class: true,
          section: true,
          guardian: true,
          academicYear: true,
        },
      }),
    ]);

    return jsonOk({ students, meta: listMeta(total, page, pageSize) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    const body = studentSchema.parse(await request.json());
    await assertStudentCap(schoolId);

    let guardianId: string | undefined;
    if (body.guardianName && body.guardianPhone) {
      const guardian = await db.guardian.create({
        data: {
          schoolId,
          name: body.guardianName,
          phone: body.guardianPhone,
          relation: body.guardianRelation || "father",
        },
      });
      guardianId = guardian.id;
    }

    const student = await db.student.create({
      data: {
        schoolId,
        admissionNo: body.admissionNo,
        name: body.name,
        nameUrdu: body.nameUrdu || null,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? parseDateOnly(body.dateOfBirth) : null,
        bFormOrCnic: body.bFormOrCnic || null,
        academicYearId: body.academicYearId || null,
        classId: body.classId || null,
        sectionId: body.sectionId || null,
        guardianId,
        status: body.status ?? "ACTIVE",
      },
      include: { class: true, section: true, guardian: true },
    });

    return jsonOk({ student }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
