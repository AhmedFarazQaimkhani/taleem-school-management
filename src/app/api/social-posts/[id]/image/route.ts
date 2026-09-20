import { NextResponse } from "next/server";
import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { badRequest, notFound } from "@/lib/api";
import { MAX_LOGO_BYTES_LIMIT, sniffImage } from "@/lib/branding";
import { getFileStorage } from "@/lib/services/storage";
import { MAX_SOCIAL_IMAGES, serializeSocialPost } from "@/lib/social-posts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function imageKeyFrom(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("key") ?? url.searchParams.get("v");
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const post = await db.socialPost.findFirst({ where: { id: params.id } });
    const key = imageKeyFrom(request);
    if (!post || !key || !post.imageKeys.includes(key)) throw notFound("Image not found");
    const stored = await getFileStorage().read(schoolId, key);
    return new NextResponse(new Uint8Array(stored.body), {
      status: 200,
      headers: {
        "Content-Type": stored.contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const existing = await db.socialPost.findFirst({ where: { id: params.id } });
    if (!existing) throw notFound("Social post not found");

    const form = await request.formData();
    const files = form.getAll("file").filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length === 0) {
      throw badRequest("Choose a PNG, JPEG, or WebP image");
    }
    if (existing.imageKeys.length + files.length > MAX_SOCIAL_IMAGES) {
      throw badRequest(`You can attach at most ${MAX_SOCIAL_IMAGES} images`);
    }

    const storage = getFileStorage();
    const added: string[] = [];
    for (const [index, file] of files.entries()) {
      if (file.size > MAX_LOGO_BYTES_LIMIT) {
        throw badRequest("Each image must be 1 MB or smaller");
      }
      const body = Buffer.from(await file.arrayBuffer());
      const image = sniffImage(body);
      if (!image) {
        throw badRequest("Images must be PNG, JPEG, or WebP files");
      }
      const imageKey = `social/${existing.id}-${Date.now()}-${index}.${image.ext}`;
      await storage.put(schoolId, imageKey, body, image.contentType);
      added.push(imageKey);
    }

    const post = await db.socialPost.update({
      where: { id: existing.id },
      data: { imageKeys: [...existing.imageKeys, ...added] },
    });
    return jsonOk({ post: serializeSocialPost(post) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "TEACHER"]);
    const existing = await db.socialPost.findFirst({ where: { id: params.id } });
    if (!existing) throw notFound("Social post not found");
    const key = imageKeyFrom(request);
    if (!key || !existing.imageKeys.includes(key)) throw notFound("Image not found");
    await getFileStorage().remove(schoolId, key);
    const post = await db.socialPost.update({
      where: { id: existing.id },
      data: { imageKeys: existing.imageKeys.filter((item) => item !== key) },
    });
    return jsonOk({ post: serializeSocialPost(post) });
  } catch (error) {
    return handleRouteError(error);
  }
}
