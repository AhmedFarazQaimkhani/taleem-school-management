import { getTranslations } from "next-intl/server";
import { platformReport } from "@/lib/services/reports";
import { formatPkr } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function SuperAdminReportsPage() {
  const report = await platformReport();
  const t = await getTranslations("superAdmin");
  const dash = await getTranslations("dashboard");
  const reports = await getTranslations("reportsPage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("reportsTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("reportsLead")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{dash("enrollment")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{report.totals.enrollment}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{reports("attendancePercent")}</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{report.totals.attendancePercent}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{reports("feePercent")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{report.totals.feeCollectionPercent}%</p>
            <p className="text-xs text-muted-foreground">
              {formatPkr(report.totals.collectedPaisa)} / {formatPkr(report.totals.billedPaisa)}
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("school")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{dash("enrollment")}</TableHead>
              <TableHead>{dash("attendance")}</TableHead>
              <TableHead>{dash("feeCollection")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div className="font-medium">{tenant.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{tenant.slug}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={tenant.status === "ACTIVE" ? "success" : "warning"}>{tenant.status}</Badge>
                </TableCell>
                <TableCell>{tenant.enrollment}</TableCell>
                <TableCell>{tenant.attendancePercent}%</TableCell>
                <TableCell>{tenant.feeCollectionPercent}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
