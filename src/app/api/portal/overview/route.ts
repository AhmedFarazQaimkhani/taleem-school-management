import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { forbidden } from "@/lib/api";
import { assertFeatureEnabled } from "@/lib/plan-limits";
import { effectiveInvoiceStatus } from "@/lib/services/invoices";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db, schoolId, session } = await requireTenantUser(["PARENT", "STUDENT"]);
    const role = session.user.role;

    if (role === "PARENT") {
      await assertFeatureEnabled(schoolId, "parentPortal");
      const guardian = await db.guardian.findFirst({
        where: { userId: session.user.id },
        include: {
          students: {
            where: { deletedAt: null },
            include: {
              class: true,
              section: true,
              attendanceRecords: { orderBy: { date: "desc" }, take: 5 },
              feeInvoices: { orderBy: { dueDate: "desc" }, take: 5 },
              examResults: { include: { exam: true, subject: true }, orderBy: { createdAt: "desc" }, take: 8 },
            },
          },
        },
      });
      if (!guardian) throw forbidden("No linked children");
      return jsonOk({
        role,
        children: guardian.students.map((student) => serializeStudent(student)),
      });
    }

    if (role === "STUDENT") {
      await assertFeatureEnabled(schoolId, "studentPortal");
      const student = await db.student.findFirst({
        where: { userId: session.user.id, deletedAt: null },
        include: {
          class: true,
          section: true,
          attendanceRecords: { orderBy: { date: "desc" }, take: 8 },
          feeInvoices: { orderBy: { dueDate: "desc" }, take: 8 },
          examResults: { include: { exam: true, subject: true }, orderBy: { createdAt: "desc" }, take: 10 },
        },
      });
      if (!student) throw forbidden("No linked student record");
      return jsonOk({ role, children: [serializeStudent(student)] });
    }

    throw forbidden("Portal is for parents and students");
  } catch (error) {
    return handleRouteError(error);
  }
}

function serializeStudent(student: {
  id: string;
  name: string;
  admissionNo: string;
  class: { name: string } | null;
  section: { name: string } | null;
  attendanceRecords: Array<{ date: Date; status: string }>;
  feeInvoices: Array<{ invoiceNo: string; amountPaisa: number; paidPaisa: number; dueDate: Date; status: string }>;
  examResults: Array<{
    grade: string | null;
    marksObtained: unknown;
    marksTotal: unknown;
    exam: { name: string };
    subject: { name: string };
  }>;
}) {
  return {
    id: student.id,
    name: student.name,
    admissionNo: student.admissionNo,
    className: student.class?.name ?? "—",
    sectionName: student.section?.name ?? "",
    attendance: student.attendanceRecords,
    invoices: student.feeInvoices.map((invoice) => ({
      ...invoice,
      effectiveStatus: effectiveInvoiceStatus(invoice.status, invoice.dueDate, invoice.paidPaisa, invoice.amountPaisa),
      remainingPaisa: Math.max(0, invoice.amountPaisa - invoice.paidPaisa),
    })),
    results: student.examResults.map((row) => ({
      exam: row.exam.name,
      subject: row.subject.name,
      grade: row.grade,
      marksObtained: Number(row.marksObtained),
      marksTotal: Number(row.marksTotal),
    })),
  };
}
