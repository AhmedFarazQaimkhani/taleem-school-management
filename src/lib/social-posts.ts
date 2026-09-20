import type { SocialPlatform, SocialPost, SocialPostStatus } from "@prisma/client";
import { badRequest } from "@/lib/api";

export type SocialPostDto = {
  id: string;
  title: string;
  caption: string;
  captionUrdu: string | null;
  hashtags: string | null;
  linkUrl: string | null;
  platforms: SocialPlatform[];
  status: SocialPostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  imageUrls: string[];
  createdAt: string;
};

export const MAX_SOCIAL_IMAGES = 10;

export function socialImageUrl(postId: string, key: string) {
  return `/api/social-posts/${postId}/image?key=${encodeURIComponent(key)}`;
}

export function blankToNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function parseSchedule(value: string | null | undefined) {
  const raw = blankToNull(value);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw badRequest("Schedule date is invalid");
  }
  return date;
}

export function serializeSocialPost(post: SocialPost): SocialPostDto {
  return {
    id: post.id,
    title: post.title,
    caption: post.caption,
    captionUrdu: post.captionUrdu,
    hashtags: post.hashtags,
    linkUrl: post.linkUrl,
    platforms: post.platforms,
    status: post.status,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    imageUrls: post.imageKeys.map((key) => socialImageUrl(post.id, key)),
    createdAt: post.createdAt.toISOString(),
  };
}

export function composeSocialPostText(post: {
  caption: string;
  captionUrdu?: string | null;
  hashtags?: string | null;
  linkUrl?: string | null;
}) {
  return [post.caption, post.captionUrdu, post.hashtags, post.linkUrl].filter(Boolean).join("\n\n");
}
