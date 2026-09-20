export const PKR_PAISA = 100;

export function pkrToPaisa(pkr: number): number {
  if (!Number.isFinite(pkr)) {
    throw new Error("PKR amount must be a finite number");
  }
  return Math.round(pkr * PKR_PAISA);
}

export function paisaToPkr(paisa: number): number {
  return paisa / PKR_PAISA;
}

export function formatPkr(paisa: number, locale: string = "en-PK"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(paisaToPkr(paisa));
}
