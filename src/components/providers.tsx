"use client";

import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}) {
  return (
    <SessionProvider>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Karachi">
        <ToastProvider>{children}</ToastProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
