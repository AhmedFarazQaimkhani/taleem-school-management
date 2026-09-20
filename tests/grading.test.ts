import { describe, expect, it } from "vitest";
import { gradeExam, letterGrade, percentage } from "../src/lib/grading/grade";

describe("grading", () => {
  it("maps percentages to Pakistan-style letter grades", () => {
    expect(letterGrade(91)).toBe("A+");
    expect(letterGrade(80)).toBe("A");
    expect(letterGrade(70)).toBe("B");
    expect(letterGrade(60)).toBe("C");
    expect(letterGrade(50)).toBe("D");
    expect(letterGrade(49.99)).toBe("F");
  });

  it("computes percent and grade from marks", () => {
    expect(percentage(85, 100)).toBe(85);
    expect(gradeExam(45, 50)).toEqual({ percent: 90, grade: "A+" });
  });

  it("rejects invalid totals", () => {
    expect(() => percentage(10, 0)).toThrow();
  });
});
