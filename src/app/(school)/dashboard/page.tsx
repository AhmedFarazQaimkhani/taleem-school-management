import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { requireSchoolPage } from "@/lib/school-page";
import { dashboardData } from "@/lib/services/dashboard";
import { formatPkr } from "@/lib/money";
import { brandHeader } from "@/lib/branding";
import { SchoolLogo } from "@/components/school-logo";
import { DashboardFilters } from "@/components/dashboard-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Banknote, CalendarCheck, Users, Wallet } from "lucide-react";

const DashboardCharts = dynamic(
  () => import("@/components/dashboard-charts").then((mod) => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-xl border bg-muted/60" />,
  },
);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { locked?: string; year?: string; class?: string; range?: string; from?: string; to?: string };
}) {
  const { tenant, session, schoolId, features, db } = await requireSchoolPage();
  if (session.user.role === "PARENT" && features.parentPortal) redirect("/portal");
  if (session.user.role === "STUDENT" && features.studentPortal) redirect("/portal");
  const t = await getTranslations("dashboard");
  const data = await dashboardData(schoolId, {
    yearId: searchParams.year,
    classId: searchParams.class,
    range: searchParams.range,
    from: searchParams.from,
    to: searchParams.to,
  });
  const [years, classes] = await Promise.all([
    db.academicYear.findMany({ orderBy: { startDate: "desc" }, select: { id: true, name: true } }),
    db.class.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, academicYearId: true } }),
  ]);
  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <SchoolLogo name={tenant.name} logoKey={tenant.logoKey} size="lg" className="ring-white/30" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">{brandHeader(tenant)}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("welcome", { name: session.user.name ?? "" })}</h1>
            <p className="mt-1 text-sm text-white/75">{t("planLine", { plan: tenant.plan.name, school: tenant.name })}</p>
          </div>
        </div>
      </div>
      {searchParams.locked ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("upgradeTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("upgradeBody", { feature: searchParams.locked, plan: tenant.plan.name })}
          </CardContent>
        </Card>
      ) : null}
      <DashboardFilters years={years} classes={classes} values={data.filters} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={t("enrollment")} value={String(summary.enrollment)} hint={t("enrollmentHint", { cap: tenant.plan.maxStudents })} />
        <StatCard
          icon={CalendarCheck}
          label={t("attendance")}
          value={`${summary.attendancePercent}%`}
          hint={t("attendanceHint", { count: summary.attendanceMarked })}
        />
        <StatCard
          icon={Wallet}
          label={t("feeCollection")}
          value={`${summary.feeCollectionPercent}%`}
          hint={t("feeHint", { collected: formatPkr(summary.collectedPaisa), billed: formatPkr(summary.billedPaisa) })}
        />
        <StatCard icon={Banknote} label={t("outstanding")} value={formatPkr(summary.outstandingPaisa)} hint={t("outstandingHint")} />
      </div>
      <DashboardCharts data={data} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
