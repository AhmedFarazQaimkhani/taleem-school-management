"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { SchoolLogo } from "@/components/school-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Branding = {
  name: string;
  headerText: string | null;
  footerText: string | null;
  logoKey: string | null;
};

export function SettingsClient() {
  const t = useTranslations("settings");
  const router = useRouter();
  const [branding, setBranding] = useState<Branding | null>(null);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh() {
    const payload = await api<Branding>("/api/branding");
    setBranding(payload);
    setHeaderText(payload.headerText ?? "");
    setFooterText(payload.footerText ?? "");
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : t("removedLogo")));
  }, [t]);

  async function saveTexts(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const payload = await api<Branding>("/api/branding", {
        method: "PATCH",
        body: JSON.stringify({ headerText, footerText }),
      });
      setBranding(payload);
      setMessage(t("savedTexts"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function uploadLogo(file: File) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/branding/logo", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Upload failed");
      setBranding(json.data as Branding);
      setMessage(t("savedLogo"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function removeLogo() {
    setPending(true);
    setError(null);
    try {
      const payload = await api<Branding>("/api/branding/logo", { method: "DELETE" });
      setBranding(payload);
      setMessage(t("removedLogo"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-amber-50">
          <CardTitle>{t("preview")}</CardTitle>
          <CardDescription>{t("previewHint")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-amber-700/30 bg-white px-6 py-5 text-center shadow-inner">
            <div className="flex justify-center">
              <SchoolLogo name={branding?.name ?? t("school")} logoKey={branding?.logoKey} size="lg" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
              {headerText.trim() || branding?.name || t("header")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{t("previewDoc")}</p>
            <p className="mt-4 border-t pt-3 text-xs text-emerald-900/70">
              {footerText.trim() || t("previewFooter")}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("logo")}</CardTitle>
            <CardDescription>{t("logoHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <SchoolLogo name={branding?.name ?? t("school")} logoKey={branding?.logoKey} />
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={pending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadLogo(file);
                    event.target.value = "";
                  }}
                />
                {branding?.logoKey ? (
                  <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => void removeLogo()}>
                    {t("removeLogo")}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("headerFooter")}</CardTitle>
            <CardDescription>{t("headerFooterHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void saveTexts(event)}>
              <div className="space-y-1.5">
                <Label htmlFor="headerText">{t("header")}</Label>
                <Input
                  id="headerText"
                  value={headerText}
                  onChange={(event) => setHeaderText(event.target.value)}
                  maxLength={200}
                  placeholder="Greenwood High School · Excellence in Education"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="footerText">{t("footer")}</Label>
                <textarea
                  id="footerText"
                  value={footerText}
                  onChange={(event) => setFooterText(event.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="Authorized by the Principal · For verification contact the school office"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" disabled={pending}>
                {t("save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
