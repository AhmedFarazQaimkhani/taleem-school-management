import { describe, expect, it } from "vitest";
import { applyPayment, collectionPercent, remainingPaisa } from "../src/lib/fees/calculate";
import { pkrToPaisa } from "../src/lib/money";

describe("fee calculation", () => {
  it("tracks remaining balance in paisa", () => {
    const invoice = { amountPaisa: pkrToPaisa(5000), paidPaisa: pkrToPaisa(1500) };
    expect(remainingPaisa(invoice)).toBe(pkrToPaisa(3500));
  });

  it("marks invoice paid only when remaining is zero", () => {
    const invoice = { amountPaisa: 10_000, paidPaisa: 0 };
    const partial = applyPayment(invoice, 4_000);
    expect(partial.status).toBe("PARTIAL");
    expect(partial.remainingPaisa).toBe(6_000);
    const paid = applyPayment({ amountPaisa: 10_000, paidPaisa: partial.paidPaisa }, 6_000);
    expect(paid.status).toBe("PAID");
    expect(paid.remainingPaisa).toBe(0);
  });

  it("computes collection percent without floats in money", () => {
    expect(collectionPercent(pkrToPaisa(10000), pkrToPaisa(2500))).toBe(25);
    expect(collectionPercent(0, 100)).toBe(0);
  });
});
