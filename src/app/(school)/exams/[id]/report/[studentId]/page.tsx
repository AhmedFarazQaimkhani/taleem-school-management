import { notFound } from "next/navigation";
import { requireSchoolPage } from "@/lib/school-page";
import { PrintDocument } from "@/components/print-document";
import { gradeExam } from "@/lib/grading/grade";

export default async function ReportCardPage({ params }: { params: { id: string; studentId: string } }) {
  const { db, tenant } = await requireSchoolPage(["ADMIN", "TEACHER", "PARENT", "STUDENT"], "exams");
  const exam = await db.exam.findFirst({
    where: { id: params.id },
    include: { academicYear: true, class: true },
  });
  const student = await db.student.findFirst({
    where: { id: params.studentId },
    include: { class: true, section: true },
  });
  if (!exam || !student) notFound();

  const results = await db.examResult.findMany({
    where: { examId: exam.id, studentId: student.id },
    include: { subject: true },
    orderBy: { createdAt: "asc" },
  });

  const totals = results.reduce(
    (acc, row) => {
      acc.obtained += Number(row.marksObtained);
      acc.total += Number(row.marksTotal);
      return acc;
    },
    { obtained: 0, total: 0 },
  );
  const overall = totals.total > 0 ? gradeExam(totals.obtained, totals.total) : null;

  return (
    <PrintDocument brand={tenant} title={`${exam.name} report card`} titleUr="رپورٹ کارڈ">
      <p className="text-center text-sm text-muted-foreground">{exam.academicYear.name}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Student / طالب علم</dt>
          <dd>
            {student.name} {student.nameUrdu ? `· ${student.nameUrdu}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Admission / داخلہ</dt>
          <dd className="font-mono">{student.admissionNo}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Class / جماعت</dt>
          <dd>
            {student.class?.name ?? exam.class?.name ?? "—"} {student.section?.name ?? ""}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Grade / گریڈ</dt>
          <dd className="text-xl font-semibold">{overall?.grade ?? "—"}</dd>
        </div>
      </dl>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2">Subject / مضمون</th>
            <th className="py-2">Obtained</th>
            <th className="py-2">Total</th>
            <th className="py-2">Grade</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-2">
                {row.subject.name} {row.subject.nameUrdu ? `· ${row.subject.nameUrdu}` : ""}
              </td>
              <td>{Number(row.marksObtained)}</td>
              <td>{Number(row.marksTotal)}</td>
              <td>{row.grade}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-medium">
            <td className="py-2">Total / کل</td>
            <td>{totals.obtained}</td>
            <td>{totals.total}</td>
            <td>{overall ? `${overall.percent}%` : "—"}</td>
          </tr>
        </tfoot>
      </table>
    </PrintDocument>
  );
}
