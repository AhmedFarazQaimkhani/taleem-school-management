import { PrismaClient, type AttendanceStatus, type FeeInvoiceStatus } from "@prisma/client";
import { gradeExam } from "../src/lib/grading/grade";
import { pkrToPaisa } from "../src/lib/money";

const prisma = new PrismaClient();

const TARGET_STUDENTS = 2000;
const MARKER = "[seed] Five-year history";

const LADDER = [
  { name: "Montessori", sort: 0, band: "early", fee: 4000, quota: 90 },
  { name: "Nursery", sort: 1, band: "early", fee: 4500, quota: 100 },
  { name: "KG", sort: 2, band: "early", fee: 5000, quota: 110 },
  { name: "Class 1", sort: 3, band: "primary", fee: 5500, quota: 170 },
  { name: "Class 2", sort: 4, band: "primary", fee: 6000, quota: 170 },
  { name: "Class 3", sort: 5, band: "primary", fee: 6500, quota: 170 },
  { name: "Class 4", sort: 6, band: "primary", fee: 7000, quota: 170 },
  { name: "Class 5", sort: 7, band: "primary", fee: 7500, quota: 180 },
  { name: "Class 6", sort: 8, band: "middle", fee: 8000, quota: 180 },
  { name: "Class 7", sort: 9, band: "middle", fee: 8500, quota: 170 },
  { name: "Class 8", sort: 10, band: "middle", fee: 9000, quota: 160 },
  { name: "Class 9", sort: 11, band: "matric", fee: 9500, quota: 160 },
  { name: "Class 10", sort: 12, band: "matric", fee: 10000, quota: 170 },
] as const;

const YEARS = [
  { name: "2022-2023", start: "2022-08-01", end: "2023-05-31", current: false },
  { name: "2023-2024", start: "2023-08-01", end: "2024-05-31", current: false },
  { name: "2024-2025", start: "2024-08-01", end: "2025-05-31", current: false },
  { name: "2025-2026", start: "2025-08-01", end: "2026-05-31", current: false },
  { name: "2026-2027", start: "2026-08-01", end: "2027-05-31", current: true },
] as const;

const FIRST_M = ["Ali", "Ahmed", "Hassan", "Usman", "Bilal", "Omar", "Zain", "Hamza", "Ibrahim", "Yusuf", "Sami", "Taha", "Rayyan", "Daniyal", "Haris", "Faizan", "Rehan", "Shahzaib", "Ayaan", "Mustafa"];
const FIRST_F = ["Fatima", "Ayesha", "Sara", "Zainab", "Maryam", "Hira", "Noor", "Iqra", "Amina", "Hania", "Mahnoor", "Rida", "Emaan", "Laiba", "Areeba", "Sana", "Hafsa", "Zara", "Anaya", "Khadija"];
const LAST = ["Khan", "Ahmed", "Hussain", "Malik", "Sheikh", "Raza", "Iqbal", "Chaudhry", "Butt", "Qureshi", "Siddiqui", "Hashmi", "Javed", "Aslam", "Akram", "Nawaz", "Baig", "Mirza", "Ansari", "Gillani"];

