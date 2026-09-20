"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Exam = { id: string; name: string; type: string; class: { name: string } | null; _count: { results: number } };
type Year = { id: string; name: string };
type Klass = { id: string; name: string };
type Subject = { id: string; name: string };
type RosterRow = {
  student: { id: string; name: string; admissionNo: string };
  result: { marksObtained: number; marksTotal: number; grade: string | null } | null;
};

export function ExamsClient() {
  const t = useTranslations("examsPage");
  const [exams, setExams] = useState<Exam[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examId, setExamId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [marks, setMarks] = useState<Record<string, { obtained: string; total: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const [examPayload, yearPayload, classPayload, subjectPayload] = await Promise.all([
      api<{ exams: Exam[] }>("/api/exams"),
      api<{ years: Year[] }>("/api/academic-years"),
      api<{ classes: Klass[] }>("/api/classes"),
      api<{ subjects: Subject[] }>("/api/subjects"),
    ]);
    setExams(examPayload.exams);
    setYears(yearPayload.years);
    setClasses(classPayload.classes);
    setSubjects(subjectPayload.subjects);
    if (!examId && examPayload.exams[0]) setExamId(examPayload.exams[0].id);
    if (!subjectId && subjectPayload.subjects[0]) setSubjectId(subjectPayload.subjects[0].id);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!examId || !subjectId) return;
    api<{ roster: RosterRow[] }>(`/api/exams/${examId}/results?subjectId=${subjectId}`)
      .then((payload) => {
        setRoster(payload.roster);
        const next: Record<string, { obtained: string; total: string }> = {};
        for (const row of payload.roster) {
          next[row.student.id] = {
            obtained: row.result ? String(row.result.marksObtained) : "",
            total: row.result ? String(row.result.marksTotal) : "100",
          };
        }
        setMarks(next);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, [examId, subjectId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("create")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const formEl = event.currentTarget;
              const form = new FormData(formEl);
              try {
                await api("/api/exams", {
                  method: "POST",
                  body: JSON.stringify({
                    name: form.get("name"),
                    type: form.get("type"),
                    academicYearId: form.get("academicYearId"),
                    classId: form.get("classId") || null,
                  }),
                });
                formEl.reset();
                await refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              }
            }}
          >
            <Input name="name" placeholder="Midterm 2026" required className="sm:col-span-2" />
            <select name="type" className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" defaultValue="MIDTERM">
              <option value="MIDTERM">Midterm</option>
              <option value="FINAL">Final</option>
              <option value="QUIZ">Quiz</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="OTHER">Other</option>
            </select>
            <select name="academicYearId" className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" required>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
            <select name="classId" className="flex h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">All classes</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </select>
            <Button type="submit">Save exam</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" value={examId} onChange={(e) => setExamId(e.target.value)}>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name} {exam.class ? `(${exam.class.name})` : ""}
            </option>
          ))}
        </select>
        <select className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Obtained</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.map((row) => (
              <TableRow key={row.student.id}>
                <TableCell>
                  {row.student.name}
                  <div className="font-mono text-xs text-muted-foreground">{row.student.admissionNo}</div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    className="w-24"
                    value={marks[row.student.id]?.obtained ?? ""}
                    onChange={(e) =>
                      setMarks((prev) => ({ ...prev, [row.student.id]: { obtained: e.target.value, total: prev[row.student.id]?.total ?? "100" } }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    className="w-24"
                    value={marks[row.student.id]?.total ?? "100"}
                    onChange={(e) =>
                      setMarks((prev) => ({ ...prev, [row.student.id]: { obtained: prev[row.student.id]?.obtained ?? "", total: e.target.value } }))
                    }
                  />
                </TableCell>
                <TableCell>{row.result?.grade ?? "—"}</TableCell>
                <TableCell>
                  {examId ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/exams/${examId}/report/${row.student.id}`}>Report card</Link>
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button
        onClick={async () => {
          try {
            const result = await api<{ saved: number }>(`/api/exams/${examId}/results`, {
              method: "POST",
              body: JSON.stringify({
                subjectId,
                marks: roster
                  .filter((row) => marks[row.student.id]?.obtained !== "")
                  .map((row) => ({
                    studentId: row.student.id,
                    marksObtained: Number(marks[row.student.id].obtained),
                    marksTotal: Number(marks[row.student.id].total),
                  })),
              }),
            });
            setMessage(`Saved ${result.saved} results.`);
            const payload = await api<{ roster: RosterRow[] }>(`/api/exams/${examId}/results?subjectId=${subjectId}`);
            setRoster(payload.roster);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
          }
        }}
      >
        Save marks
      </Button>
    </div>
  );
}
