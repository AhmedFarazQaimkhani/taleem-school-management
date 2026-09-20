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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, fieldSelectClass } from "@/lib/utils";

type Section = { id: string; name: string; classId: string; class: { name: string } };
type RosterItem = {
  student: { id: string; name: string; admissionNo: string };
  record: { status: string } | null;
};
type Summary = {
  section: { id: string; name: string; class: { name: string } };
  marked: number;
  present: number;
  absent: number;
  percent: number;
};

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

const STATUS_STYLES: Record<(typeof STATUSES)[number], string> = {
  PRESENT: "border-emerald-600 bg-emerald-600 text-white",
  ABSENT: "border-red-600 bg-red-600 text-white",
  LATE: "border-amber-500 bg-amber-500 text-amber-950",
  EXCUSED: "border-slate-500 bg-slate-500 text-white",
};

export function AttendanceClient() {
  const t = useTranslations("attendancePage");
  const common = useTranslations("common");
  const statusT = useTranslations("status");
  const toast = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  });
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"save" | "alert" | null>(null);

  useEffect(() => {
    api<{ sections: Section[] }>("/api/sections")
      .then((payload) => {
        setSections(payload.sections);
        if (payload.sections[0]) setSectionId(payload.sections[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function loadRegister() {
    if (!sectionId || !date) return;
    const payload = await api<{ roster: RosterItem[] }>(`/api/attendance?sectionId=${sectionId}&date=${date}`);
    setRoster(payload.roster);
    const next: Record<string, string> = {};
    for (const row of payload.roster) {
      next[row.student.id] = row.record?.status ?? "PRESENT";
    }
    setMarks(next);
    const summary = await api<{ summaries: Summary[] }>(`/api/attendance/summary?date=${date}`);
    setSummaries(summary.summaries);
  }

  useEffect(() => {
    loadRegister().catch((err) => setError(err instanceof Error ? err.message : common("failed")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, date]);

  async function save(notifyAbsences: boolean) {
    setPending(notifyAbsences ? "alert" : "save");
    setError(null);
    try {
      const result = await api<{ marked: number; notifications: { sent: number; skipped: number } }>("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          sectionId,
          date,
          notifyAbsences,
          marks: Object.entries(marks).map(([studentId, status]) => ({ studentId, status })),
        }),
      });
      if (notifyAbsences) {
        toast.success(t("savedAlerts", { sent: result.notifications.sent, skipped: result.notifications.skipped }));
      } else {
        toast.success(t("savedMarked", { count: result.marked }));
      }
      await loadRegister();
    } catch (err) {
      const text = err instanceof Error ? err.message : common("failed");
      setError(text);
      toast.error(text);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("lead")} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {sections.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptySetup")}
          action={
            <Button asChild variant="outline">
              <Link href="/setup">{common("goToSetup")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <select className={fieldSelectClass} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.class.name} {section.name}
              </option>
            ))}
          </select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      )}

      {sections.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("register")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roster.length === 0 ? (
              <EmptyState title={t("empty")} description={t("emptySetup")} className="border-0 bg-transparent py-8" />
            ) : (
              roster.map((row) => (
                <div key={row.student.id} className="flex flex-col gap-2 rounded-lg border bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{row.student.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{row.student.admissionNo}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setMarks((prev) => ({ ...prev, [row.student.id]: status }))}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                          marks[row.student.id] === status
                            ? STATUS_STYLES[status]
                            : "border-input bg-white text-muted-foreground hover:border-emerald-400 hover:text-foreground",
                        )}
                      >
                        {statusT(status)}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
            {roster.length > 0 ? (
              <div className="sticky bottom-3 flex flex-wrap gap-2 rounded-xl border bg-white/95 p-3 shadow-sm backdrop-blur">
                <Button onClick={() => save(false)} disabled={Boolean(pending)}>
                  {pending === "save" ? t("saving") : t("save")}
                </Button>
                <Button variant="secondary" onClick={() => save(true)} disabled={Boolean(pending)}>
                  {pending === "alert" ? t("saving") : t("saveAlert")}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {summaries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("summary", { date })}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map((row) => (
              <div key={row.section.id} className="rounded-lg border p-3">
                <p className="font-medium">
                  {row.section.class.name} {row.section.name}
                </p>
                <p className="text-2xl font-semibold">{row.percent}%</p>
                <p className="text-xs text-muted-foreground">
                  {t("presentN", { present: row.present, absent: row.absent, marked: row.marked })}
                </p>
                <Badge variant={row.percent >= 80 ? "success" : "warning"}>{row.percent >= 80 ? t("onTrack") : t("low")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
