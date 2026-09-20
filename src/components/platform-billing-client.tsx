"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { formatPkr } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Invoice = {
  id: string;
  amountPaisa: number;
  status: string;
  dueDate: string | null;
  periodStart: string;
  periodEnd: string;
  tenant: { name: string; slug: string; status: string };
  plan: { name: string };
};

export function PlatformBillingClient() {
  const t = useTranslations("superAdmin");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const payload = await api<{ invoices: Invoice[] }>("/api/super-admin/billing");
    setInvoices(payload.invoices);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("billingTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("billingLead")}</p>
        </div>
        <Button
          onClick={async () => {
            try {
              const result = await api<{ created: number; skipped: number; period: string }>("/api/super-admin/billing", {
                method: "POST",
                body: JSON.stringify({ action: "generate" }),
              });
              setMessage(`Created ${result.created} invoices for ${result.period}, skipped ${result.skipped}.`);
              await refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed");
            }
          }}
        >
          Generate this month
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  {invoice.tenant.name}
                  <div className="font-mono text-xs text-muted-foreground">{invoice.tenant.slug}</div>
                </TableCell>
                <TableCell>{invoice.plan.name}</TableCell>
                <TableCell>{formatPkr(invoice.amountPaisa)}</TableCell>
                <TableCell>{invoice.dueDate ? invoice.dueDate.slice(0, 10) : "—"}</TableCell>
                <TableCell>
                  <Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "warning"}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {invoice.status !== "PAID" ? (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await api("/api/super-admin/billing", {
                          method: "POST",
                          body: JSON.stringify({ action: "pay", id: invoice.id, method: "BANK" }),
                        });
                        await refresh();
                      }}
                    >
                      Mark paid
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
