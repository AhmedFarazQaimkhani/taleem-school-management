import { requireSchoolPage } from "@/lib/school-page";
import { AttendanceClient } from "@/components/attendance-client";

export default async function AttendancePage() {
  await requireSchoolPage(["ADMIN", "TEACHER"]);
  return <AttendanceClient />;
}
