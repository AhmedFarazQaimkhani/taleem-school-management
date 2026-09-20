import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { assertFeatureEnabled } from "@/lib/plan-limits";
import { examResultsSchema } from "@/lib/validations/phase2";
import { notFound } from "@/lib/api";
import { gradeExam } from "@/lib/grading/grade";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "TEACHER"]);
    await assertFeatureEnabled(schoolId, "exams");
    const exam = await db.exam.findFirst({ where: { id: params.id }, include: { class: true } });
    if (!exam) throw notFound("Exam not found");
    const subjectId = new URL(request.url).searchParams.get("subjectId") ?? "";
    const students = await db.student.findMany({
      where: { deletedAt: null, status: "ACTIVE", ...(exam.classId ? { classId: exam.classId } : {}) },
      select: { id: true, name: true, admissionNo: true },
      orderBy: { name: "asc" },
    });
    const results = subjectId
      ? await db.examResult.findMany({ where: { examId: exam.id, subjectId } })
      : [];
    const byStudent = Object.fromEntries(results.map((row) => [row.studentId, row]));
    return jsonOk({
      exam,
      roster: students.map((student) => ({
        student,
        result: byStudent[student.id]
          ? {
              ...byStudent[student.id],
              marksObtained: Number(byStudent[student.id].marksObtained),
              marksTotal: Number(byStudent[student.id].marksTotal),
            }
          : null,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, schoolId, session } = await requireTenantUser(["ADMIN", "TEACHER"]);
    await assertFeatureEnabled(schoolId, "exams");
    const exam = await db.exam.findFirst({ where: { id: params.id } });
    if (!exam) throw notFound("Exam not found");
    const body = examResultsSchema.parse(await request.json());
    let saved = 0;
    for (const row of body.marks) {
      const graded = gradeExam(row.marksObtained, row.marksTotal);
      const existing = await db.examResult.findFirst({
        where: { examId: exam.id, studentId: row.studentId, subjectId: body.subjectId },
      });
      const data = {
        schoolId,
        examId: exam.id,
        studentId: row.studentId,
        subjectId: body.subjectId,
        marksObtained: row.marksObtained,
        marksTotal: row.marksTotal,
        grade: graded.grade,
        remarks: row.remarks || null,
      };
      if (existing) {
        const updated = await db.examResult.update({
          where: { id: existing.id },
          data: { ...data, correctedById: session.user.id, correctedAt: new Date() },
        });
        await writeAudit(db, {
          schoolId,
          actorId: session.user.id,
          action: "RESULT_CORRECTION",
          entity: "ExamResult",
          entityId: existing.id,
          before: existing,
          after: updated,
        });
      } else {
        await db.examResult.create({
          data: { ...data, enteredById: session.user.id },
        });
      }
      saved += 1;
    }
    return jsonOk({ saved });
  } catch (error) {
    return handleRouteError(error);
  }
}
