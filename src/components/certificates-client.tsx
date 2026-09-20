"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Student = { id: string; name: string; admissionNo: string };
type Certificate = {
  id: string;
  type: string;
  issuedAt: string;
  student: { name: string; admissionNo: string };
};

export function CertificatesClient() {
  const t = useTranslations("certificatesPage");
  const common = useTranslations("common");
  const [students, setStudents] = useState<Student[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [studentPayload, certPayload] = await Promise.all([
      api<{ students: Student[] }>("/api/students?pageSize=50"),
      api<{ certificates: Certificate[] }>("/api/certificates"),
    ]);
    setStudents(studentPayload.students);
    setCertificates(certPayload.certificates);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("issue")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              try {
                await api("/api/certificates", {
                  method: "POST",
                  body: JSON.stringify({ studentId: form.get("studentId"), type: form.get("type") }),
                });
                await refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              }
            }}
          >
            <select name="studentId" className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" required>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.admissionNo})
                </option>
              ))}
            </select>
            <select name="type" className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" defaultValue="BONAFIDE">
              <option value="BONAFIDE">{t("types.BONAFIDE")}</option>
              <option value="CHARACTER">{t("types.CHARACTER")}</option>
              <option value="LEAVING">{t("types.LEAVING")}</option>
            </select>
            <Button type="submit">{t("issue")}</Button>
          </form>
        </CardContent>
      </Card>
      <ul className="space-y-2 text-sm">
        {certificates.map((row) => (
          <li key={row.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <span>
              {row.student.name} · {t(`types.${row.type}` as "types.BONAFIDE")}
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={`/certificates/${row.id}/print`}>{common("print")}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
