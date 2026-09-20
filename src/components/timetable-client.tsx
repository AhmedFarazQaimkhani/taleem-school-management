"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

type Section = { id: string; name: string; class: { name: string } };
type Subject = { id: string; name: string };
type Staff = { id: string; name: string };
type Slot = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: { name: string };
  staff: { name: string } | null;
  section: { name: string; class: { name: string } };
};

export function TimetableClient({ canManage }: { canManage: boolean }) {
  const t = useTranslations("timetablePage");
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ sections: Section[] }>("/api/sections"),
      api<{ subjects: Subject[] }>("/api/subjects"),
      api<{ staff: Staff[] }>("/api/staff?pageSize=50").catch(() => ({ staff: [] as Staff[] })),
    ])
      .then(([sectionPayload, subjectPayload, staffPayload]) => {
        setSections(sectionPayload.sections);
        setSubjects(subjectPayload.subjects);
        setStaff(staffPayload.staff);
        if (sectionPayload.sections[0]) setSectionId(sectionPayload.sections[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  async function load() {
    if (!sectionId) return;
    const payload = await api<{ slots: Slot[] }>(`/api/timetable?sectionId=${sectionId}`);
    setSlots(payload.slots);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <select
        className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
        value={sectionId}
        onChange={(e) => setSectionId(e.target.value)}
      >
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.class.name} {section.name}
          </option>
        ))}
      </select>
      {canManage ? (
      <Card>
        <CardHeader>
          <CardTitle>{t("add")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const formEl = event.currentTarget;
              const form = new FormData(formEl);
              try {
                await api("/api/timetable", {
                  method: "POST",
                  body: JSON.stringify({
                    sectionId,
                    subjectId: form.get("subjectId"),
                    staffId: form.get("staffId") || null,
                    dayOfWeek: form.get("dayOfWeek"),
                    startTime: form.get("startTime"),
                    endTime: form.get("endTime"),
                    room: form.get("room"),
                  }),
                });
                formEl.reset();
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              }
            }}
          >
            <select name="dayOfWeek" className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" required>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <select name="subjectId" className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" required>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <select name="staffId" className="flex h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">No teacher</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <Input name="room" placeholder="Room" />
            <Input name="startTime" type="time" required />
            <Input name="endTime" type="time" required />
            <Button type="submit" className="sm:col-span-2">
              Add slot
            </Button>
          </form>
        </CardContent>
      </Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {DAYS.map((day) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-base">{t(`days.${day}`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {slots.filter((slot) => slot.dayOfWeek === day).length === 0 ? (
                <p className="text-muted-foreground">{t("empty")}</p>
              ) : (
                slots
                  .filter((slot) => slot.dayOfWeek === day)
                  .map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <p className="font-medium">{slot.subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.startTime}–{slot.endTime} · {slot.staff?.name ?? "Unassigned"} {slot.room ? `· ${slot.room}` : ""}
                        </p>
                      </div>
                      {canManage ? (
                      <Button size="sm" variant="outline" onClick={async () => {
                        await api(`/api/timetable/${slot.id}`, { method: "DELETE" });
                        await load();
                      }}>
                        Remove
                      </Button>
                      ) : null}
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
