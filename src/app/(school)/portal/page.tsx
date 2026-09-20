import { requireSchoolPage } from "@/lib/school-page";
import { PortalClient } from "@/components/portal-client";
import { redirect } from "next/navigation";

export default async function PortalPage() {
  const { session, features } = await requireSchoolPage(["PARENT", "STUDENT"]);
  if (session.user.role === "PARENT" && !features.parentPortal) redirect("/dashboard?locked=parentPortal");
  if (session.user.role === "STUDENT" && !features.studentPortal) redirect("/dashboard?locked=studentPortal");
  return <PortalClient />;
}
