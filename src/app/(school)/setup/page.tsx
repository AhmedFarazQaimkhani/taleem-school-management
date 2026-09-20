import { requireSchoolPage } from "@/lib/school-page";
import { SetupClient } from "@/components/setup-client";

export default async function SetupPage() {
  await requireSchoolPage(["ADMIN"]);
  return <SetupClient />;
}
