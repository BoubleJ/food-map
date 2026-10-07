ALTER TYPE "restaurant_category" ADD VALUE 'noodle';--> statement-breakpoint
ALTER TYPE "restaurant_category" ADD VALUE 'pocha';--> statement-breakpoint
ALTER TYPE "restaurant_category" ADD VALUE 'hof';--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN "franchise_name" text;--> statement-breakpoint
CREATE INDEX "restaurants_franchise_name_idx" ON "restaurants" ("franchise_name");--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_franchise_name_not_empty_check" CHECK ("franchise_name" <> '');