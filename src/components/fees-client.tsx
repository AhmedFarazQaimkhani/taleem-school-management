"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { formatPkr, paisaToPkr } from "@/lib/money";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fieldSelectClass } from "@/lib/utils";

type Structure = {
  id: string;
  name: string;
  amountPaisa: number;
  frequency: string;
  class?: { name: string } | null;
  academicYear: { name: string };
};
type Invoice = {
  id: string;
  invoiceNo: string;
  periodLabel: string | null;
  amountPaisa: number;
  paidPaisa: number;
  remainingPaisa: number;
  effectiveStatus: string;
  dueDate: string;
  student: { name: string; admissionNo: string };
};
type Year = { id: string; name: string };
type Klass = { id: string; name: string };
type Billing = {
  autoInvoiceEnabled: boolean;
  invoiceDueDay: number;
  invoiceGenerateDay: number;
  preview: { periodLabel: string; dueDate: string; generateDate: string; summary: string };
};

function statusVariant(status: string) {
  if (status === "PAID") return "success" as const;
  if (status === "OVERDUE") return "danger" as const;
  if (status === "PARTIAL") return "warning" as const;
  return "secondary" as const;
}

export function FeesClient() {
  const t = useTranslations("feesPage");
  const common = useTranslations("common");
  const statusT = useTranslations("status");
  const toast = useToast();
  const [structures, setStructures] = useState<Structure[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [billing, setBilling] = useState<Billing | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const params = new URLSearchParams({ pageSize: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const [structurePayload, invoicePayload, yearPayload, classPayload] = await Promise.all([
      api<{ structures: Structure[] }>("/api/fee-structures"),
      api<{ invoices: Invoice[] }>(`/api/fee-invoices?${params}`),
      api<{ years: Year[] }>("/api/academic-years"),
      api<{ classes: Klass[] }>("/api/classes"),
    ]);
    setStructures(structurePayload.structures);
    setInvoices(invoicePayload.invoices);
    setYears(yearPayload.years);
    setClasses(classPayload.classes);
    try {
      setBilling(await api<Billing>("/api/billing"));
    } catch {
      setBilling(null);
    }
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  useEffect(() => {
    api<{ ran: boolean; created: number; periodLabel?: string }>("/api/fee-invoices/auto", {
      method: "POST",
      body: "{}",
    })
      .then((result) => {
        if (result.ran && result.created > 0) {
          toast.success(`Auto-created ${result.created} invoices for ${result.periodLabel}.`);
          return refresh();
        }
        return undefined;
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pay(invoice: Invoice, method: "CASH" | "JAZZCASH" | "EASYPAISA") {
    const remaining = paisaToPkr(invoice.remainingPaisa);
    try {
      const result = await api<{ status: string; checkoutUrl: string | null }>(`/api/fee-invoices/${invoice.id}`, {
        method: "POST",
        body: JSON.stringify({ amountPkr: remaining, method }),
      });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      toast.success(t("paidToast", { method, invoice: invoice.invoiceNo }));
      await refresh();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Payment failed";
      setError(text);
      toast.error(text);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("lead")} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {billing ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("monthly")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              key={`${billing.autoInvoiceEnabled}-${billing.invoiceDueDay}-${billing.invoiceGenerateDay}`}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                try {
                  const saved = await api<Billing>("/api/billing", {
                    method: "PATCH",
                    body: JSON.stringify({
                      autoInvoiceEnabled: form.get("autoInvoiceEnabled") === "on",
                      invoiceGenerateDay: Number(form.get("invoiceGenerateDay")),
                      invoiceDueDay: Number(form.get("invoiceDueDay")),
                    }),
                  });
                  setBilling(saved);
                  toast.success(saved.preview.summary);
                } catch (err) {
                  const text = err instanceof Error ? err.message : "Could not save billing";
                  setError(text);
                  toast.error(text);
                }
              }}
            >
              <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-4">
                <input type="checkbox" name="autoInvoiceEnabled" defaultChecked={billing.autoInvoiceEnabled} />
                Generate MONTHLY fee invoices automatically each month
              </label>
              <div className="space-y-1">
                <Label>Issue on day</Label>
                <Input name="invoiceGenerateDay" type="number" min={1} max={28} defaultValue={billing.invoiceGenerateDay} required />
              </div>
              <div className="space-y-1">
                <Label>Due on day</Label>
                <Input name="invoiceDueDay" type="number" min={1} max={28} defaultValue={billing.invoiceDueDay} required />
              </div>
              <Button type="submit">{t("saveSchedule")}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    const result = await api<{ created: number; skipped: number; periodLabel: string; dueDate: string }>(
                      "/api/fee-invoices/auto",
                      { method: "POST", body: JSON.stringify({ force: true }) },
                    );
                    toast.success(`Created ${result.created} invoices for ${result.periodLabel} (due ${result.dueDate}), skipped ${result.skipped}.`);
                    await refresh();
                  } catch (err) {
                    const text = err instanceof Error ? err.message : "Could not generate invoices";
                    setError(text);
                    toast.error(text);
                  }
                }}
              >
                {t("generateMonth")}
              </Button>
            </form>
            <p className="mt-3 text-sm text-muted-foreground">{billing.preview.summary}</p>
            <p className="text-xs text-muted-foreground">
              This month: {billing.preview.periodLabel} · issued {billing.preview.generateDate} · due {billing.preview.dueDate}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("structure")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const formEl = event.currentTarget;
                const form = new FormData(formEl);
                await api("/api/fee-structures", {
                  method: "POST",
                  body: JSON.stringify({
                    academicYearId: form.get("academicYearId"),
                    classId: form.get("classId") || null,
                    name: form.get("name"),
                    amountPkr: Number(form.get("amountPkr")),
                    frequency: form.get("frequency"),
                  }),
                });
                formEl.reset();
                await refresh();
              }}
            >
              <Input name="name" placeholder="Monthly tuition" required className="sm:col-span-2" />
              <Input name="amountPkr" type="number" min="1" placeholder="PKR" required />
              <select name="frequency" className={fieldSelectClass} defaultValue="MONTHLY">
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ONE_TIME">One time</option>
              </select>
              <select name="academicYearId" className={fieldSelectClass} required>
                {years.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
              <select name="classId" className={fieldSelectClass}>
                <option value="">All classes</option>
                {classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                  </option>
                ))}
              </select>
              <Button type="submit" className="sm:col-span-2">
                {t("addStructure")}
              </Button>
            </form>
            <ul className="space-y-2 text-sm">
              {structures.length === 0 ? (
                <li className="text-muted-foreground">{t("emptyStructures")}</li>
              ) : (
                structures.map((structure) => (
                  <li key={structure.id} className="rounded-md bg-muted px-3 py-2">
                    {structure.name} · {formatPkr(structure.amountPaisa)} · {structure.frequency}
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("manual")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Use this for quarterly / one-time fees, or to backfill another month. Monthly tuition is billed automatically.
            </p>
            <form
              key={billing?.preview.dueDate ?? "manual"}
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                try {
                  const result = await api<{ created: number; skipped: number }>("/api/fee-invoices", {
                    method: "POST",
                    body: JSON.stringify({
                      feeStructureId: form.get("feeStructureId"),
                      periodLabel: form.get("periodLabel"),
                      dueDate: form.get("dueDate"),
                    }),
                  });
                  toast.success(`Created ${result.created} invoices, skipped ${result.skipped}.`);
                  await refresh();
                } catch (err) {
                  const text = err instanceof Error ? err.message : "Could not generate invoices";
                  setError(text);
                  toast.error(text);
                }
              }}
            >
              <select name="feeStructureId" className={`${fieldSelectClass} w-full`} required>
                {structures.map((structure) => (
                  <option key={structure.id} value={structure.id}>
                    {structure.name} ({formatPkr(structure.amountPaisa)})
                  </option>
                ))}
              </select>
              <Input name="periodLabel" placeholder="Sep 2026" defaultValue={billing?.preview.periodLabel} required />
              <div className="space-y-1">
                <Label>{t("dueDate")}</Label>
                <Input name="dueDate" type="date" defaultValue={billing?.preview.dueDate} required />
              </div>
              <Button type="submit">{t("generate")}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={fieldSelectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{common("allStatuses")}</option>
          <option value="ISSUED">{statusT("ISSUED")}</option>
          <option value="PARTIAL">{statusT("PARTIAL")}</option>
          <option value="PAID">{statusT("PAID")}</option>
          <option value="OVERDUE">{statusT("OVERDUE")}</option>
        </select>
        <Button
          variant="secondary"
          onClick={async () => {
            const result = await api<{ sent: number }>("/api/fee-invoices/reminders", { method: "POST", body: "{}" });
            toast.success(t("remindersSent", { sent: result.sent }));
          }}
        >
          {t("reminders")}
        </Button>
      </div>

      {invoices.length === 0 ? (
        <EmptyState title={t("emptyInvoices")} />
      ) : (
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-mono text-xs">{invoice.invoiceNo}</TableCell>
                <TableCell>
                  {invoice.student.name}
                  <div className="font-mono text-xs text-muted-foreground">{invoice.student.admissionNo}</div>
                </TableCell>
                <TableCell>{invoice.dueDate.slice(0, 10)}</TableCell>
                <TableCell>{formatPkr(invoice.remainingPaisa)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(invoice.effectiveStatus)}>{invoice.effectiveStatus}</Badge>
                </TableCell>
                <TableCell className="space-x-1 text-right">
                  {invoice.remainingPaisa > 0 ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => pay(invoice, "CASH")}>
                        Cash
                      </Button>
                      <Button size="sm" onClick={() => pay(invoice, "JAZZCASH")}>
                        JazzCash
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => pay(invoice, "EASYPAISA")}>
                        EasyPaisa
                      </Button>
                    </>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/fees/invoices/${invoice.id}/receipt`}>{t("receipt")}</Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
