const PK_TZ = "Asia/Karachi";

export type CalendarDay = {
  year: number;
  month: number;
  day: number;
};

export function pakistanToday(now = new Date()): CalendarDay {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const lookup = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

export function clampDayOfMonth(day: number) {
  return Math.min(28, Math.max(1, Math.round(day)));
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function dueDateIso(year: number, month: number, dueDay: number) {
  const day = Math.min(clampDayOfMonth(dueDay), daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function periodLabel(year: number, month: number) {
  return `${MONTHS[month - 1]} ${year}`;
}

export function ordinal(day: number) {
  const clamped = clampDayOfMonth(day);
  const mod = clamped % 100;
  if (mod >= 11 && mod <= 13) return `${clamped}th`;
  switch (clamped % 10) {
    case 1:
      return `${clamped}st`;
    case 2:
      return `${clamped}nd`;
    case 3:
      return `${clamped}rd`;
    default:
      return `${clamped}th`;
  }
}

export function shouldAutoGenerate(today: CalendarDay, generateDay: number) {
  return today.day >= clampDayOfMonth(generateDay);
}

export function billingPreview(today: CalendarDay, dueDay: number, generateDay: number) {
  return {
    periodLabel: periodLabel(today.year, today.month),
    dueDate: dueDateIso(today.year, today.month, dueDay),
    generateDate: dueDateIso(today.year, today.month, generateDay),
    summary: `Monthly invoices are created on the ${ordinal(generateDay)} and due on the ${ordinal(dueDay)} of each month.`,
  };
}
