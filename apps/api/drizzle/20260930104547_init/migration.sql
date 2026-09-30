CREATE TYPE "restaurant_category" AS ENUM('restaurant', 'cafe', 'bakery', 'bar');--> statement-breakpoint
CREATE TYPE "restaurant_cuisine" AS ENUM('korean', 'japanese', 'chinese', 'western', 'vietnamese', 'thai', 'turkish', 'bunsik', 'mexican', 'indian', 'other');--> statement-breakpoint
CREATE TABLE "restaurant_business_hours" (
	"restaurant_id" uuid,
	"day_of_week" smallint,
	"is_day_off" boolean DEFAULT false NOT NULL,
	"open_time" time,
	"close_time" time,
	"break_start_time" time,
	"break_end_time" time,
	"last_order_time" time,
	CONSTRAINT "restaurant_business_hours_pkey" PRIMARY KEY("restaurant_id","day_of_week"),
	CONSTRAINT "restaurant_business_hours_day_of_week_check" CHECK ("day_of_week" between 0 and 6)
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"category" "restaurant_category" NOT NULL,
	"cuisine" "restaurant_cuisine",
	"description" text,
	"road_address" text NOT NULL,
	"jibun_address" text,
	"region_sido" text NOT NULL,
	"region_sigungu" text,
	"region_eupmyeondong" text NOT NULL,
	"location" geometry(point,4326) NOT NULL,
	"thumbnail_url" text,
	"kakao_place_id" text UNIQUE,
	"is_in_business" boolean DEFAULT true NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "restaurants_location_idx" ON "restaurants" USING gist ("location");--> statement-breakpoint
CREATE INDEX "restaurants_name_trgm_idx" ON "restaurants" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "restaurants_region_idx" ON "restaurants" ("region_sido","region_sigungu","region_eupmyeondong");--> statement-breakpoint
CREATE INDEX "restaurants_category_cuisine_idx" ON "restaurants" ("category","cuisine");--> statement-breakpoint
ALTER TABLE "restaurant_business_hours" ADD CONSTRAINT "restaurant_business_hours_restaurant_id_restaurants_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE;