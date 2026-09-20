import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { badRequest, notFound } from "@/lib/api";
import { socialPostUpdateSchema } from "@/lib/validations/phase2";
import { blankToNull, parseSchedule, serializeSocialPost } from "@/lib/social-posts";
import { getFileStorage } from "@/lib/services/storage";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const existing = await db.socialPost.findFirst({ where: { id: params.id } });
    if (!existing) throw notFound("Social post not found");
    const body = socialPostUpdateSchema.parse(await request.json());
    const nextStatus = body.status ?? existing.status;
    const scheduledAt = body.scheduledAt !== undefined ? parseSchedule(body.scheduledAt) : existing.scheduledAt;
    if (nextStatus === "SCHEDULED" && !scheduledAt) {
      throw badRequest("Choose a schedule date for scheduled posts");
    }
    const post = await db.socialPost.update({
      where: { id: existing.id },
      data: {
        title: body.title ?? existing.title,
        caption: body.caption ?? existing.caption,
        captionUrdu: body.captionUrdu !== undefined ? blankToNull(body.captionUrdu) : existing.captionUrdu,
        hashtags: body.hashtags !== undefined ? blankToNull(body.hashtags) : existing.hashtags,
        linkUrl: body.linkUrl !== undefined ? blankToNull(body.linkUrl) : existing.linkUrl,
        platforms: body.platforms ?? existing.platforms,
        status: nextStatus,
        scheduledAt,
        publishedAt:
          nextStatus === "PUBLISHED" ? existing.publishedAt ?? new Date() : nextStatus === "DRAFT" ? null : existing.publishedAt,
      },
    });
    return jsonOk({ post: serializeSocialPost(post) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const existing = await db.socialPost.findFirst({ where: { id: params.id } });
    if (!existing) throw notFound("Social post not found");
    const storage = getFileStorage();
    await Promise.all(existing.imageKeys.map((key) => storage.remove(schoolId, key)));
    await db.socialPost.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
