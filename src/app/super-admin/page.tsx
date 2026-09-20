import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TenantStatusButtons } from "@/components/tenant-status-buttons";
import { formatPkr } from "@/lib/money";

function statusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "TRIAL") return "warning" as const;
  return "danger" as const;
}

export default async function SuperAdminPage() {
  const t = await getTranslations("superAdmin");
  const common = await getTranslations("common");
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      _count: { select: { students: true, users: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("lead")}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[12rem]">{t("school")}</TableHead>
              <TableHead>{common("plan")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("usage")}</TableHead>
              <TableHead className="text-right">{common("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div className="font-medium">{tenant.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{tenant.slug}</div>
                </TableCell>
                <TableCell>
                  {tenant.plan.name}
                  <div className="text-xs text-muted-foreground">{formatPkr(tenant.plan.priceMonthlyPaisa)}/mo</div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {tenant._count.users} users · {tenant._count.students}/{tenant.plan.maxStudents} students
                </TableCell>
                <TableCell className="text-right">
                  <TenantStatusButtons id={tenant.id} status={tenant.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
