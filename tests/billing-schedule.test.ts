import { describe, expect, it } from "vitest";
import {
  billingPreview,
  clampDayOfMonth,
  dueDateIso,
  ordinal,
  periodLabel,
  shouldAutoGenerate,
} from "../src/lib/billing-schedule";

describe("monthly invoice schedule", () => {
  it("labels the billing period in en-GB", () => {
    expect(periodLabel(2026, 9)).toBe("Sep 2026");
    expect(periodLabel(2026, 1)).toBe("Jan 2026");
  });

  it("defaults due dates to the 10th and clamps to the month", () => {
    expect(dueDateIso(2026, 9, 10)).toBe("2026-09-10");
    expect(dueDateIso(2026, 2, 30)).toBe("2026-02-28");
    expect(clampDayOfMonth(0)).toBe(1);
    expect(clampDayOfMonth(31)).toBe(28);
  });

  it("runs auto-generation on and after the issue day", () => {
    expect(shouldAutoGenerate({ year: 2026, month: 9, day: 1 }, 1)).toBe(true);
    expect(shouldAutoGenerate({ year: 2026, month: 9, day: 9 }, 10)).toBe(false);
    expect(shouldAutoGenerate({ year: 2026, month: 9, day: 10 }, 10)).toBe(true);
  });

  it("explains the customizable 10th-of-month default", () => {
    const preview = billingPreview({ year: 2026, month: 9, day: 20 }, 10, 1);
    expect(preview.periodLabel).toBe("Sep 2026");
    expect(preview.dueDate).toBe("2026-09-10");
    expect(preview.generateDate).toBe("2026-09-01");
    expect(ordinal(10)).toBe("10th");
    expect(preview.summary).toContain("1st");
    expect(preview.summary).toContain("10th");
  });
});
