ALTER TABLE "SocialPost" ADD COLUMN "imageKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "SocialPost"
SET "imageKeys" = ARRAY["imageKey"]
WHERE "imageKey" IS NOT NULL AND "imageKey" <> '';

ALTER TABLE "SocialPost" DROP COLUMN "imageKey";
