"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({
  defaultSlug,
  schoolName,
}: {
  defaultSlug: string | null;
  schoolName?: string | null;
}) {
  const t = useTranslations("forgotPassword");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState(defaultSlug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResetUrl(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, slug: defaultSlug || slug }),
    });
    const payload = await res.json();
    setPending(false);

    if (!res.ok) {
      setError(payload.error?.message ?? t("failed"));
      return;
    }

    setSent(true);
    if (payload.data?.resetUrl) setResetUrl(payload.data.resetUrl);
  }

  return (
    <div className="auth-card">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{t("eyebrow")}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        {schoolName ? t("titleSchool", { school: schoolName }) : t("title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("lead")}</p>

      {sent ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-emerald-900">{t("sent")}</p>
          {resetUrl ? (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-muted-foreground">{t("localLink")}</p>
              <Button asChild className="w-full">
                <Link href={resetUrl}>{t("openLink")}</Link>
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <form method="post" onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {defaultSlug ? null : (
            <div className="space-y-2">
              <Label htmlFor="slug">{t("slug")}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="happy-home"
              />
            </div>
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("sending") : t("submit")}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-emerald-800 underline-offset-4 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
