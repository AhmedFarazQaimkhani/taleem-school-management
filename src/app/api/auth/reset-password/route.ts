import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound } from "@/lib/api";
import { consumeResetToken } from "@/lib/password-reset";
import { handleRouteError, jsonOk } from "@/lib/route";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = resetPasswordSchema.parse(await request.json());
    const row = await consumeResetToken(body.token);
    if (!row) throw notFound("This reset link is invalid or has expired");

    const passwordHash = await bcrypt.hash(body.password, 12);

    if (row.schoolId) {
      const user = await prisma.user.findFirst({
        where: { email: row.email, schoolId: row.schoolId, status: "ACTIVE" },
      });
      if (!user) throw badRequest("This account can no longer be reset");
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    } else {
      const superAdmin = await prisma.superAdminUser.findUnique({ where: { email: row.email } });
      if (!superAdmin) throw badRequest("This account can no longer be reset");
      await prisma.superAdminUser.update({
        where: { id: superAdmin.id },
        data: { passwordHash },
      });
    }

    await prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });

    return jsonOk({ reset: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
