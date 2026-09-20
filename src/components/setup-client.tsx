"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Year = { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean };
type Klass = { id: string; name: string; academicYearId: string; sections: { id: string; name: string }[] };
type Subject = { id: string; name: string; nameUrdu?: string | null; code?: string | null; class?: { name: string } | null };

export function SetupClient() {
  const t = useTranslations("setup");
  const common = useTranslations("common");
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const currentYear = useMemo(() => years.find((year) => year.isCurrent) ?? years[0], [years]);

  async function refresh() {
    const [yearPayload, classPayload, subjectPayload] = await Promise.all([
      api<{ years: Year[] }>("/api/academic-years"),
      api<{ classes: Klass[] }>("/api/classes"),
      api<{ subjects: Subject[] }>("/api/subjects"),
    ]);
    setYears(yearPayload.years);
    setClasses(classPayload.classes);
    setSubjects(subjectPayload.subjects);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  async function onSubmit(url: string, body: unknown) {
    setError(null);
    try {
      await api(url, { method: "POST", body: JSON.stringify(body) });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("academicYear")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                onSubmit("/api/academic-years", {
                  name: form.get("name"),
                  startDate: form.get("startDate"),
                  endDate: form.get("endDate"),
                  isCurrent: form.get("isCurrent") === "on",
                });
                event.currentTarget.reset();
              }}
            >
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="yearName">{common("name")}</Label>
                <Input id="yearName" name="name" placeholder="2026-2027" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="startDate">{t("start")}</Label>
                <Input id="startDate" name="startDate" type="date" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate">{t("end")}</Label>
                <Input id="endDate" name="endDate" type="date" required />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="isCurrent" /> {t("currentYear")}
              </label>
              <Button type="submit" className="sm:col-span-2">
                {t("addYear")}
              </Button>
            </form>
            <ul className="space-y-2 text-sm">
              {years.map((year) => (
                <li key={year.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                  <span>{year.name}</span>
                  {year.isCurrent ? <Badge variant="success">{common("current")}</Badge> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{common("class")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                onSubmit("/api/classes", {
                  academicYearId: form.get("academicYearId"),
                  name: form.get("name"),
                });
                event.currentTarget.reset();
              }}
            >
              <select name="academicYearId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required defaultValue={currentYear?.id}>
                {years.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
              <Input name="name" placeholder="Class 5" required />
              <Button type="submit">{t("addClass")}</Button>
            </form>
            <ul className="space-y-2 text-sm">
              {classes.map((klass) => (
                <li key={klass.id} className="rounded-md bg-muted px-3 py-2">
                  {klass.name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{common("section")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                onSubmit("/api/sections", {
                  classId: form.get("classId"),
                  name: form.get("name"),
                });
                event.currentTarget.reset();
              }}
            >
              <select name="classId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required>
                {classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                  </option>
                ))}
              </select>
              <Input name="name" placeholder="A" required />
              <Button type="submit">{t("addSection")}</Button>
            </form>
            <ul className="space-y-2 text-sm">
              {classes.flatMap((klass) =>
                klass.sections.map((section) => (
                  <li key={section.id} className="rounded-md bg-muted px-3 py-2">
                    {klass.name} — {section.name}
                  </li>
                )),
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("subject")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                onSubmit("/api/subjects", {
                  name: form.get("name"),
                  nameUrdu: form.get("nameUrdu"),
                  code: form.get("code"),
                  classId: form.get("classId") || null,
                });
                event.currentTarget.reset();
              }}
            >
              <Input name="name" placeholder="Mathematics" required />
              <Input name="nameUrdu" placeholder="ریاضی" />
              <Input name="code" placeholder="MATH" />
              <select name="classId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">{common("allClasses")}</option>
                {classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                  </option>
                ))}
              </select>
              <Button type="submit">{t("addSubject")}</Button>
            </form>
            <ul className="space-y-2 text-sm">
              {subjects.map((subject) => (
                <li key={subject.id} className="rounded-md bg-muted px-3 py-2">
                  {subject.name} {subject.class ? `· ${subject.class.name}` : ""}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