const STAFF_ROSTER = [
  { name: "Nadia Teacher", type: "TEACHER" as const, designation: "Class teacher", salary: 45000, code: "EMP-001" },
  { name: "Imran Qureshi", type: "TEACHER" as const, designation: "English", salary: 48000, code: "EMP-002" },
  { name: "Sana Malik", type: "TEACHER" as const, designation: "Urdu", salary: 46000, code: "EMP-003" },
  { name: "Tariq Mahmood", type: "TEACHER" as const, designation: "Mathematics", salary: 52000, code: "EMP-004" },
  { name: "Rabia Aslam", type: "TEACHER" as const, designation: "Science", salary: 50000, code: "EMP-005" },
  { name: "Kamran Shah", type: "TEACHER" as const, designation: "Islamiat", salary: 44000, code: "EMP-006" },
  { name: "Hina Raza", type: "TEACHER" as const, designation: "Computer", salary: 51000, code: "EMP-007" },
  { name: "Asad Butt", type: "TEACHER" as const, designation: "Physics", salary: 56000, code: "EMP-008" },
  { name: "Mehwish Ali", type: "TEACHER" as const, designation: "Chemistry", salary: 55000, code: "EMP-009" },
  { name: "Usman Farooq", type: "TEACHER" as const, designation: "Biology", salary: 54000, code: "EMP-010" },
  { name: "Farah Siddiqui", type: "TEACHER" as const, designation: "Social Studies", salary: 45000, code: "EMP-011" },
  { name: "Naveed Akram", type: "TEACHER" as const, designation: "Pak Studies", salary: 45000, code: "EMP-012" },
  { name: "Aisha Noor", type: "TEACHER" as const, designation: "Montessori", salary: 42000, code: "EMP-013" },
  { name: "Bushra Khan", type: "TEACHER" as const, designation: "Nursery", salary: 42000, code: "EMP-014" },
  { name: "Shazia Iqbal", type: "TEACHER" as const, designation: "KG", salary: 43000, code: "EMP-015" },
  { name: "Waqas Javed", type: "TEACHER" as const, designation: "Mathematics", salary: 50000, code: "EMP-016" },
  { name: "Nimra Hassan", type: "TEACHER" as const, designation: "English", salary: 47000, code: "EMP-017" },
  { name: "Sohail Rana", type: "TEACHER" as const, designation: "Physical Education", salary: 40000, code: "EMP-018" },
  { name: "Lubna Akhtar", type: "TEACHER" as const, designation: "Art", salary: 39000, code: "EMP-019" },
  { name: "Kashif Mehmood", type: "TEACHER" as const, designation: "History", salary: 46000, code: "EMP-020" },
  { name: "Saima Yousaf", type: "TEACHER" as const, designation: "Class teacher", salary: 45000, code: "EMP-021" },
  { name: "Adnan Sheikh", type: "TEACHER" as const, designation: "Computer", salary: 50000, code: "EMP-022" },
  { name: "Iqra Naveed", type: "TEACHER" as const, designation: "Urdu", salary: 44000, code: "EMP-023" },
  { name: "Hamza Tariq", type: "TEACHER" as const, designation: "Science", salary: 49000, code: "EMP-024" },
  { name: "Zara Gillani", type: "TEACHER" as const, designation: "English", salary: 47000, code: "EMP-025" },
  { name: "Faisal Hashmi", type: "TEACHER" as const, designation: "Mathematics", salary: 51000, code: "EMP-026" },
  { name: "Huma Baig", type: "TEACHER" as const, designation: "Islamiat", salary: 43000, code: "EMP-027" },
  { name: "Rizwan Anwar", type: "TEACHER" as const, designation: "Class teacher", salary: 46000, code: "EMP-028" },
  { name: "Mariam Qadir", type: "TEACHER" as const, designation: "Biology", salary: 53000, code: "EMP-029" },
  { name: "Shahid Nawaz", type: "TEACHER" as const, designation: "Physics", salary: 55000, code: "EMP-030" },
  { name: "Amina Chaudhry", type: "TEACHER" as const, designation: "Chemistry", salary: 54000, code: "EMP-031" },
  { name: "Owais Rauf", type: "TEACHER" as const, designation: "Class teacher", salary: 45000, code: "EMP-032" },
  { name: "Sadia Parveen", type: "TEACHER" as const, designation: "KG", salary: 41000, code: "EMP-033" },
  { name: "Junaid Alam", type: "TEACHER" as const, designation: "Mathematics", salary: 50000, code: "EMP-034" },
  { name: "Nida Farooq", type: "TEACHER" as const, designation: "English", salary: 47000, code: "EMP-035" },
  { name: "Khalid Ansari", type: "ACCOUNTANT" as const, designation: "Accountant", salary: 60000, code: "EMP-036" },
  { name: "Rabia Office", type: "ADMIN" as const, designation: "Office assistant", salary: 35000, code: "EMP-037" },
  { name: "Principal Iftikhar", type: "ADMIN" as const, designation: "Principal", salary: 120000, code: "EMP-038" },
  { name: "Clerk Imtiaz", type: "OTHER" as const, designation: "Clerk", salary: 32000, code: "EMP-039" },
  { name: "Guard Rashid", type: "OTHER" as const, designation: "Security", salary: 28000, code: "EMP-040" },
];

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
const PERIODS = [
  ["08:00", "08:40"],
  ["08:45", "09:25"],
  ["09:30", "10:10"],
  ["10:30", "11:10"],
  ["11:15", "11:55"],
  ["12:00", "12:40"],
];

