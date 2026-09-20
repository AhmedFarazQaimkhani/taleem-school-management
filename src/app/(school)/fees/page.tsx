import { requireSchoolPage } from "@/lib/school-page";
import { FeesClient } from "@/components/fees-client";

export default async function FeesPage() {
  await requireSchoolPage(["ADMIN", "ACCOUNTANT"]);
  return <FeesClient />;
}
