import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { ORPCError } from "@orpc/nest";
import type {
  RestaurantRegisterInput,
  RestaurantRegisterOutput,
} from "@food-map/shared/admin/restaurant-register";
import { inArray } from "drizzle-orm";
import { DrizzleQueryError } from "drizzle-orm/errors";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { restaurants } from "@/database/schema/restaurant";

const UNIQUE_VIOLATION_CODE = "23505";

function isUniqueViolation(error: unknown) {
  return (
    error instanceof DrizzleQueryError &&
    error.cause instanceof Error &&
    "code" in error.cause &&
    error.cause.code === UNIQUE_VIOLATION_CODE
  );
}

function createConflictError(kakaoPlaceIds: string[]) {
  return new ORPCError("CONFLICT", {
    defined: true,
    message: "이미 등록된 식당이 있습니다.",
    data: { kakaoPlaceIds },
  });
}

function toPlaceIds(rows: { kakaoPlaceId: string | null }[]) {
  return rows.flatMap(({ kakaoPlaceId }) => (kakaoPlaceId ? [kakaoPlaceId] : []));
}

@Injectable()
export class RestaurantRegisterService {
  constructor(@InjectDrizzle() private readonly db: PostgresJsDatabase) {}

  async register({
    common: { categories, isVisible },
    restaurants: items,
  }: RestaurantRegisterInput): Promise<RestaurantRegisterOutput> {
    const kakaoPlaceIds = items.map(({ kakaoPlaceId }) => kakaoPlaceId);

    try {
      await this.db.transaction(async (tx) => {
        const registered = await tx
          .select({ kakaoPlaceId: restaurants.kakaoPlaceId })
          .from(restaurants)
          .where(inArray(restaurants.kakaoPlaceId, kakaoPlaceIds));
        if (registered.length > 0) throw createConflictError(toPlaceIds(registered));

        await tx.insert(restaurants).values(
          items.map(
            ({
              kakaoPlaceId,
              name,
              placeUrl,
              address: { latitude, longitude, ...address },
              description,
              franchiseName,
            }) => ({
              name,
              categories,
              description,
              ...address,
              location: { x: longitude, y: latitude },
              kakaoPlaceId,
              kakaoPlaceUrl: placeUrl,
              franchiseName,
              isVisible,
            }),
          ),
        );
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;

      const registered = await this.db
        .select({ kakaoPlaceId: restaurants.kakaoPlaceId })
        .from(restaurants)
        .where(inArray(restaurants.kakaoPlaceId, kakaoPlaceIds));
      throw createConflictError(toPlaceIds(registered));
    }

    return { registeredPlaceIds: kakaoPlaceIds };
  }
}
