import { requireSchoolPage } from "@/lib/school-page";
import { TimetableClient } from "@/components/timetable-client";

export default async function TimetablePage() {
  const { session } = await requireSchoolPage(["ADMIN", "TEACHER"], "timetable");
  return <TimetableClient canManage={session.user.role === "ADMIN"} />;
}
