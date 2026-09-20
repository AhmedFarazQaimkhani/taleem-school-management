import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { studentImportSchema } from "@/lib/validations/student";
import { parseCsv } from "@/lib/csv";
import { assertStudentCap } from "@/lib/plan-limits";
import { parseDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { planLimit } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    const body = studentImportSchema.parse(await request.json());
    const rows = parseCsv(body.csv);

    const tenant = await prisma.tenant.findUnique({
      where: { id: schoolId },
      include: { plan: true },
    });
    const current = await db.student.count({ where: { deletedAt: null } });
    const remaining = (tenant?.plan.maxStudents ?? 0) - current;
    if (rows.length > remaining) {
      throw planLimit(`Import would exceed the student cap. ${remaining} seats left.`);
    }

    const classes = await db.class.findMany({ include: { sections: true } });
    let created = 0;
    const errors: string[] = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const admissionNo = row.admissionNo || row.AdmissionNo;
      const name = row.name || row.Name;
      const gender = (row.gender || row.Gender || "MALE").toUpperCase();
      if (!admissionNo || !name) {
        errors.push(`Row ${index + 2}: admissionNo and name are required`);
        continue;
      }
      try {
        await assertStudentCap(schoolId);
        const className = row.className || row.Class || "";
        const sectionName = row.sectionName || row.Section || "";
        const klass = classes.find((item) => item.name.toLowerCase() === className.toLowerCase());
        const section = klass?.sections.find((item) => item.name.toLowerCase() === sectionName.toLowerCase());

        let guardianId: string | undefined;
        const guardianName = row.guardianName || row.GuardianName;
        const guardianPhone = row.guardianPhone || row.GuardianPhone;
        if (guardianName && guardianPhone) {
          const guardian = await db.guardian.create({
            data: {
              schoolId,
              name: guardianName,
              phone: guardianPhone,
              relation: row.guardianRelation || row.GuardianRelation || "father",
            },
          });
          guardianId = guardian.id;
        }

        await db.student.create({
          data: {
            schoolId,
            admissionNo,
            name,
            nameUrdu: row.nameUrdu || row.NameUrdu || null,
            gender: gender === "FEMALE" ? "FEMALE" : gender === "OTHER" ? "OTHER" : "MALE",
            dateOfBirth: row.dateOfBirth ? parseDateOnly(row.dateOfBirth) : null,
            bFormOrCnic: row.bFormOrCnic || null,
            classId: klass?.id,
            sectionId: section?.id,
            academicYearId: klass?.academicYearId,
            guardianId,
          },
        });
        created += 1;
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }

    return jsonOk({ created, failed: errors.length, errors });
  } catch (error) {
    return handleRouteError(error);
  }
}
