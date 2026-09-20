"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  defaultSlug,
  schoolName,
}: {
  defaultSlug: string | null;
  schoolName?: string | null;
}) {
  const t = useTranslations("login");
  const router = useRouter();
  const params = useSearchParams();
    const slugFromQuery = params.get("slug");
  const initialSlug = slugFromQuery ?? defaultSlug ?? "";
  const resetDone = params.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState(initialSlug);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      slug,
      redirect: false,
    });

    if (!result || result.error) {
      setPending(false);
      setError(t("invalid"));
      return;
    }

    const session = await getSession();
    const callback = params.get("callbackUrl");
    const destination =
      session?.user.role === "SUPER_ADMIN"
        ? callback?.startsWith("/super-admin")
          ? callback
          : "/super-admin"
        : callback || "/dashboard";

    router.push(destination);
    router.refresh();
  }

  return (
    <div className="auth-card">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{t("eyebrow")}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        {schoolName ? t("titleSchool", { school: schoolName }) : t("title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{schoolName ? t("schoolHint") : t("superHint")}</p>
      {resetDone ? <p className="mt-3 text-sm text-emerald-800">{t("resetOk")}</p> : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pe-10"
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
          <div className="flex justify-end">
            <Link
              href={defaultSlug ? `/forgot-password` : "/forgot-password"}
              className="text-xs font-medium text-emerald-800 underline-offset-4 hover:underline"
            >
              {t("forgot")}
            </Link>
          </div>
        </div>
        {defaultSlug ? (
          <input type="hidden" name="slug" value={defaultSlug} />
        ) : (
          <div className="space-y-2">
            <Label htmlFor="slug">{t("slug")}</Label>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="happy-home"
            />
            <p className="text-xs text-muted-foreground">{t("slugHint", { slug: slug || "your-school" })}</p>
          </div>
        )}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("signingIn") : t("submit")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("noSchool")}{" "}
        <Link href="/onboarding" className="font-medium text-emerald-800 underline-offset-4 hover:underline">
          {t("createSchool")}
        </Link>
      </p>
    </div>
  );
}
