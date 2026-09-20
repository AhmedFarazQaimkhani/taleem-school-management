"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { formatPkr } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Child = {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  attendance: Array<{ date: string; status: string }>;
  invoices: Array<{ invoiceNo: string; remainingPaisa: number; effectiveStatus: string }>;
  results: Array<{ exam: string; subject: string; grade: string | null; marksObtained: number; marksTotal: number }>;
};

export function PortalClient() {
  const t = useTranslations("portalPage");
  const dash = useTranslations("dashboard");
  const fees = useTranslations("feesPage");
  const [children, setChildren] = useState<Child[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ children: Child[] }>("/api/portal/overview")
      .then((payload) => setChildren(payload.children))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {children.map((child) => (
        <div key={child.id} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {child.name} · {child.className} {child.sectionName}
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{dash("attendance")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {child.attendance.length === 0 ? <p className="text-muted-foreground">{t("noAttendance")}</p> : null}
                {child.attendance.map((row) => (
                  <p key={row.date}>
                    {String(row.date).slice(0, 10)} · {row.status}
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{fees("title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {child.invoices.length === 0 ? <p className="text-muted-foreground">{t("noInvoices")}</p> : null}
                {child.invoices.map((invoice) => (
                  <p key={invoice.invoiceNo}>
                    {invoice.invoiceNo} · {formatPkr(invoice.remainingPaisa)}{" "}
                    <Badge variant={invoice.effectiveStatus === "PAID" ? "success" : "warning"}>{invoice.effectiveStatus}</Badge>
                  </p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("results")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {child.results.length === 0 ? <p className="text-muted-foreground">{t("noResults")}</p> : null}
                {child.results.map((row, index) => (
                  <p key={`${row.exam}-${row.subject}-${index}`}>
                    {row.exam} · {row.subject}: {row.marksObtained}/{row.marksTotal} ({row.grade})
                  </p>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
