import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createTenantClient, CrossTenantError } from "../src/lib/prisma-tenant";

const prisma = new PrismaClient();

describe("tenant isolation", () => {
  let schoolA: string;
  let schoolB: string;
  let studentAId: string;
  let studentBId: string;

  beforeAll(async () => {
    const a = await prisma.tenant.findUnique({ where: { slug: "greenwood" } });
    const b = await prisma.tenant.findUnique({ where: { slug: "citymodel" } });
    if (!a || !b) {
      throw new Error("Seed two tenants before running isolation tests (npm run db:seed)");
    }
    schoolA = a.id;
    schoolB = b.id;
    const studentA = await prisma.student.findFirst({ where: { schoolId: schoolA } });
    const studentB = await prisma.student.findFirst({ where: { schoolId: schoolB } });
    if (!studentA || !studentB) {
      throw new Error("Seed one student per tenant before running isolation tests");
    }
    studentAId = studentA.id;
    studentBId = studentB.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("scoped client for Tenant A never returns Tenant B students", async () => {
    const dbA = createTenantClient(schoolA);
    const rows = await dbA.student.findMany();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.schoolId === schoolA)).toBe(true);
    expect(rows.some((row) => row.id === studentBId)).toBe(false);
  });

  it("findUnique by Tenant B id through Tenant A client returns null", async () => {
    const dbA = createTenantClient(schoolA);
    const leaked = await dbA.student.findUnique({ where: { id: studentBId } });
    expect(leaked).toBeNull();
  });

  it("creating with another tenant's schoolId is rejected", async () => {
    const dbA = createTenantClient(schoolA);
    await expect(
      dbA.student.create({
        data: {
          schoolId: schoolB,
          admissionNo: "LEAK-999",
          name: "Should Not Exist",
          gender: "MALE",
        },
      }),
    ).rejects.toBeInstanceOf(CrossTenantError);
  });

  it("unscoped platform client can still see both tenants", async () => {
    const tenants = await prisma.tenant.findMany({ where: { slug: { in: ["greenwood", "citymodel"] } } });
    expect(tenants).toHaveLength(2);
    const all = await prisma.student.findMany({
      where: { id: { in: [studentAId, studentBId] } },
    });
    expect(all).toHaveLength(2);
  });
});
