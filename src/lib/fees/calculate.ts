export type InvoiceLike = {
  amountPaisa: number;
  paidPaisa: number;
  status?: string;
};

export function remainingPaisa(invoice: InvoiceLike): number {
  return Math.max(0, invoice.amountPaisa - invoice.paidPaisa);
}

export function applyPayment(
  invoice: InvoiceLike,
  paymentPaisa: number,
): { paidPaisa: number; remainingPaisa: number; status: "ISSUED" | "PARTIAL" | "PAID" } {
  if (paymentPaisa < 0) {
    throw new Error("Payment amount cannot be negative");
  }
  const paidPaisa = invoice.paidPaisa + paymentPaisa;
  const remaining = Math.max(0, invoice.amountPaisa - paidPaisa);
  let status: "ISSUED" | "PARTIAL" | "PAID" = "ISSUED";
  if (paidPaisa <= 0) status = "ISSUED";
  else if (remaining === 0) status = "PAID";
  else status = "PARTIAL";
  return { paidPaisa, remainingPaisa: remaining, status };
}

export function collectionPercent(billedPaisa: number, collectedPaisa: number): number {
  if (billedPaisa <= 0) return 0;
  return Math.round((collectedPaisa / billedPaisa) * 10000) / 100;
}