function subjectsFor(band: string) {
  if (band === "early") return ["English", "Urdu", "Maths", "Islamiat", "Activity"];
  if (band === "primary") return ["English", "Urdu", "Maths", "Science", "Islamiat", "Social Studies"];
  if (band === "middle") return ["English", "Urdu", "Maths", "Science", "Islamiat", "Computer", "History"];
  return ["English", "Urdu", "Maths", "Physics", "Chemistry", "Biology", "Islamiat", "Pak Studies", "Computer"];
}

function sectionsFor(sort: number) {
  return sort >= 3 && sort <= 10 ? ["A", "B", "C"] : ["A", "B"];
}

function utcDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260920);

function pick<T>(list: readonly T[]) {
  return list[Math.floor(rand() * list.length)]!;
}

function weekdayDates(start: Date, end: Date, take: number) {
  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end && dates.length < take) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function sampleWeekdays(start: Date, end: Date, take: number) {
  const all = weekdayDates(start, end, 280);
  if (all.length <= take) return all;
  const picked: Date[] = [];
  const used = new Set<number>();
  while (picked.length < take) {
    const index = Math.floor(rand() * all.length);
    if (used.has(index)) continue;
    used.add(index);
    picked.push(all[index]!);
  }
  return picked.sort((a, b) => a.getTime() - b.getTime());
}

function attendanceStatus(n: number): AttendanceStatus {
  if (n < 0.85) return "PRESENT";
  if (n < 0.93) return "LATE";
  if (n < 0.98) return "ABSENT";
  return "EXCUSED";
}

function invoiceStatus(n: number): { status: FeeInvoiceStatus; paidRatio: number } {
  if (n < 0.78) return { status: "PAID", paidRatio: 1 };
  if (n < 0.9) return { status: "PARTIAL", paidRatio: 0.5 };
  return { status: "OVERDUE", paidRatio: 0 };
}

async function batchCreate<T extends object>(label: string, rows: T[], createMany: (chunk: T[]) => Promise<unknown>) {
  const size = 1000;
  for (let i = 0; i < rows.length; i += size) {
    await createMany(rows.slice(i, i + size));
    if ((i / size) % 10 === 0) console.log(`  ${label} ${Math.min(i + size, rows.length)}/${rows.length}`);
  }
}

