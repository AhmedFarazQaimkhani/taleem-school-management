import { getNotificationService } from "@/lib/services/notification";
import { findResetAccount, issueResetToken } from "@/lib/password-reset";
import { handleRouteError, jsonOk } from "@/lib/route";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = forgotPasswordSchema.parse(await request.json());
    const slug = body.slug || null;
    const account = await findResetAccount(body.email, slug);

    if (!account) {
      return jsonOk({ sent: true });
    }

    const token = await issueResetToken(account.email, account.schoolId);
    const incoming = new URL(request.url);
    const host = request.headers.get("host") ?? incoming.host;
    const protocol = request.headers.get("x-forwarded-proto") ?? incoming.protocol.replace(":", "");
    const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

    const result = await getNotificationService().send({
      schoolId: account.schoolId ?? "platform",
      to: account.email,
      channel: "EMAIL",
      body: `Reset your Taleem password: ${resetUrl}`,
      metadata: { type: "password_reset" },
    });

    return jsonOk({
      sent: true,
      resetUrl: result.provider === "console" ? resetUrl : undefined,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
