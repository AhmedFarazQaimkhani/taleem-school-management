import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { pkrToPaisa } from "../src/lib/money";
import { seedGreenwoodHistory } from "./seed-history";

const prisma = new PrismaClient();

async function main() {
  const starterFlags = {
    payroll: false,
    certificates: false,
    timetable: false,
    parentPortal: false,
    studentPortal: false,
    smsBroadcast: false,
    whatsappAlerts: true,
    exams: false,
  };
  const standardFlags = {
    payroll: true,
    certificates: true,
    timetable: true,
    parentPortal: true,
    studentPortal: true,
    smsBroadcast: true,
    whatsappAlerts: true,
    exams: true,
  };

  const starter = await prisma.plan.upsert({
    where: { id: "plan_starter" },
    update: { featureFlags: starterFlags, priceMonthlyPaisa: pkrToPaisa(4999), maxStudents: 200 },
    create: {
      id: "plan_starter",
      name: "Starter",
      priceMonthlyPaisa: pkrToPaisa(4999),
      maxStudents: 200,
      featureFlags: starterFlags,
    },
  });

  const standard = await prisma.plan.upsert({
    where: { id: "plan_standard" },
    update: { featureFlags: standardFlags, priceMonthlyPaisa: pkrToPaisa(9999), maxStudents: 2500 },
    create: {
      id: "plan_standard",
      name: "Standard",
      priceMonthlyPaisa: pkrToPaisa(9999),
      maxStudents: 2500,
      featureFlags: standardFlags,
    },
  });

  const superHash = await bcrypt.hash("SuperAdmin!123", 12);
  await prisma.superAdminUser.upsert({
    where: { email: "platform@taleem.local" },
    update: { passwordHash: superHash },
    create: {
      email: "platform@taleem.local",
      passwordHash: superHash,
      name: "Platform Owner",
    },
  });

  const adminHash = await bcrypt.hash("Admin!123", 12);

  const greenwood = await prisma.tenant.upsert({
    where: { slug: "greenwood" },
    update: {
      headerText: "Greenwood High School · Excellence in Education",
      footerText: "Authorized by the Principal · For verification contact the school office",
    },
    create: {
      name: "Greenwood High School",
      slug: "greenwood",
      status: "ACTIVE",
      planId: standard.id,
      headerText: "Greenwood High School · Excellence in Education",
      footerText: "Authorized by the Principal · For verification contact the school office",
    },
  });

  const citymodel = await prisma.tenant.upsert({
    where: { slug: "citymodel" },
    update: {
      headerText: "City Model School",
      footerText: "City Model School · Office copy",
    },
    create: {
      name: "City Model School",
      slug: "citymodel",
      status: "ACTIVE",
      planId: starter.id,
      headerText: "City Model School",
      footerText: "City Model School · Office copy",
    },
  });

  await prisma.user.upsert({
    where: { schoolId_email: { schoolId: greenwood.id, email: "admin@greenwood.local" } },
    update: { passwordHash: adminHash },
    create: {
      schoolId: greenwood.id,
      email: "admin@greenwood.local",
      passwordHash: adminHash,
      role: "ADMIN",
      name: "Greenwood Admin",
    },
  });

  await prisma.user.upsert({
    where: { schoolId_email: { schoolId: citymodel.id, email: "admin@citymodel.local" } },
    update: { passwordHash: adminHash },
    create: {
      schoolId: citymodel.id,
      email: "admin@citymodel.local",
      passwordHash: adminHash,
      role: "ADMIN",
      name: "City Model Admin",
    },
  });

  await prisma.student.upsert({
    where: { schoolId_admissionNo: { schoolId: greenwood.id, admissionNo: "GW-0001" } },
    update: {},
    create: {
      schoolId: greenwood.id,
      admissionNo: "GW-0001",
      name: "Ali Khan",
      gender: "MALE",
    },
  });

  await prisma.student.upsert({
    where: { schoolId_admissionNo: { schoolId: citymodel.id, admissionNo: "CM-0001" } },
    update: {},
    create: {
      schoolId: citymodel.id,
      admissionNo: "CM-0001",
      name: "Fatima Bibi",
      gender: "FEMALE",
    },
  });

  const teacherHash = await bcrypt.hash("Teacher!123", 12);
  const teacherUser = await prisma.user.upsert({
    where: { schoolId_email: { schoolId: greenwood.id, email: "teacher@greenwood.local" } },
    update: { passwordHash: teacherHash },
    create: {
      schoolId: greenwood.id,
      email: "teacher@greenwood.local",
      passwordHash: teacherHash,
      role: "TEACHER",
      name: "Nadia Teacher",
    },
  });
  await prisma.staff.upsert({
    where: { schoolId_employeeCode: { schoolId: greenwood.id, employeeCode: "EMP-001" } },
    update: { userId: teacherUser.id, salaryPaisa: pkrToPaisa(45000) },
    create: {
      schoolId: greenwood.id,
      userId: teacherUser.id,
      employeeCode: "EMP-001",
      name: "Nadia Teacher",
      type: "TEACHER",
      designation: "Class teacher",
      phone: "03001112233",
      salaryPaisa: pkrToPaisa(45000),
    },
  });

  const parentHash = await bcrypt.hash("Parent!123", 12);
  const parentUser = await prisma.user.upsert({
    where: { schoolId_email: { schoolId: greenwood.id, email: "parent@greenwood.local" } },
    update: { passwordHash: parentHash },
    create: {
      schoolId: greenwood.id,
      email: "parent@greenwood.local",
      passwordHash: parentHash,
      role: "PARENT",
      name: "Ahmed Ali",
      phone: "03001234567",
    },
  });
  const sara = await prisma.student.findFirst({
    where: { schoolId: greenwood.id, admissionNo: "GW-0002" },
  });
  if (sara) {
    const guardian =
      (await prisma.guardian.findFirst({ where: { schoolId: greenwood.id, phone: "03001234567" } })) ??
      (await prisma.guardian.create({
        data: {
          schoolId: greenwood.id,
          userId: parentUser.id,
          name: "Ahmed Ali",
          phone: "03001234567",
          relation: "father",
        },
      }));
    await prisma.guardian.update({ where: { id: guardian.id }, data: { userId: parentUser.id } });
    await prisma.student.update({ where: { id: sara.id }, data: { guardianId: guardian.id } });

    const studentHash = await bcrypt.hash("Student!123", 12);
    const studentUser = await prisma.user.upsert({
      where: { schoolId_email: { schoolId: greenwood.id, email: "sara@greenwood.local" } },
      update: { passwordHash: studentHash },
      create: {
        schoolId: greenwood.id,
        email: "sara@greenwood.local",
        passwordHash: studentHash,
        role: "STUDENT",
        name: "Sara Ahmed",
      },
    });
    await prisma.student.update({ where: { id: sara.id }, data: { userId: studentUser.id } });
  }

  const history = await seedGreenwoodHistory();
  console.log("Seed complete.", history);
  console.log("Super Admin:  platform@taleem.local / SuperAdmin!123");
  console.log("Greenwood:    admin@greenwood.local / Admin!123");
  console.log("Teacher:      teacher@greenwood.local / Teacher!123");
  console.log("Parent:       parent@greenwood.local / Parent!123");
  console.log("Student:      sara@greenwood.local / Student!123");
  console.log("City Model:   admin@citymodel.local / Admin!123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
