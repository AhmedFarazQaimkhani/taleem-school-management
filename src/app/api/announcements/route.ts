import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { announcementSchema } from "@/lib/validations/phase2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db, session } = await requireTenantUser();
    const role = session.user.role;
    const audience =
      role === "PARENT" ? ["ALL", "PARENTS"] : role === "STUDENT" ? ["ALL", "STUDENTS"] : ["ALL", "STAFF", "PARENTS", "STUDENTS"];
    const announcements = await db.announcement.findMany({
      where: { audience: { in: audience } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonOk({ announcements });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId, session } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const body = announcementSchema.parse(await request.json());
    const announcement = await db.announcement.create({
      data: {
        schoolId,
        title: body.title,
        body: body.body,
        audience: body.audience,
        publishedAt: new Date(),
        createdById: session.user.id,
      },
    });
    return jsonOk({ announcement }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
