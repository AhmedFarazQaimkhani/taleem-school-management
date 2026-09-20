import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { badRequest } from "@/lib/api";
import { socialPostSchema } from "@/lib/validations/phase2";
import { blankToNull, parseSchedule, serializeSocialPost } from "@/lib/social-posts";
import type { SocialPostStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const status = new URL(request.url).searchParams.get("status");
    const allowed: SocialPostStatus[] = ["DRAFT", "SCHEDULED", "PUBLISHED"];
    const posts = await db.socialPost.findMany({
      where: status && allowed.includes(status as SocialPostStatus) ? { status: status as SocialPostStatus } : undefined,
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    return jsonOk({ posts: posts.map(serializeSocialPost) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId, session } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const body = socialPostSchema.parse(await request.json());
    const scheduledAt = parseSchedule(body.scheduledAt);
    if (body.status === "SCHEDULED" && !scheduledAt) {
      throw badRequest("Choose a schedule date for scheduled posts");
    }
    const publishedAt = body.status === "PUBLISHED" ? new Date() : null;
    const post = await db.socialPost.create({
      data: {
        schoolId,
        title: body.title,
        caption: body.caption,
        captionUrdu: blankToNull(body.captionUrdu),
        hashtags: blankToNull(body.hashtags),
        linkUrl: blankToNull(body.linkUrl),
        platforms: body.platforms,
        status: body.status,
        scheduledAt,
        publishedAt,
        createdById: session.user.id,
      },
    });
    return jsonOk({ post: serializeSocialPost(post) }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
