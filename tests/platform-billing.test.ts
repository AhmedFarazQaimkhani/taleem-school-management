import { describe, expect, it } from "vitest";
import { daysBetween, platformPeriod } from "../src/lib/services/platform-billing";

describe("platform subscription periods", () => {
  it("bills a calendar month due on the 10th", () => {
    const period = platformPeriod(2026, 9);
    expect(period.label).toBe("Sep 2026");
    expect(period.dueDate.toISOString().slice(0, 10)).toBe("2026-09-10");
    expect(period.periodStart.toISOString().slice(0, 10)).toBe("2026-09-01");
    expect(period.periodEnd.toISOString().slice(0, 10)).toBe("2026-09-30");
  });

  it("counts whole days for grace periods", () => {
    expect(daysBetween(new Date("2026-09-10T00:00:00Z"), new Date("2026-09-24T00:00:00Z"))).toBe(14);
  });
});
