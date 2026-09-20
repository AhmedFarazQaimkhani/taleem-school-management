import { getTranslations } from "next-intl/server";
import { requireSchoolPage } from "@/lib/school-page";
import { tenantReport } from "@/lib/services/reports";
import { formatPkr } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  const { tenant, schoolId } = await requireSchoolPage(["ADMIN", "TEACHER", "ACCOUNTANT"]);
  const report = await tenantReport(schoolId);
  const t = await getTranslations("reportsPage");
  const dash = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("lead", { school: tenant.name })}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{dash("enrollment")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{report.enrollment}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("attendancePercent")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{report.attendancePercent}%</p>
            <p className="text-xs text-muted-foreground">{t("markedDays", { count: report.attendanceMarked })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("feePercent")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{report.feeCollectionPercent}%</p>
            <p className="text-xs text-muted-foreground">
              {formatPkr(report.collectedPaisa)} / {formatPkr(report.billedPaisa)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
