"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/client-api";
import { SOCIAL_PLATFORMS, type SocialPlatformValue } from "@/lib/validations/phase2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchoolLogo } from "@/components/school-logo";
import { cn } from "@/lib/utils";

type SocialPostDto = {
  id: string;
  title: string;
  caption: string;
  captionUrdu: string | null;
  hashtags: string | null;
  linkUrl: string | null;
  platforms: SocialPlatformValue[];
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  scheduledAt: string | null;
  publishedAt: string | null;
  imageUrls: string[];
  createdAt: string;
};

const MAX_IMAGES = 10;

type Filter = "ALL" | SocialPostDto["status"];

function composeSocialPostText(post: Pick<SocialPostDto, "caption" | "captionUrdu" | "hashtags" | "linkUrl">) {
  return [post.caption, post.captionUrdu, post.hashtags, post.linkUrl].filter(Boolean).join("\n\n");
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function uploadImages(id: string, files: File[]) {
  if (files.length === 0) return;
  const form = new FormData();
  for (const file of files) form.append("file", file);
  const res = await fetch(`/api/social-posts/${id}/image`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Upload failed");
}

export function SocialPostsClient({
  schoolName,
  logoKey,
}: {
  schoolName: string;
  logoKey?: string | null;
}) {
  const t = useTranslations("socialPostsPage");
  const common = useTranslations("common");
  const [posts, setPosts] = useState<SocialPostDto[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [platforms, setPlatforms] = useState<SocialPlatformValue[]>(["FACEBOOK", "INSTAGRAM"]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [captionUrdu, setCaptionUrdu] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [status, setStatus] = useState<SocialPostDto["status"]>("DRAFT");
  const [scheduledAt, setScheduledAt] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const visible = useMemo(
    () => (filter === "ALL" ? posts : posts.filter((post) => post.status === filter)),
    [filter, posts],
  );

  async function refresh() {
    const payload = await api<{ posts: SocialPostDto[] }>("/api/social-posts");
    setPosts(payload.posts);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : common("failed")));
  }, [common]);

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [images]);

  function togglePlatform(platform: SocialPlatformValue) {
    setPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform],
    );
  }

  function resetForm() {
    setTitle("");
    setCaption("");
    setCaptionUrdu("");
    setHashtags("");
    setLinkUrl("");
    setStatus("DRAFT");
    setScheduledAt("");
    setImages([]);
    setPlatforms(["FACEBOOK", "INSTAGRAM"]);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                setMessage(null);
                if (platforms.length === 0) {
                  setError(t("needPlatform"));
                  return;
                }
                if (images.length > MAX_IMAGES) {
                  setError(t("tooManyImages"));
                  return;
                }
                setSaving(true);
                try {
                  const created = await api<{ post: SocialPostDto }>("/api/social-posts", {
                    method: "POST",
                    body: JSON.stringify({
                      title,
                      caption,
                      captionUrdu,
                      hashtags,
                      linkUrl,
                      platforms,
                      status,
                      scheduledAt: scheduledAt || null,
                    }),
                  });
                  await uploadImages(created.post.id, images);
                  resetForm();
                  await refresh();
                  setMessage(t("saved"));
                } catch (err) {
                  setError(err instanceof Error ? err.message : common("failed"));
                } finally {
                  setSaving(false);
                }
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="social-title">{t("postTitle")}</Label>
                <Input id="social-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="social-caption">{t("caption")}</Label>
                  <textarea
                    id="social-caption"
                    required
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    className="min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="social-caption-ur">{t("captionUrdu")}</Label>
                  <textarea
                    id="social-caption-ur"
                    dir="rtl"
                    value={captionUrdu}
                    onChange={(event) => setCaptionUrdu(event.target.value)}
                    className="min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="social-hashtags">{t("hashtags")}</Label>
                  <Input
                    id="social-hashtags"
                    value={hashtags}
                    onChange={(event) => setHashtags(event.target.value)}
                    placeholder="#Taleem #Admissions"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="social-link">{t("link")}</Label>
                  <Input id="social-link" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("platformsLabel")}</Label>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        platforms.includes(platform)
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : "border-input bg-background text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {t(`platforms.${platform}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="social-status">{common("status")}</Label>
                  <select
                    id="social-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as SocialPostDto["status"])}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="DRAFT">{t("statuses.DRAFT")}</option>
                    <option value="SCHEDULED">{t("statuses.SCHEDULED")}</option>
                    <option value="PUBLISHED">{t("statuses.PUBLISHED")}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="social-when">{t("scheduleAt")}</Label>
                  <input
                    id="social-when"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    disabled={status === "PUBLISHED"}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="social-image">{t("image")}</Label>
                  <input
                    id="social-image"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const next = Array.from(event.target.files ?? []);
                      setImages((current) => [...current, ...next].slice(0, MAX_IMAGES));
                      event.target.value = "";
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm"
                  />
                  <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {t("savePost")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{t("preview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border bg-gradient-to-b from-slate-50 to-white p-4 shadow-inner">
              <div className="flex items-center gap-3">
                <SchoolLogo name={schoolName} logoKey={logoKey} size="sm" />
                <div>
                  <p className="text-sm font-semibold">{schoolName}</p>
                  <p className="text-xs text-muted-foreground">{platforms.map((item) => t(`platforms.${item}`)).join(" · ")}</p>
                </div>
              </div>
              {previewUrls.length > 0 ? (
                <div className={`mt-3 grid gap-2 ${previewUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {previewUrls.map((url, index) => (
                    <div key={url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-28 w-full rounded-xl object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((current) => current.filter((_, item) => item !== index))}
                        className="absolute end-1.5 top-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] text-white"
                      >
                        {t("removeImage")}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 flex h-40 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
                  {t("noImage")}
                </div>
              )}
              <p className="mt-3 text-sm font-medium">{title || t("untitled")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{caption || t("captionHint")}</p>
              {captionUrdu ? <p className="mt-2 whitespace-pre-wrap text-sm" dir="rtl">{captionUrdu}</p> : null}
              {hashtags ? <p className="mt-2 text-sm text-emerald-800">{hashtags}</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ALL", "DRAFT", "SCHEDULED", "PUBLISHED"] as const).map((item) => (
          <Button key={item} type="button" size="sm" variant={filter === item ? "default" : "outline"} onClick={() => setFilter(item)}>
            {item === "ALL" ? common("all") : t(`statuses.${item}`)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
        {visible.map((post) => (
          <Card key={post.id}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-base">{post.title}</CardTitle>
                <Badge variant={post.status === "PUBLISHED" ? "success" : post.status === "SCHEDULED" ? "warning" : "secondary"}>
                  {t(`statuses.${post.status}`)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {post.platforms.map((platform) => (
                  <Badge key={platform} variant="outline">
                    {t(`platforms.${platform}`)}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {post.imageUrls.length > 0 ? (
                <div className={`grid gap-2 ${post.imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {post.imageUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="" className="h-32 w-full rounded-xl object-cover" />
                  ))}
                </div>
              ) : null}
              <p className="whitespace-pre-wrap">{post.caption}</p>
              {post.captionUrdu ? <p className="whitespace-pre-wrap text-muted-foreground" dir="rtl">{post.captionUrdu}</p> : null}
              {post.hashtags ? <p className="text-emerald-800">{post.hashtags}</p> : null}
              {post.scheduledAt ? (
                <p className="text-xs text-muted-foreground">
                  {t("scheduleAt")}: {toDateTimeLocal(post.scheduledAt).replace("T", " ")}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(composeSocialPostText(post));
                      setMessage(t("copied"));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : common("failed"));
                    }
                  }}
                >
                  {t("copy")}
                </Button>
                {post.status !== "PUBLISHED" ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await api(`/api/social-posts/${post.id}/publish`, { method: "POST" });
                        await refresh();
                        setMessage(t("markedPublished"));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : common("failed"));
                      }
                    }}
                  >
                    {t("markPublished")}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await api(`/api/social-posts/${post.id}`, { method: "DELETE" });
                      await refresh();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : common("failed"));
                    }
                  }}
                >
                  {t("delete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
