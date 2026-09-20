import { requireSchoolPage } from "@/lib/school-page";
import { CertificatesClient } from "@/components/certificates-client";

export default async function CertificatesPage() {
  await requireSchoolPage(["ADMIN"], "certificates");
  return <CertificatesClient />;
}
