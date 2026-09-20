import { requireSchoolPage } from "@/lib/school-page";
import { ExamsClient } from "@/components/exams-client";

export default async function ExamsPage() {
  await requireSchoolPage(["ADMIN", "TEACHER"], "exams");
  return <ExamsClient />;
}
