import { sql } from "drizzle-orm";
import {
  geometry,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);
export const oauthProvider = pgEnum("oauth_provider", ["kakao", "naver", "google", "apple"]);
export const placeCategory = pgEnum("place_category", [
  "korean",
  "chinese",
  "japanese",
  "western",
  "asian",
  "cafe",
  "bar",
  "etc",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email"),
    nickname: text("nickname").notNull(),
    profileImageUrl: text("profile_image_url"),
    role: userRole("role").notNull().default("USER"),
    provider: oauthProvider("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_provider_uid_idx").on(table.provider, table.providerUserId),
  ],
);

export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: placeCategory("category").notNull().default("etc"),
    address: text("address").notNull(),
    roadAddress: text("road_address"),
    // PostGIS geometry(point, 4326). { x: 경도, y: 위도 } 로 읽고 쓴다.
    location: geometry("location", { type: "point", mode: "xy", srid: 4326 }).notNull(),
    phone: text("phone"),
    thumbnailUrl: text("thumbnail_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // 지도 영역 조회는 공간 인덱스가 없으면 전부 순차 스캔이 된다.
    index("places_location_idx").using("gist", table.location),
    index("places_name_idx").on(sql`lower(${table.name})`),
  ],
);
