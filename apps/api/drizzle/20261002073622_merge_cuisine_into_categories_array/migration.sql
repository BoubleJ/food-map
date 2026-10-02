DROP INDEX "restaurants_category_cuisine_idx";--> statement-breakpoint
ALTER TABLE "restaurants" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
UPDATE "restaurants" SET "category" = "cuisine"::text WHERE "category" = 'restaurant';--> statement-breakpoint
DROP TYPE "restaurant_category";--> statement-breakpoint
CREATE TYPE "restaurant_category" AS ENUM('korean', 'chinese', 'japanese', 'western', 'bakery', 'icecream', 'cafe', 'fastfood', 'bunsik', 'bar', 'vietnamese', 'thai', 'indian', 'meat', 'udon', 'tonkatsu', 'sushi', 'seafood', 'soba', 'shaved', 'donut');--> statement-breakpoint
ALTER TABLE "restaurants" RENAME COLUMN "category" TO "categories";--> statement-breakpoint
ALTER TABLE "restaurants" ALTER COLUMN "categories" SET DATA TYPE "restaurant_category"[] USING ARRAY["categories"::"restaurant_category"];--> statement-breakpoint
ALTER TABLE "restaurants" DROP COLUMN "cuisine";--> statement-breakpoint
DROP TYPE "restaurant_cuisine";--> statement-breakpoint
CREATE INDEX "restaurants_categories_idx" ON "restaurants" USING gin ("categories");--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_categories_not_empty_check" CHECK (cardinality("categories") > 0);