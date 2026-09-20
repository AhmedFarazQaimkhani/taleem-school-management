import { requireSchoolPage } from "@/lib/school-page";
import { StaffClient } from "@/components/staff-client";

export default async function StaffPage() {
  await requireSchoolPage(["ADMIN", "ACCOUNTANT"]);
  return <StaffClient />;
}
