import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { ORPCError } from "@orpc/nest";
import type {
  RestaurantRegisterInput,
  RestaurantRegisterOutput,
} from "@food-map/shared/admin/restaurant-register";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { restaurants } from "@/database/schema/restaurant";

@Injectable()
export class RestaurantRegisterService {
  constructor(@InjectDrizzle() private readonly db: PostgresJsDatabase) {}

  async register({
    common: { categories, isVisible },
    restaurants: items,
  }: RestaurantRegisterInput): Promise<RestaurantRegisterOutput> {
    const kakaoPlaceIds = items.map(({ kakaoPlaceId }) => kakaoPlaceId);

    await this.db.transaction(async (transaction) => {
      const inserted = await transaction
        .insert(restaurants)
        .values(
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
        )
        .onConflictDoNothing({ target: restaurants.kakaoPlaceId })
        .returning({ kakaoPlaceId: restaurants.kakaoPlaceId });

      const insertedPlaceIds = inserted.map(({ kakaoPlaceId }) => kakaoPlaceId);
      const alreadyRegisteredPlaceIds = kakaoPlaceIds.filter(
        (id) => !insertedPlaceIds.includes(id),
      );
      if (alreadyRegisteredPlaceIds.length > 0) {
        throw new ORPCError("CONFLICT", {
          defined: true,
          message: "이미 등록된 식당이 있습니다.",
          data: { kakaoPlaceIds: alreadyRegisteredPlaceIds },
        });
      }
    });

    return { registeredPlaceIds: kakaoPlaceIds };
  }
}
