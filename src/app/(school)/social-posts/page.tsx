import { requireSchoolPage } from "@/lib/school-page";
import { SocialPostsClient } from "@/components/social-posts-client";

export default async function SocialPostsPage() {
  const { tenant } = await requireSchoolPage(["ADMIN", "TEACHER"]);
  return <SocialPostsClient schoolName={tenant.name} logoKey={tenant.logoKey} />;
}
