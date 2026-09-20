"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardChartsData } from "@/lib/services/dashboard";

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: "#0f766e",
  LATE: "#d97706",
  ABSENT: "#dc2626",
  EXCUSED: "#64748b",
};

const GENDER_COLORS: Record<string, string> = {
  MALE: "#0f766e",
  FEMALE: "#d97706",
  OTHER: "#64748b",
};

const INVOICE_COLORS: Record<string, string> = {
  PAID: "#0f766e",
  PARTIAL: "#d97706",
  ISSUED: "#0e7490",
  OVERDUE: "#dc2626",
  DRAFT: "#64748b",
};

const PAYROLL_COLORS: Record<string, string> = {
  PAID: "#0f766e",
  PENDING: "#d97706",
};

const PIE_FALLBACK = ["#0f766e", "#d97706", "#0e7490", "#dc2626", "#64748b"];

function EmptyState({ message }: { message: string }) {
  return <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">{message}</p>;
}

function pkrTick(value: number) {
  return `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value)}`;
}

export function DashboardCharts({ data }: { data: DashboardChartsData }) {
  const t = useTranslations("dashboard");
  const status = useTranslations("status");
  const gender = useTranslations("gender");
  const months = useTranslations("months");

  const attendanceMix = data.attendanceMix
    .filter((row) => row.value > 0)
    .map((row) => ({ ...row, name: status(row.key) }));
  const genderMix = data.genderMix
    .filter((row) => row.value > 0)
    .map((row) => ({ ...row, name: gender(row.key) }));
  const invoiceStatus = data.invoiceStatus.map((row) => ({ ...row, name: status(row.key) }));
  const payrollMix = data.payrollMix
    .filter((row) => row.value > 0)
    .map((row) => ({ ...row, name: status(row.key) }));
  const enrollmentByClass = data.enrollmentByClass.map((row) => ({
    ...row,
    name: row.key === "unassigned" ? t("unassigned") : row.name,
  }));
  const feesByPeriod = data.feesByPeriod.map((row) => ({
    ...row,
    name: row.name === "unlabelled" ? t("unlabelled") : row.name,
  }));
  const attendanceTrend = data.attendanceTrend.map((row) => {
    const [year, month, day] = row.date.split("-");
    const label = day ? `${Number(day)} ${months(String(Number(month)))}` : `${months(String(Number(month)))} ${year}`;
    return { ...row, name: label };
  });
  const hasTrend = attendanceTrend.some((row) => row.marked > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("trendTitle")}</CardTitle>
          <CardDescription>{t("trendHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`, t("attendanceSeries")]} />
                  <Line type="monotone" dataKey="percent" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message={t("trendEmpty")} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("mixTitle")}</CardTitle>
          <CardDescription>{t("mixHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceMix.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendanceMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={2}>
                    {attendanceMix.map((row, index) => (
                      <Cell key={row.key} fill={ATTENDANCE_COLORS[row.key] ?? PIE_FALLBACK[index % PIE_FALLBACK.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message={t("mixEmpty")} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("genderTitle")}</CardTitle>
          <CardDescription>{t("genderHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {genderMix.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={2}>
                    {genderMix.map((row, index) => (
                      <Cell key={row.key} fill={GENDER_COLORS[row.key] ?? PIE_FALLBACK[index % PIE_FALLBACK.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message={t("genderEmpty")} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("classTitle")}</CardTitle>
          <CardDescription>{t("classHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {enrollmentByClass.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentByClass}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="students" name={t("students")} fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message={t("classEmpty")} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("invoiceTitle")}</CardTitle>
          <CardDescription>{t("invoiceHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {invoiceStatus.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={invoiceStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="invoices" name={t("invoices")} radius={[6, 6, 0, 0]}>
                    {invoiceStatus.map((row, index) => (
                      <Cell key={row.key} fill={INVOICE_COLORS[row.key] ?? PIE_FALLBACK[index % PIE_FALLBACK.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message={t("invoiceEmpty")} />
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("feesTitle")}</CardTitle>
          <CardDescription>{t("feesHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {feesByPeriod.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feesByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={pkrTick} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => pkrTick(Number(value))} />
                  <Legend />
                  <Bar dataKey="billed" name={t("billed")} fill="#0e7490" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="collected" name={t("collected")} fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message={t("feesEmpty")} />
          )}
        </CardContent>
      </Card>

      {payrollMix.length ? (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("payrollTitle")}</CardTitle>
            <CardDescription>{t("payrollHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payrollMix} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis type="number" tickFormatter={pkrTick} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => pkrTick(Number(value))} />
                  <Bar dataKey="value" name={t("payrollTitle")} radius={[0, 6, 6, 0]}>
                    {payrollMix.map((row, index) => (
                      <Cell key={row.key} fill={PAYROLL_COLORS[row.key] ?? PIE_FALLBACK[index % PIE_FALLBACK.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
