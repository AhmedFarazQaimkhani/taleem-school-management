"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { formatPkr } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Payment = {
  id: string;
  periodLabel: string;
  amountPaisa: number;
  status: string;
  method: string | null;
  staff: { name: string; employeeCode: string };
};

export function PayrollClient() {
  const t = useTranslations("payrollPage");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const payload = await api<{ payments: Payment[] }>("/api/payroll");
    setPayments(payload.payments);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("thisMonth")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              try {
                const result = await api<{ created: number; skipped: number; periodLabel: string }>("/api/payroll", {
                  method: "POST",
                  body: "{}",
                });
                setMessage(t("created", { created: result.created, period: result.periodLabel, skipped: result.skipped }));
                await refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
              }
            }}
          >
            {t("generate")}
          </Button>
        </CardContent>
      </Card>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.periodLabel}</TableCell>
                <TableCell>
                  {row.staff.name}
                  <div className="font-mono text-xs text-muted-foreground">{row.staff.employeeCode}</div>
                </TableCell>
                <TableCell>{formatPkr(row.amountPaisa)}</TableCell>
                <TableCell>
                  <Badge variant={row.status === "PAID" ? "success" : "warning"}>{row.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {row.status !== "PAID" ? (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await api(`/api/payroll/${row.id}`, { method: "POST", body: JSON.stringify({ method: "CASH" }) });
                        await refresh();
                      }}
                    >
                      {t("markPaid")}
                    </Button>
                  ) : (
                    row.method
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
