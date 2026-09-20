"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function TenantStatusButtons({ id, status }: { id: string; status: string }) {
  const t = useTranslations("superAdmin");
  const router = useRouter();

  async function setStatus(next: "ACTIVE" | "SUSPENDED") {
    await fetch(`/api/super-admin/tenants/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {status !== "ACTIVE" ? (
        <Button size="sm" variant="secondary" onClick={() => setStatus("ACTIVE")}>
          {t("activate")}
        </Button>
      ) : null}
      {status !== "SUSPENDED" ? (
        <Button size="sm" variant="destructive" onClick={() => setStatus("SUSPENDED")}>
          {t("suspend")}
        </Button>
      ) : null}
    </div>
  );
}
