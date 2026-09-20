import { requireSchoolPage } from "@/lib/school-page";
import { AnnouncementsClient } from "@/components/announcements-client";
import { hasFeature } from "@/lib/plan";

export default async function AnnouncementsPage() {
  const { session, tenant } = await requireSchoolPage(["ADMIN", "TEACHER", "PARENT", "STUDENT"]);
  const canManage = session.user.role === "ADMIN" || session.user.role === "TEACHER";
  const canBroadcast = session.user.role === "ADMIN" && hasFeature(tenant.plan.featureFlags, "smsBroadcast");
  return <AnnouncementsClient canManage={canManage} canBroadcast={canBroadcast} />;
}
