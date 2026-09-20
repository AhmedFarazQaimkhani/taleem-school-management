import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { notFound } from "@/lib/api";
import { serializeSocialPost } from "@/lib/social-posts";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const existing = await db.socialPost.findFirst({ where: { id: params.id } });
    if (!existing) throw notFound("Social post not found");
    const post = await db.socialPost.update({
      where: { id: existing.id },
      data: { status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date() },
    });
    return jsonOk({ post: serializeSocialPost(post) });
  } catch (error) {
    return handleRouteError(error);
  }
}
