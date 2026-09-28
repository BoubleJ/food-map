import { RESTAURANT_CATEGORIES, RESTAURANT_CUISINES } from "@food-map/shared/restaurant";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  geometry,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const restaurantCategory = pgEnum("restaurant_category", RESTAURANT_CATEGORIES);

export const restaurantCuisine = pgEnum("restaurant_cuisine", RESTAURANT_CUISINES);

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: restaurantCategory("category").notNull(),
    cuisine: restaurantCuisine("cuisine"),
    description: text("description"),
    roadAddress: text("road_address").notNull(),
    jibunAddress: text("jibun_address"),
    regionSido: text("region_sido").notNull(),
    regionSigungu: text("region_sigungu"),
    regionEupmyeondong: text("region_eupmyeondong").notNull(),
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    kakaoPlaceId: text("kakao_place_id").unique(),
    isInBusiness: boolean("is_in_business").notNull().default(true),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("restaurants_location_idx").using("gist", table.location),
    index("restaurants_name_trgm_idx").using("gin", table.name.op("gin_trgm_ops")),
    index("restaurants_region_idx").on(
      table.regionSido,
      table.regionSigungu,
      table.regionEupmyeondong,
    ),
    index("restaurants_category_cuisine_idx").on(table.category, table.cuisine),
  ],
);

export const restaurantBusinessHours = pgTable(
  "restaurant_business_hours",
  {
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    dayOfWeek: smallint("day_of_week").notNull(),
    isDayOff: boolean("is_day_off").notNull().default(false),
    openTime: time("open_time"),
    closeTime: time("close_time"),
    breakStartTime: time("break_start_time"),
    breakEndTime: time("break_end_time"),
    lastOrderTime: time("last_order_time"),
  },
  (table) => [
    primaryKey({ columns: [table.restaurantId, table.dayOfWeek] }),
    check("restaurant_business_hours_day_of_week_check", sql`${table.dayOfWeek} between 0 and 6`),
  ],
);
