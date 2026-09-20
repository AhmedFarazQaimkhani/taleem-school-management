"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fieldSelectClass } from "@/lib/utils";

type Item = { id: string; title: string; body: string; audience: string; publishedAt: string | null };

export function AnnouncementsClient({ canManage, canBroadcast }: { canManage: boolean; canBroadcast: boolean }) {
  const t = useTranslations("announcementsPage");
  const common = useTranslations("common");
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh() {
    const payload = await api<{ announcements: Item[] }>("/api/announcements");
    setItems(payload.announcements);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : common("failed")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("lead")} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const formEl = event.currentTarget;
                const form = new FormData(formEl);
                setPending(true);
                try {
                  await api("/api/announcements", {
                    method: "POST",
                    body: JSON.stringify({
                      title: form.get("title"),
                      body: form.get("body"),
                      audience: form.get("audience"),
                    }),
                  });
                  formEl.reset();
                  toast.success(t("published"));
                  await refresh();
                } catch (err) {
                  const text = err instanceof Error ? err.message : common("failed");
                  setError(text);
                  toast.error(text);
                } finally {
                  setPending(false);
                }
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="ann-title">{t("titleLabel")}</Label>
                <Input id="ann-title" name="title" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ann-body">{t("bodyLabel")}</Label>
                <textarea
                  id="ann-body"
                  name="body"
                  required
                  className="min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm"
                />
              </div>
              <select name="audience" className={fieldSelectClass} defaultValue="ALL">
                <option value="ALL">{t("audience.ALL")}</option>
                <option value="STAFF">{t("audience.STAFF")}</option>
                <option value="PARENTS">{t("audience.PARENTS")}</option>
                <option value="STUDENTS">{t("audience.STUDENTS")}</option>
              </select>
              <Button type="submit" disabled={pending}>
                {pending ? t("publishing") : t("publish")}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      {items.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyHint")} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{item.body}</p>
                <p className="text-xs text-muted-foreground">{t(`audience.${item.audience}` as "audience.ALL")}</p>
                {canBroadcast ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const result = await api<{ sent: number }>(`/api/announcements/${item.id}/broadcast`, { method: "POST" });
                        toast.success(t("broadcastSent", { sent: result.sent }));
                      } catch (err) {
                        const text = err instanceof Error ? err.message : common("failed");
                        setError(text);
                        toast.error(text);
                      }
                    }}
                  >
                    {t("broadcast")}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
