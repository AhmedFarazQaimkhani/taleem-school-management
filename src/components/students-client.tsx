"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fieldSelectClass } from "@/lib/utils";

type Student = {
  id: string;
  admissionNo: string;
  name: string;
  gender: string;
  status: string;
  class?: { name: string } | null;
  section?: { name: string } | null;
  guardian?: { name: string; phone: string } | null;
};

type Klass = { id: string; name: string; sections: { id: string; name: string }[] };
type Year = { id: string; name: string; isCurrent: boolean };

export function StudentsClient({ canManage }: { canManage: boolean }) {
  const t = useTranslations("students");
  const common = useTranslations("common");
  const genderT = useTranslations("gender");
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [classId, setClassId] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageCount: 1 });
  const [error, setError] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  async function refresh(nextPage = page) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(nextPage), pageSize: "10" });
    if (q) params.set("q", q);
    if (classId) params.set("classId", classId);
    const payload = await api<{ students: Student[]; meta: typeof meta }>(`/api/students?${params}`);
    setStudents(payload.students);
    setMeta(payload.meta);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setQ(qInput.trim());
    }, 280);
    return () => window.clearTimeout(timer);
  }, [qInput]);

  useEffect(() => {
    Promise.all([
      api<{ classes: Klass[] }>("/api/classes"),
      api<{ years: Year[] }>("/api/academic-years"),
    ])
      .then(([classPayload, yearPayload]) => {
        setClasses(classPayload.classes);
        setYears(yearPayload.years);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    refresh(1).catch((err) => {
      setLoading(false);
      setError(err.message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, classId]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("lead")} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("newAdmission")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const formEl = event.currentTarget;
                const form = new FormData(formEl);
                setPending(true);
                setError(null);
                try {
                  await api("/api/students", {
                    method: "POST",
                    body: JSON.stringify({
                      admissionNo: form.get("admissionNo"),
                      name: form.get("name"),
                      nameUrdu: form.get("nameUrdu"),
                      gender: form.get("gender"),
                      dateOfBirth: form.get("dateOfBirth"),
                      bFormOrCnic: form.get("bFormOrCnic"),
                      academicYearId: form.get("academicYearId") || null,
                      classId: form.get("classId") || null,
                      sectionId: form.get("sectionId") || null,
                      guardianName: form.get("guardianName"),
                      guardianPhone: form.get("guardianPhone"),
                      guardianRelation: form.get("guardianRelation"),
                    }),
                  });
                  formEl.reset();
                  toast.success(t("admitted"));
                  await refresh();
                } catch (err) {
                  const text = err instanceof Error ? err.message : common("failed");
                  setError(text);
                  toast.error(text);
                } finally {
                  setPending(false);
                }
              }}
            >
              <div className="space-y-1">
                <Label>{t("admissionNo")}</Label>
                <Input name="admissionNo" required />
              </div>
              <div className="space-y-1">
                <Label>{common("name")}</Label>
                <Input name="name" required />
              </div>
              <div className="space-y-1">
                <Label>{common("nameUrdu")}</Label>
                <Input name="nameUrdu" />
              </div>
              <div className="space-y-1">
                <Label>{t("gender")}</Label>
                <select name="gender" className={fieldSelectClass} defaultValue="MALE">
                  <option value="MALE">{genderT("male")}</option>
                  <option value="FEMALE">{genderT("female")}</option>
                  <option value="OTHER">{genderT("OTHER")}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t("dateOfBirth")}</Label>
                <Input name="dateOfBirth" type="date" />
              </div>
              <div className="space-y-1">
                <Label>{t("cnic")}</Label>
                <Input name="bFormOrCnic" />
              </div>
              <div className="space-y-1">
                <Label>{common("year")}</Label>
                <select name="academicYearId" className={fieldSelectClass}>
                  <option value="">—</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{common("class")}</Label>
                <select name="classId" className={fieldSelectClass}>
                  <option value="">—</option>
                  {classes.map((klass) => (
                    <option key={klass.id} value={klass.id}>
                      {klass.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{common("section")}</Label>
                <select name="sectionId" className={fieldSelectClass}>
                  <option value="">—</option>
                  {classes.flatMap((klass) =>
                    klass.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {klass.name} {section.name}
                      </option>
                    )),
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t("guardian")}</Label>
                <Input name="guardianName" />
              </div>
              <div className="space-y-1">
                <Label>{t("guardianPhone")}</Label>
                <Input name="guardianPhone" placeholder="03xx..." />
              </div>
              <div className="space-y-1">
                <Label>{t("relation")}</Label>
                <Input name="guardianRelation" placeholder="father" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={pending}>
                  {pending ? t("admitting") : t("admit")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder={t("search")} value={qInput} onChange={(e) => setQInput(e.target.value)} />
        <select className={fieldSelectClass} value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">{common("allClasses")}</option>
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>
              {klass.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyHint")}
          action={
            <Button asChild variant="outline">
              <Link href="/setup">{common("goToSetup")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admissionNo")}</TableHead>
                <TableHead>{common("name")}</TableHead>
                <TableHead>{common("class")}</TableHead>
                <TableHead>{t("guardian")}</TableHead>
                <TableHead>{common("status")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-xs">{student.admissionNo}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    {student.class?.name ?? "—"} {student.section?.name ?? ""}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.guardian ? `${student.guardian.name} · ${student.guardian.phone}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === "ACTIVE" ? "success" : "secondary"}>{student.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!confirm(t("confirmRemove", { name: student.name }))) return;
                          await api(`/api/students/${student.id}`, { method: "DELETE" });
                          toast.success(t("removed"));
                          await refresh();
                        }}
                      >
                        {common("remove")}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span>{t("pageLine", { total: meta.total, page: meta.page, pages: meta.pageCount })}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => {
              setPage(page - 1);
              refresh(page - 1);
            }}
          >
            {common("previous")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= meta.pageCount || loading}
            onClick={() => {
              setPage(page + 1);
              refresh(page + 1);
            }}
          >
            {common("next")}
          </Button>
        </div>
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("csvTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">{t("csvHint")}</p>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background p-3 font-mono text-xs"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder="admissionNo,name,gender,className,sectionName,guardianName,guardianPhone"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    const result = await api<{ created: number; failed: number; errors: string[] }>("/api/students/import", {
                      method: "POST",
                      body: JSON.stringify({ csv }),
                    });
                    if (result.failed) {
                      setError(result.errors.join("; "));
                      toast.error(t("importFailed", { failed: result.failed }));
                    } else {
                      setError(null);
                      toast.success(t("imported", { created: result.created }));
                    }
                    await refresh();
                  } catch (err) {
                    const text = err instanceof Error ? err.message : "Import failed";
                    setError(text);
                    toast.error(text);
                  }
                }}
              >
                {t("import")}
              </Button>
              <Button asChild variant="outline">
                <Link href="data:text/csv,admissionNo,name,gender,className,sectionName,guardianName,guardianPhone%0AGW-0002,Sara%20Ahmed,FEMALE,Class%205,A,Ahmed%20Ali,03001234567">
                  Sample header
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
