import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_TTL_MS = 60 * 60 * 1000;

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createResetTokenValue() {
  return randomBytes(32).toString("hex");
}

export async function findResetAccount(email: string, slug?: string | null) {
  const superAdmin = await prisma.superAdminUser.findUnique({ where: { email } });
  if (superAdmin) {
    return { kind: "super" as const, email, schoolId: null as string | null };
  }

  if (slug) {
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") return null;
    const user = await prisma.user.findFirst({
      where: { email, schoolId: tenant.id, status: "ACTIVE" },
    });
    if (!user) return null;
    return { kind: "school" as const, email, schoolId: user.schoolId };
  }

  const matches = await prisma.user.findMany({
    where: { email, status: "ACTIVE" },
    include: { school: true },
  });
  const usable = matches.filter(
    (row) => row.school.status !== "SUSPENDED" && row.school.status !== "CANCELLED",
  );
  if (usable.length !== 1) return null;
  return { kind: "school" as const, email, schoolId: usable[0]!.schoolId };
}

export async function issueResetToken(email: string, schoolId: string | null) {
  const token = createResetTokenValue();
  const tokenHash = hashResetToken(token);
  await prisma.passwordResetToken.updateMany({
    where: { email, schoolId, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.passwordResetToken.create({
    data: {
      email,
      schoolId,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  return token;
}

export async function consumeResetToken(token: string) {
  const tokenHash = hashResetToken(token);
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row;
}
