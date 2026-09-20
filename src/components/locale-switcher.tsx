"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher({ current, dark }: { current: string; dark?: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function setLocale(locale: string) {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    startTransition(() => router.refresh());
  }

  const idle = dark ? "text-white/80 hover:bg-white/10 hover:text-white" : undefined;
  const active = dark ? "bg-white/15 text-white hover:bg-white/20" : undefined;

  return (
    <div className="flex items-center gap-1 text-xs">
      <Button
        type="button"
        variant={current === "en" ? "secondary" : "ghost"}
        size="sm"
        className={current === "en" ? active : idle}
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        variant={current === "ur" ? "secondary" : "ghost"}
        size="sm"
        className={current === "ur" ? active : idle}
        onClick={() => setLocale("ur")}
      >
        اردو
      </Button>
    </div>
  );
}
