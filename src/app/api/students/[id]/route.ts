import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { studentSchema } from "@/lib/validations/student";
import { parseDateOnly } from "@/lib/dates";
import { notFound } from "@/lib/api";

type Ctx = { params: { id: string } };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER", "ACCOUNTANT"]);
    const student = await db.student.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { class: true, section: true, guardian: true, academicYear: true },
    });
    if (!student) throw notFound("Student not found");
    return jsonOk({ student });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { db } = await requireTenantUser(["ADMIN"]);
    const body = studentSchema.partial().parse(await request.json());
    const existing = await db.student.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!existing) throw notFound("Student not found");

    const student = await db.student.update({
      where: { id: params.id },
      data: {
        admissionNo: body.admissionNo,
        name: body.name,
        nameUrdu: body.nameUrdu === undefined ? undefined : body.nameUrdu || null,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth ? parseDateOnly(body.dateOfBirth) : undefined,
        bFormOrCnic: body.bFormOrCnic === undefined ? undefined : body.bFormOrCnic || null,
        academicYearId: body.academicYearId,
        classId: body.classId,
        sectionId: body.sectionId,
        status: body.status,
      },
      include: { class: true, section: true, guardian: true },
    });
    return jsonOk({ student });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { db } = await requireTenantUser(["ADMIN"]);
    const existing = await db.student.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!existing) throw notFound("Student not found");
    const student = await db.student.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), status: "INACTIVE" },
    });
    return jsonOk({ student: { id: student.id, deleted: true } });
  } catch (error) {
    return handleRouteError(error);
  }
}
