import { requireSchoolPage } from "@/lib/school-page";
import { SettingsClient } from "@/components/settings-client";

export default async function SettingsPage() {
  await requireSchoolPage(["ADMIN"]);
  return <SettingsClient />;
}
