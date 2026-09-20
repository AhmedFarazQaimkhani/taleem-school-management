import { requireSchoolPage } from "@/lib/school-page";
import { StudentsClient } from "@/components/students-client";

export default async function StudentsPage() {
  const { session } = await requireSchoolPage(["ADMIN", "TEACHER", "ACCOUNTANT"]);
  return <StudentsClient canManage={session.user.role === "ADMIN"} />;
}