export async function seedGreenwoodHistory() {
  const greenwood = await prisma.tenant.findUnique({ where: { slug: "greenwood" } });
  if (!greenwood) throw new Error("Greenwood tenant missing. Run prisma/seed.ts first.");

  await prisma.plan.update({
    where: { id: "plan_standard" },
    data: { maxStudents: 2500 },
  });

  console.log("Seeding academic structure…");
  const yearRows = [];
  for (const year of YEARS) {
    const row = await prisma.academicYear.upsert({
      where: { schoolId_name: { schoolId: greenwood.id, name: year.name } },
      update: { isCurrent: year.current, startDate: utcDate(year.start), endDate: utcDate(year.end) },
      create: {
        schoolId: greenwood.id,
        name: year.name,
        startDate: utcDate(year.start),
        endDate: utcDate(year.end),
        isCurrent: year.current,
      },
    });
    yearRows.push(row);
  }
  const currentYear = yearRows.find((row) => row.isCurrent)!;

  type ClassRow = { id: string; name: string; academicYearId: string; sortOrder: number };
  type SectionRow = { id: string; name: string; classId: string };
  const classes: ClassRow[] = [];
  const sections: SectionRow[] = [];
  const subjects: { id: string; name: string; classId: string | null }[] = [];

  for (const year of yearRows) {
    for (const klass of LADDER) {
      const created = await prisma.class.upsert({
        where: {
          schoolId_academicYearId_name: { schoolId: greenwood.id, academicYearId: year.id, name: klass.name },
        },
        update: { sortOrder: klass.sort },
        create: {
          schoolId: greenwood.id,
          academicYearId: year.id,
          name: klass.name,
          sortOrder: klass.sort,
        },
      });
      classes.push(created);
      for (const sectionName of sectionsFor(klass.sort)) {
        const section = await prisma.section.upsert({
          where: { schoolId_classId_name: { schoolId: greenwood.id, classId: created.id, name: sectionName } },
          update: {},
          create: { schoolId: greenwood.id, classId: created.id, name: sectionName },
        });
        sections.push(section);
      }
      const existingSubjects = await prisma.subject.findMany({
        where: { schoolId: greenwood.id, classId: created.id },
        select: { id: true, name: true, classId: true },
      });
      if (existingSubjects.length === 0) {
        await prisma.subject.createMany({
          data: subjectsFor(klass.band).map((name) => ({
            schoolId: greenwood.id,
            classId: created.id,
            name,
            code: name.slice(0, 3).toUpperCase(),
          })),
        });
      }
      subjects.push(
        ...(await prisma.subject.findMany({
          where: { schoolId: greenwood.id, classId: created.id },
          select: { id: true, name: true, classId: true },
        })),
      );
      await prisma.feeStructure.upsert({
        where: { id: `fs_${year.name}_${klass.sort}` },
        update: { amountPaisa: pkrToPaisa(klass.fee) },
        create: {
          id: `fs_${year.name}_${klass.sort}`,
          schoolId: greenwood.id,
          academicYearId: year.id,
          classId: created.id,
          name: `Monthly tuition ${klass.name}`,
          amountPaisa: pkrToPaisa(klass.fee),
          frequency: "MONTHLY",
        },
      });
    }
  }

  console.log("Seeding staff…");
  const staff = [];
  for (const member of STAFF_ROSTER) {
    const row = await prisma.staff.upsert({
      where: { schoolId_employeeCode: { schoolId: greenwood.id, employeeCode: member.code } },
      update: {
        name: member.name,
        type: member.type,
        designation: member.designation,
        salaryPaisa: pkrToPaisa(member.salary),
        joiningDate: utcDate("2021-08-01"),
      },
      create: {
        schoolId: greenwood.id,
        employeeCode: member.code,
        name: member.name,
        type: member.type,
        designation: member.designation,
        phone: `0301${member.code.replace(/\D/g, "").padStart(7, "0")}`,
        salaryPaisa: pkrToPaisa(member.salary),
        joiningDate: utcDate("2021-08-01"),
      },
    });
    staff.push(row);
  }

  const currentClasses = classes.filter((klass) => klass.academicYearId === currentYear.id);
  const currentSections = sections.filter((section) => currentClasses.some((klass) => klass.id === section.classId));
  const seats: { classId: string; sectionId: string; sort: number; yearId: string }[] = [];
  for (const klass of LADDER) {
    const currentClass = currentClasses.find((row) => row.name === klass.name)!;
    const classSections = currentSections.filter((section) => section.classId === currentClass.id);
    for (let i = 0; i < klass.quota; i += 1) {
      const section = classSections[i % classSections.length]!;
      seats.push({ classId: currentClass.id, sectionId: section.id, sort: klass.sort, yearId: currentYear.id });
    }
  }

  const existingStudents = await prisma.student.findMany({
    where: { schoolId: greenwood.id, deletedAt: null },
    select: { id: true, admissionNo: true, classId: true, sectionId: true, guardianId: true },
  });
  const needed = Math.max(0, TARGET_STUDENTS - existingStudents.length);
  console.log(`Students now ${existingStudents.length}; creating ${needed} more…`);

  const unassigned = existingStudents.filter((row) => !row.classId);
  for (const [index, student] of unassigned.entries()) {
    const seat = seats[index];
    if (!seat) break;
    await prisma.student.update({
      where: { id: student.id },
      data: { academicYearId: seat.yearId, classId: seat.classId, sectionId: seat.sectionId, status: "ACTIVE" },
    });
  }

  const usedSeats = existingStudents.filter((row) => row.classId).length + unassigned.length;
  const nextNumbers = existingStudents
    .map((row) => Number(row.admissionNo.replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n));
  let admissionSeq = Math.max(0, ...nextNumbers, 0);

  if (needed > 0) {
    const guardianData = [];
    for (let i = 0; i < needed; i += 1) {
      if (i > 0 && i % 4 === 0) continue;
      const last = pick(LAST);
      guardianData.push({
        schoolId: greenwood.id,
        name: `${pick(FIRST_M)} ${last}`,
        relation: rand() < 0.15 ? "mother" : "father",
        phone: `0302${String(2000000 + i).padStart(7, "0")}`,
        address: `${100 + (i % 80)} Canal Road, Lahore`,
      });
    }
    await batchCreate("guardians", guardianData, (chunk) => prisma.guardian.createMany({ data: chunk }));
    const guardians = await prisma.guardian.findMany({
      where: { schoolId: greenwood.id, phone: { startsWith: "0302" } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const studentData = [];
    let guardianCursor = 0;
    for (let i = 0; i < needed; i += 1) {
      admissionSeq += 1;
      const seat = seats[usedSeats + i] ?? seats[(usedSeats + i) % seats.length]!;
      const female = rand() < 0.48;
      const first = female ? pick(FIRST_F) : pick(FIRST_M);
      const last = pick(LAST);
      const age = 3 + seat.sort;
      const guardianId = i > 0 && i % 4 === 0 ? guardians[guardianCursor - 1]?.id : guardians[guardianCursor++]?.id;
      studentData.push({
        schoolId: greenwood.id,
        admissionNo: `GW-${String(admissionSeq).padStart(4, "0")}`,
        name: `${first} ${last}`,
        gender: female ? ("FEMALE" as const) : ("MALE" as const),
        dateOfBirth: utcDate(`${2026 - age}-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`),
        academicYearId: seat.yearId,
        classId: seat.classId,
        sectionId: seat.sectionId,
        guardianId: guardianId ?? null,
        admissionDate: utcDate(`${Math.max(2022, 2026 - seat.sort)}-04-${String(1 + (i % 27)).padStart(2, "0")}`),
        status: "ACTIVE" as const,
      });
    }
    await batchCreate("students", studentData, (chunk) => prisma.student.createMany({ data: chunk, skipDuplicates: true }));
  }

  const students = await prisma.student.findMany({
    where: { schoolId: greenwood.id, deletedAt: null, status: "ACTIVE" },
    select: { id: true, admissionNo: true, classId: true, sectionId: true, name: true },
  });
  console.log(`Active students: ${students.length}`);

  const marker = await prisma.announcement.findFirst({ where: { schoolId: greenwood.id, title: MARKER } });
  if (marker) {
    console.log("History already marked; skipping generated history rows.");
    return { students: students.length };
  }

  const classById = new Map(classes.map((klass) => [klass.id, klass]));
  const yearIndex = new Map(yearRows.map((year, index) => [year.id, index]));
  const classByYearAndSort = new Map(
    classes.map((klass) => [`${klass.academicYearId}:${klass.sortOrder}`, klass] as const),
  );
  const sectionByClass = new Map<string, SectionRow[]>();
  for (const section of sections) {
    const list = sectionByClass.get(section.classId) ?? [];
    list.push(section);
    sectionByClass.set(section.classId, list);
  }
  const subjectsByClass = new Map<string, typeof subjects>();
  for (const subject of subjects) {
    if (!subject.classId) continue;
    const list = subjectsByClass.get(subject.classId) ?? [];
    list.push(subject);
    subjectsByClass.set(subject.classId, list);
  }
  const feeByClass = await prisma.feeStructure.findMany({
    where: { schoolId: greenwood.id, id: { startsWith: "fs_" } },
  });
  const feeByClassId = new Map(feeByClass.map((row) => [row.classId ?? "", row]));

  console.log("Seeding attendance…");
  const attendance = [];
  for (const student of students) {
    const currentClass = student.classId ? classById.get(student.classId) : undefined;
    if (!currentClass || !student.sectionId) continue;
    const currentIdx = yearIndex.get(currentClass.academicYearId) ?? YEARS.length - 1;
    for (const [yIndex, year] of yearRows.entries()) {
      const pastSort = currentClass.sortOrder - (currentIdx - yIndex);
      if (pastSort < 0) continue;
      const pastClass = classByYearAndSort.get(`${year.id}:${pastSort}`);
      if (!pastClass) continue;
      const pastSection = (sectionByClass.get(pastClass.id) ?? [])[0];
      if (!pastSection) continue;
      const take = year.isCurrent ? 28 : 10;
      const dates = year.isCurrent
        ? weekdayDates(utcDate(YEARS[yIndex]!.start), utcDate("2026-09-20"), take)
        : sampleWeekdays(year.startDate, year.endDate, take);
      for (const date of dates) {
        attendance.push({
          schoolId: greenwood.id,
          studentId: student.id,
          sectionId: pastSection.id,
          date,
          status: attendanceStatus(rand()),
        });
      }
    }
  }
  await batchCreate("attendance", attendance, (chunk) =>
    prisma.attendanceRecord.createMany({ data: chunk, skipDuplicates: true }),
  );

  console.log("Seeding fees…");
  const invoices = [];
  const payments = [];
  let invoiceSeq = 1;
  for (const student of students) {
    const currentClass = student.classId ? classById.get(student.classId) : undefined;
    if (!currentClass) continue;
    const currentIdx = yearIndex.get(currentClass.academicYearId) ?? YEARS.length - 1;
    for (const [yIndex, year] of yearRows.entries()) {
      const pastSort = currentClass.sortOrder - (currentIdx - yIndex);
      if (pastSort < 0) continue;
      const pastClass = classByYearAndSort.get(`${year.id}:${pastSort}`);
      if (!pastClass) continue;
      const structure = feeByClassId.get(pastClass.id);
      if (!structure) continue;
      const months = year.isCurrent
        ? [{ y: 2026, m: 8 }, { y: 2026, m: 9 }]
        : [8, 9, 10, 11, 12, 1, 2, 3, 4, 5].map((m, idx) => ({
            y: m >= 8 ? Number(year.name.slice(0, 4)) : Number(year.name.slice(0, 4)) + 1,
            m,
            idx,
          }));
      for (const month of months) {
        const roll = rand();
        const { status, paidRatio } = invoiceStatus(roll);
        const periodLabel = `${month.y}-${String(month.m).padStart(2, "0")}`;
        const invoiceNo = `INV-SEED-${periodLabel}-${student.admissionNo}`;
        const dueDate = utcDate(`${month.y}-${String(month.m).padStart(2, "0")}-10`);
        const paidPaisa = Math.round(structure.amountPaisa * paidRatio);
        invoices.push({
          schoolId: greenwood.id,
          studentId: student.id,
          feeStructureId: structure.id,
          invoiceNo,
          periodLabel,
          amountPaisa: structure.amountPaisa,
          paidPaisa,
          dueDate,
          status,
        });
        if (paidPaisa > 0) {
          payments.push({
            schoolId: greenwood.id,
            invoiceId: invoiceNo,
            amountPaisa: paidPaisa,
            status: "PAID" as const,
            method: roll < 0.4 ? "CASH" : roll < 0.7 ? "JAZZCASH" : "EASYPAISA",
            receiptNo: `RCPT-SEED-${invoiceNo}`,
            paidAt: utcDate(`${month.y}-${String(month.m).padStart(2, "0")}-${String(8 + (invoiceSeq % 12)).padStart(2, "0")}`),
          });
        }
        invoiceSeq += 1;
      }
    }
  }
  await batchCreate("invoices", invoices, (chunk) => prisma.feeInvoice.createMany({ data: chunk, skipDuplicates: true }));
  const savedInvoices = await prisma.feeInvoice.findMany({
    where: { schoolId: greenwood.id, invoiceNo: { startsWith: "INV-SEED-" } },
    select: { id: true, invoiceNo: true },
  });
  const invoiceIdByNo = new Map(savedInvoices.map((row) => [row.invoiceNo, row.id]));
  const paymentRows = payments
    .map((row) => {
      const invoiceId = invoiceIdByNo.get(row.invoiceId);
      if (!invoiceId) return null;
      return { ...row, invoiceId };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  await batchCreate("payments", paymentRows, (chunk) =>
    prisma.schoolFeePayment.createMany({ data: chunk, skipDuplicates: true }),
  );

  console.log("Seeding exams and results…");
  const examDefs = [
    { suffix: "First Term", type: "MIDTERM" as const, month: 12, day: 1 },
    { suffix: "Final Term", type: "FINAL" as const, month: 5, day: 10 },
  ];
  for (const year of yearRows) {
    const startYear = Number(year.name.slice(0, 4));
    for (const klass of classes.filter((row) => row.academicYearId === year.id)) {
      for (const def of examDefs) {
        const examYear = def.month >= 8 ? startYear : startYear + 1;
        if (year.isCurrent) continue;
        const name = `${klass.name} ${def.suffix} ${year.name}`;
        const existing = await prisma.exam.findFirst({ where: { schoolId: greenwood.id, name } });
        const exam =
          existing ??
          (await prisma.exam.create({
            data: {
              schoolId: greenwood.id,
              academicYearId: year.id,
              classId: klass.id,
              name,
              type: def.type,
              startDate: utcDate(`${examYear}-${String(def.month).padStart(2, "0")}-${String(def.day).padStart(2, "0")}`),
              endDate: utcDate(`${examYear}-${String(def.month).padStart(2, "0")}-${String(def.day + 10).padStart(2, "0")}`),
            },
          }));
        const classSubjects = subjectsByClass.get(klass.id) ?? [];
        const yearIdx = yearIndex.get(year.id) ?? 0;
        const cohort = students.filter((student) => {
          const currentClass = student.classId ? classById.get(student.classId) : undefined;
          if (!currentClass) return false;
          const currentIdx = yearIndex.get(currentClass.academicYearId) ?? YEARS.length - 1;
          return currentClass.sortOrder - (currentIdx - yearIdx) === klass.sortOrder;
        });
        const results = [];
        for (const student of cohort) {
          for (const subject of classSubjects) {
            const obtained = Math.round(48 + rand() * 50);
            const graded = gradeExam(obtained, 100);
            results.push({
              schoolId: greenwood.id,
              examId: exam.id,
              studentId: student.id,
              subjectId: subject.id,
              marksObtained: obtained,
              marksTotal: 100,
              grade: graded.grade,
            });
          }
        }
        await batchCreate(`results ${exam.name}`, results, (chunk) =>
          prisma.examResult.createMany({ data: chunk, skipDuplicates: true }),
        );
      }
    }
  }

  for (const klass of currentClasses) {
    const name = `${klass.name} September Review ${currentYear.name}`;
    const existing = await prisma.exam.findFirst({ where: { schoolId: greenwood.id, name } });
    const exam =
      existing ??
      (await prisma.exam.create({
        data: {
          schoolId: greenwood.id,
          academicYearId: currentYear.id,
          classId: klass.id,
          name,
          type: "QUIZ",
          startDate: utcDate("2026-09-08"),
          endDate: utcDate("2026-09-12"),
        },
      }));
    const classSubjects = (subjectsByClass.get(klass.id) ?? []).slice(0, 4);
    const cohort = students.filter((student) => student.classId === klass.id);
    const results = [];
    for (const student of cohort) {
      for (const subject of classSubjects) {
        const obtained = Math.round(52 + rand() * 46);
        const graded = gradeExam(obtained, 100);
        results.push({
          schoolId: greenwood.id,
          examId: exam.id,
          studentId: student.id,
          subjectId: subject.id,
          marksObtained: obtained,
          marksTotal: 100,
          grade: graded.grade,
        });
      }
    }
    await batchCreate(`results ${exam.name}`, results, (chunk) =>
      prisma.examResult.createMany({ data: chunk, skipDuplicates: true }),
    );
  }

  console.log("Seeding payroll…");
  const payroll = [];
  for (const member of staff) {
    if (!member.salaryPaisa) continue;
    for (const year of yearRows) {
      const startYear = Number(year.name.slice(0, 4));
      const months = year.isCurrent ? [8, 9] : [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
      for (const month of months) {
        const y = month >= 8 ? startYear : startYear + 1;
        const periodLabel = `${y}-${String(month).padStart(2, "0")}`;
        const pending = year.isCurrent && month === 9;
        payroll.push({
          schoolId: greenwood.id,
          staffId: member.id,
          periodLabel,
          amountPaisa: member.salaryPaisa,
          status: pending ? ("PENDING" as const) : ("PAID" as const),
          method: pending ? null : rand() < 0.6 ? "BANK" : "CASH",
          paidAt: pending ? null : utcDate(`${y}-${String(month).padStart(2, "0")}-28`),
        });
      }
    }
  }
  await batchCreate("payroll", payroll, (chunk) => prisma.payrollPayment.createMany({ data: chunk, skipDuplicates: true }));

  console.log("Seeding timetable…");
  const timetable = [];
  const teachers = staff.filter((row) => row.type === "TEACHER");
  for (const section of currentSections) {
    const classSubjects = subjectsByClass.get(section.classId) ?? [];
    if (classSubjects.length === 0) continue;
    for (const [dayIndex, day] of DAYS.entries()) {
      for (const [periodIndex, [startTime, endTime]] of PERIODS.entries()) {
        const subject = classSubjects[(dayIndex + periodIndex) % classSubjects.length]!;
        const teacher = teachers[(dayIndex + periodIndex + section.name.charCodeAt(0)) % teachers.length]!;
        timetable.push({
          schoolId: greenwood.id,
          sectionId: section.id,
          subjectId: subject.id,
          staffId: teacher.id,
          dayOfWeek: day,
          startTime,
          endTime,
          room: `${section.name}${periodIndex + 1}`,
        });
      }
    }
  }
  await batchCreate("timetable", timetable, (chunk) => prisma.timetable.createMany({ data: chunk, skipDuplicates: true }));

  console.log("Seeding certificates, announcements, social posts, billing…");
  const matric = currentClasses.find((klass) => klass.name === "Class 10");
  const matricStudents = students.filter((row) => row.classId === matric?.id).slice(0, 40);
  if (matricStudents.length) {
    await prisma.certificate.createMany({
      data: matricStudents.map((student, index) => ({
        schoolId: greenwood.id,
        studentId: student.id,
        type: index % 3 === 0 ? "LEAVING" : index % 3 === 1 ? "CHARACTER" : "BONAFIDE",
        issuedAt: utcDate("2026-05-20"),
      })),
      skipDuplicates: true,
    });
  }

  await prisma.announcement.createMany({
    data: [
      { schoolId: greenwood.id, title: MARKER, body: "Internal marker for the five-year Greenwood demo dataset.", audience: "STAFF", publishedAt: new Date() },
      { schoolId: greenwood.id, title: "New academic year 2026-2027", body: "Classes begin 1 August. Fee challans are due on the 10th.", audience: "ALL", publishedAt: utcDate("2026-07-20") },
      { schoolId: greenwood.id, title: "Parent-teacher meeting", body: "PTM this Saturday after assembly.", audience: "PARENTS", publishedAt: utcDate("2026-09-10") },
      { schoolId: greenwood.id, title: "Sports week", body: "Annual sports week starts next Monday.", audience: "STUDENTS", publishedAt: utcDate("2026-09-01") },
      { schoolId: greenwood.id, title: "Staff meeting", body: "Monday briefing at 7:40am in the staff room.", audience: "STAFF", publishedAt: utcDate("2026-09-14") },
    ],
    skipDuplicates: true,
  });

  await prisma.socialPost.createMany({
    data: [
      {
        schoolId: greenwood.id,
        title: "Admissions open",
        caption: "Admissions open for Montessori to Matric. Limited seats in morning sections.",
        captionUrdu: "مونٹیسری تا میٹرک داخلے جاری ہیں۔",
        hashtags: "#Greenwood #Admissions",
        platforms: ["FACEBOOK", "INSTAGRAM", "WHATSAPP"],
        status: "PUBLISHED",
        publishedAt: utcDate("2026-07-15"),
      },
      {
        schoolId: greenwood.id,
        title: "Sports week",
        caption: "Greenwood Sports Week photos — congratulations to the winning houses.",
        hashtags: "#Greenwood #SportsWeek",
        platforms: ["FACEBOOK", "INSTAGRAM"],
        status: "DRAFT",
      },
    ],
    skipDuplicates: true,
  });

  const plan = await prisma.plan.findUnique({ where: { id: "plan_standard" } });
  if (plan) {
    const subs = [];
    for (let year = 2022; year <= 2026; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        if (year === 2026 && month > 9) continue;
        const start = utcDate(`${year}-${String(month).padStart(2, "0")}-01`);
        const end = utcDate(`${year}-${String(month).padStart(2, "0")}-28`);
        subs.push({
          tenantId: greenwood.id,
          planId: plan.id,
          periodStart: start,
          periodEnd: end,
          amountPaisa: plan.priceMonthlyPaisa,
          status: year === 2026 && month === 9 ? ("PENDING" as const) : ("PAID" as const),
          paymentMethod: "BANK",
          paidAt: year === 2026 && month === 9 ? null : utcDate(`${year}-${String(month).padStart(2, "0")}-05`),
          dueDate: utcDate(`${year}-${String(month).padStart(2, "0")}-07`),
        });
      }
    }
    await prisma.platformSubscriptionPayment.createMany({ data: subs, skipDuplicates: true });
  }

  return { students: students.length };
}

const isDirect = process.argv[1]?.includes("seed-history");
if (isDirect) {
  seedGreenwoodHistory()
    .then((result) => {
      console.log("History seed complete.", result);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
