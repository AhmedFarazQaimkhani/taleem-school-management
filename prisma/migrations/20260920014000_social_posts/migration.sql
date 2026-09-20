-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'YOUTUBE', 'TIKTOK', 'X');

-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "captionUrdu" TEXT,
    "hashtags" TEXT,
    "linkUrl" TEXT,
    "platforms" "SocialPlatform"[] NOT NULL,
    "status" "SocialPostStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "imageKey" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SocialPost_schoolId_idx" ON "SocialPost"("schoolId");
CREATE INDEX "SocialPost_schoolId_status_idx" ON "SocialPost"("schoolId", "status");

ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
