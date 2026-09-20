import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { attendanceMarkSchema } from "@/lib/validations/attendance";
import { parseDateOnly } from "@/lib/dates";
import { writeAudit } from "@/lib/audit";
import { notifyAbsences } from "@/lib/services/attendance-alerts";
import { notFound } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const url = new URL(request.url);
    const sectionId = url.searchParams.get("sectionId");
    const date = url.searchParams.get("date");
    if (!sectionId || !date) {
      return jsonOk({ records: [], students: [] });
    }

    const section = await db.section.findFirst({
      where: { id: sectionId },
      include: { class: true },
    });
    if (!section) throw notFound("Section not found");

    const day = parseDateOnly(date);
    const students = await db.student.findMany({
      where: { sectionId, deletedAt: null, status: "ACTIVE" },
      include: { guardian: true },
      orderBy: { name: "asc" },
    });
    const records = await db.attendanceRecord.findMany({
      where: { sectionId, date: day },
    });
    const byStudent = new Map(records.map((row) => [row.studentId, row]));

    return jsonOk({
      section,
      date,
      roster: students.map((student) => ({
        student,
        record: byStudent.get(student.id) ?? null,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, session, schoolId } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const body = attendanceMarkSchema.parse(await request.json());
    const section = await db.section.findFirst({ where: { id: body.sectionId } });
    if (!section) throw notFound("Section not found");
    const day = parseDateOnly(body.date);
    const absentees: Array<{ studentName: string; date: string; phone: string | null }> = [];

    for (const mark of body.marks) {
      const existing = await db.attendanceRecord.findFirst({
        where: { studentId: mark.studentId, date: day },
      });
      if (existing) {
        if (existing.status !== mark.status) {
          const updated = await db.attendanceRecord.update({
            where: { id: existing.id },
            data: {
              status: mark.status,
              remarks: mark.remarks,
              correctedById: session.user.id,
              correctedAt: new Date(),
            },
          });
          await writeAudit(db, {
            schoolId,
            actorId: session.user.id,
            action: "ATTENDANCE_CORRECTION",
            entity: "AttendanceRecord",
            entityId: existing.id,
            before: existing,
            after: updated,
          });
        }
      } else {
        await db.attendanceRecord.create({
          data: {
            schoolId,
            studentId: mark.studentId,
            sectionId: body.sectionId,
            date: day,
            status: mark.status,
            remarks: mark.remarks,
            markedById: session.user.id,
          },
        });
      }

      if (mark.status === "ABSENT") {
        const student = await db.student.findFirst({
          where: { id: mark.studentId },
          include: { guardian: true },
        });
        if (student) {
          absentees.push({
            studentName: student.name,
            date: body.date,
            phone: student.guardian?.phone ?? null,
          });
        }
      }
    }

    let notifications = { sent: 0, skipped: 0, reason: null as string | null };
    if (body.notifyAbsences) {
      notifications = await notifyAbsences(db, schoolId, absentees);
    }

    const present = body.marks.filter((row) => row.status === "PRESENT" || row.status === "LATE").length;
    return jsonOk({
      marked: body.marks.length,
      present,
      absent: body.marks.filter((row) => row.status === "ABSENT").length,
      notifications,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
