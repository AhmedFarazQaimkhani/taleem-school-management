import { describe, expect, it } from "vitest";
import { addCalendarDays, lastNDays, resolveDashboardFilters } from "../src/lib/services/dashboard";

describe("dashboard date series", () => {
  it("walks backward across month boundaries", () => {
    expect(addCalendarDays({ year: 2026, month: 9, day: 1 }, -1)).toEqual({ year: 2026, month: 8, day: 31 });
  });

  it("returns 14 inclusive Pakistan days ending today", () => {
    const days = lastNDays(14, { year: 2026, month: 9, day: 20 });
    expect(days).toHaveLength(14);
    expect(days[0]).toEqual({ year: 2026, month: 9, day: 7 });
    expect(days[13]).toEqual({ year: 2026, month: 9, day: 20 });
  });

  it("resolves month and custom dashboard ranges", () => {
    const today = { year: 2026, month: 9, day: 20 };
    expect(resolveDashboardFilters({ range: "month" }, today).from).toEqual({ year: 2026, month: 9, day: 1 });
    const custom = resolveDashboardFilters({ range: "custom", from: "2026-08-01", to: "2026-08-15" }, today);
    expect(custom.from).toEqual({ year: 2026, month: 8, day: 1 });
    expect(custom.to).toEqual({ year: 2026, month: 8, day: 15 });
  });
});
