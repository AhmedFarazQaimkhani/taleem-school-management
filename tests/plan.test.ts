import { describe, expect, it } from "vitest";
import { hasFeature, parseFeatureFlags } from "../src/lib/plan";

describe("plan feature gating", () => {
  it("defaults exams and payroll off", () => {
    const flags = parseFeatureFlags({});
    expect(flags.exams).toBe(false);
    expect(flags.payroll).toBe(false);
    expect(hasFeature({}, "exams")).toBe(false);
  });

  it("enables flagged modules", () => {
    expect(hasFeature({ exams: true, payroll: true }, "exams")).toBe(true);
    expect(hasFeature({ exams: true }, "timetable")).toBe(false);
  });
});
