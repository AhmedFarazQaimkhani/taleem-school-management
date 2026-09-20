import { getLocale } from "next-intl/server";
import { OnboardingForm } from "@/components/onboarding-form";
import { AuthShell } from "@/components/auth-shell";

export default async function OnboardingPage() {
  const locale = await getLocale();
  return (
    <AuthShell locale={locale}>
      <OnboardingForm />
    </AuthShell>
  );
}
