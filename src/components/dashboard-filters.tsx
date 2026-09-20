"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardFilters, DashboardRange } from "@/lib/services/dashboard";

type Year = { id: string; name: string };
type Klass = { id: string; name: string; academicYearId: string };

function iso(day: { year: number; month: number; day: number }) {
  return `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`;
}

export function DashboardFilters({
  years,
  classes,
  values,
}: {
  years: Year[];
  classes: Klass[];
  values: DashboardFilters;
}) {
  const t = useTranslations("dashboard");
  const common = useTranslations("common");
  const [yearId, setYearId] = useState(values.yearId ?? "");
  const [classId, setClassId] = useState(values.classId ?? "");
  const [range, setRange] = useState<DashboardRange>(values.range);
  const visibleClasses = yearId ? classes.filter((klass) => klass.academicYearId === yearId) : classes;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("filters")}</CardTitle>
        <CardDescription>{t("filtersHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action="/dashboard" method="get" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="year">{common("year")}</Label>
            <select
              id="year"
              name="year"
              value={yearId}
              onChange={(event) => {
                setYearId(event.target.value);
                setClassId("");
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{common("allYears")}</option>
              {years.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="class">{common("class")}</Label>
            <select
              id="class"
              name="class"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{common("allClasses")}</option>
              {visibleClasses.map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="range">{t("range")}</Label>
            <select
              id="range"
              name="range"
              value={range}
              onChange={(event) => setRange(event.target.value as DashboardRange)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="14d">{t("range14")}</option>
              <option value="30d">{t("range30")}</option>
              <option value="month">{t("rangeMonth")}</option>
              <option value="year">{t("rangeYear")}</option>
              <option value="custom">{t("rangeCustom")}</option>
            </select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="from">{common("from")}</Label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={iso(values.from)}
              disabled={range !== "custom"}
              className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="to">{common("to")}</Label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={iso(values.to)}
              disabled={range !== "custom"}
              className="flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:col-span-2 xl:col-span-5">
            <Button type="submit" className="shrink-0">
              {common("apply")}
            </Button>
            <Button type="button" variant="outline" className="shrink-0" asChild>
              <a href="/dashboard">{common("reset")}</a>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
