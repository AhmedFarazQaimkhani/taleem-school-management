import { requireSchoolPage } from "@/lib/school-page";
import { PayrollClient } from "@/components/payroll-client";

export default async function PayrollPage() {
  await requireSchoolPage(["ADMIN", "ACCOUNTANT"], "payroll");
  return <PayrollClient />;
}
