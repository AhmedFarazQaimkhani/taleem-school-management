import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["en", "ur"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  const locale: Locale = cookieLocale === "ur" ? "ur" : "en";

  return {
    locale,
    timeZone: "Asia/Karachi",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
