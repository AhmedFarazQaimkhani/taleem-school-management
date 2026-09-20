"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { onboardTenantSchema, type OnboardTenantInput } from "@/lib/validations/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  priceMonthlyPkr: number;
  maxStudents: number;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function OnboardingForm() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<OnboardTenantInput>({
    resolver: zodResolver(onboardTenantSchema),
    defaultValues: {
      schoolName: "",
      slug: "",
      planId: "",
      adminName: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  const schoolName = form.watch("schoolName");
  const slug = form.watch("slug");
  const planId = form.watch("planId");

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((payload) => {
        const list = payload.data?.plans ?? [];
        setPlans(list);
        if (list[0] && !form.getValues("planId")) {
          form.setValue("planId", list[0].id);
        }
      })
      .catch(() => setError(t("plansFailed")));
  }, [form, t]);

  useEffect(() => {
    if (!slugTouched) form.setValue("slug", slugify(schoolName));
  }, [form, schoolName, slugTouched]);

  async function onSubmit(values: OnboardTenantInput) {
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error?.message ?? t("createFailed"));
      return;
    }
    const { protocol, hostname, port } = window.location;
    const suffix = port ? `:${port}` : "";
    const nextHost =
      hostname === "localhost" || hostname.endsWith(".localhost")
        ? `${values.slug}.localhost${suffix}`
        : `${values.slug}.${hostname.replace(/^[^.]+\./, "")}${suffix}`;
    window.location.assign(`${protocol}//${nextHost}/login`);
  }

  return (
    <div className="auth-card">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{t("eyebrow")}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("lead")}</p>

      <div className="mt-5 flex gap-2">
        <div className={cn("h-1.5 flex-1 rounded-full", step === 1 ? "bg-emerald-700" : "bg-emerald-200")} />
        <div className={cn("h-1.5 flex-1 rounded-full", step === 2 ? "bg-emerald-700" : "bg-emerald-200")} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{step === 1 ? t("stepSchool") : t("stepAdmin")}</p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="schoolName">{t("schoolName")}</Label>
              <Input id="schoolName" {...form.register("schoolName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{t("slug")}</Label>
              <Input
                id="slug"
                {...form.register("slug", { onChange: () => setSlugTouched(true) })}
                placeholder="your-school"
              />
              <p className="text-xs text-muted-foreground">
                {t("urlPreview", { host: `${slug || "your-school"}.localhost:3000` })}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("plan")}</Label>
              <div className="grid gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => form.setValue("planId", plan.id)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-start transition",
                      planId === plan.id
                        ? "border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700"
                        : "border-input bg-white hover:border-emerald-400",
                    )}
                  >
                    <p className="text-sm font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Rs {plan.priceMonthlyPkr}/mo · {t("studentsCap", { count: plan.maxStudents })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                if (!form.getValues("schoolName") || !form.getValues("slug") || !form.getValues("planId")) {
                  setError(t("needSchool"));
                  return;
                }
                setError(null);
                setStep(2);
              }}
            >
              {t("continue")}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="adminName">{t("adminName")}</Label>
              <Input id="adminName" {...form.register("adminName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">{t("adminEmail")}</Label>
              <Input id="adminEmail" type="email" {...form.register("adminEmail")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">{t("adminPassword")}</Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  className="pe-10"
                  {...form.register("adminPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 end-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                {t("back")}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t("creating") : t("submit")}
              </Button>
            </div>
          </>
        )}
        {step === 1 && error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("haveSchool")}{" "}
        <Link href="/login" className="font-medium text-emerald-800 underline-offset-4 hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
