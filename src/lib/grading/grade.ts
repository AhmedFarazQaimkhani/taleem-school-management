/** Typical Pakistan school grading bands. Pure function — no AI. */
export type LetterGrade = "A+" | "A" | "B" | "C" | "D" | "F";

export function percentage(obtained: number, total: number): number {
  if (total <= 0) throw new Error("Total marks must be greater than 0");
  if (obtained < 0) throw new Error("Obtained marks cannot be negative");
  return Math.round((obtained / total) * 10000) / 100;
}

export function letterGrade(percent: number): LetterGrade {
  if (percent >= 90) return "A+";
  if (percent >= 80) return "A";
  if (percent >= 70) return "B";
  if (percent >= 60) return "C";
  if (percent >= 50) return "D";
  return "F";
}

export function gradeExam(obtained: number, total: number): { percent: number; grade: LetterGrade } {
  const percent = percentage(obtained, total);
  return { percent, grade: letterGrade(percent) };
}
