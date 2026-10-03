import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import type {
  RestaurantAddress,
  RestaurantCandidate,
} from "@food-map/shared/admin/restaurant-search";
import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { AddressSearchService } from "@/admin/address-search/address-search.service";
import { PlaceSearchService } from "@/admin/place-search/place-search.service";
import { restaurants } from "@/database/schema/restaurant";

type AddressField = "roadAddress" | "jibunAddress";

function toAddressKey(address: string) {
  return address.split(" ").slice(1).join("");
}

@Injectable()
export class RestaurantSearchService {
  constructor(
    private readonly placeSearchService: PlaceSearchService,
    private readonly addressSearchService: AddressSearchService,
    @InjectDrizzle() private readonly db: PostgresJsDatabase,
  ) {}

  async search(keyword: string): Promise<RestaurantCandidate[]> {
    const places = await this.placeSearchService.search(keyword);
    if (places.length === 0) return [];

    const registeredPlaceIds = await this.findRegisteredPlaceIds(
      places.map(({ kakaoPlaceId }) => kakaoPlaceId),
    );

    return Promise.all(
      places.map(
        async ({ kakaoPlaceId, name, categoryName, placeUrl, roadAddress, jibunAddress }) => ({
          kakaoPlaceId,
          name,
          categoryName,
          placeUrl,
          isRegistered: registeredPlaceIds.has(kakaoPlaceId),
          address: roadAddress
            ? await this.findAddress(roadAddress, "roadAddress")
            : await this.findAddress(jibunAddress, "jibunAddress"),
        }),
      ),
    );
  }

  private async findRegisteredPlaceIds(kakaoPlaceIds: string[]) {
    const registered = await this.db
      .select({ kakaoPlaceId: restaurants.kakaoPlaceId })
      .from(restaurants)
      .where(inArray(restaurants.kakaoPlaceId, kakaoPlaceIds));
    return new Set(registered.map(({ kakaoPlaceId }) => kakaoPlaceId));
  }

  private async findAddress(
    kakaoAddress: string,
    field: AddressField,
  ): Promise<RestaurantAddress | null> {
    if (!kakaoAddress) return null;

    const addresses = await this.addressSearchService.search(kakaoAddress);
    const address =
      addresses.find(
        (candidate) => toAddressKey(candidate[field]) === toAddressKey(kakaoAddress),
      ) ?? (addresses.length === 1 ? addresses[0] : undefined);
    if (!address) return null;

    const { coordinateQuery, ...addressFields } = address;
    try {
      const coordinate = await this.addressSearchService.findCoordinate(coordinateQuery);
      return { ...addressFields, ...coordinate };
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }
}
