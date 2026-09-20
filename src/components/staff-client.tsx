"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { formatPkr } from "@/lib/money";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fieldSelectClass } from "@/lib/utils";

type Staff = {
  id: string;
  employeeCode: string;
  name: string;
  type: string;
  designation: string | null;
  phone: string | null;
  salaryPaisa: number | null;
};

export function StaffClient() {
  const t = useTranslations("staffPage");
  const common = useTranslations("common");
  const toast = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh() {
    const payload = await api<{ staff: Staff[] }>("/api/staff?pageSize=50");
    setStaff(payload.staff);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("lead")} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("add")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const formEl = event.currentTarget;
              const form = new FormData(formEl);
              setPending(true);
              try {
                await api("/api/staff", {
                  method: "POST",
                  body: JSON.stringify({
                    employeeCode: form.get("employeeCode"),
                    name: form.get("name"),
                    nameUrdu: form.get("nameUrdu"),
                    phone: form.get("phone"),
                    email: form.get("email"),
                    type: form.get("type"),
                    designation: form.get("designation"),
                    salaryPkr: form.get("salaryPkr") ? Number(form.get("salaryPkr")) : null,
                    loginEmail: form.get("loginEmail"),
                    loginPassword: form.get("loginPassword"),
                    loginRole: form.get("type") === "ACCOUNTANT" ? "ACCOUNTANT" : "TEACHER",
                  }),
                });
                formEl.reset();
                toast.success(t("added"));
                await refresh();
              } catch (err) {
                const text = err instanceof Error ? err.message : common("failed");
                setError(text);
                toast.error(text);
              } finally {
                setPending(false);
              }
            }}
          >
            <div className="space-y-1">
              <Label>Employee code</Label>
              <Input name="employeeCode" required />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input name="name" required />
            </div>
            <div className="space-y-1">
              <Label>Name (Urdu)</Label>
              <Input name="nameUrdu" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input name="phone" />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <select name="type" className={fieldSelectClass} defaultValue="TEACHER">
                <option value="TEACHER">Teacher</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="ADMIN">Admin</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Designation</Label>
              <Input name="designation" placeholder="Class teacher" />
            </div>
            <div className="space-y-1">
              <Label>Monthly salary (PKR)</Label>
              <Input name="salaryPkr" type="number" min="0" />
            </div>
            <div className="space-y-1">
              <Label>Login email (optional)</Label>
              <Input name="loginEmail" type="email" />
            </div>
            <div className="space-y-1">
              <Label>Login password</Label>
              <Input name="loginPassword" type="password" minLength={8} />
            </div>
            <Button type="submit" className="sm:col-span-2 lg:col-span-3" disabled={pending}>
              {pending ? common("loading") : common("save")}
            </Button>
          </form>
        </CardContent>
      </Card>
      {staff.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyHint")} />
      ) : (
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-mono text-xs">{member.employeeCode}</TableCell>
                <TableCell>
                  {member.name}
                  <div className="text-xs text-muted-foreground">{member.designation}</div>
                </TableCell>
                <TableCell>{member.type}</TableCell>
                <TableCell>{member.salaryPaisa ? formatPkr(member.salaryPaisa) : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!confirm(`Remove ${member.name}?`)) return;
                      await api(`/api/staff/${member.id}`, { method: "DELETE" });
                      toast.success(common("saved"));
                      await refresh();
                    }}
                  >
                    Remove
                  </Button>
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
