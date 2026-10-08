import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import type { RestaurantSearchResult } from "@food-map/shared/admin/restaurant-search";
import { inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { PlaceSearchService } from "@/admin/place-search/place-search.service";
import type { PlaceSearchResult } from "@/admin/types/place-search-result";
import { restaurants } from "@/database/schema/restaurant";

interface CachedPlaces extends PlaceSearchResult {
  expiresAt: number;
}

const PAGE_SIZE = 15;

const CACHE_TTL_MS = 5 * 60 * 1000;

const MAX_CACHE_SIZE = 100;

@Injectable()
export class RestaurantSearchService {
  private readonly cache = new Map<string, CachedPlaces>();

  constructor(
    private readonly placeSearchService: PlaceSearchService,
    @InjectDrizzle() private readonly db: PostgresJsDatabase,
  ) {}

  async search(keyword: string, page: number): Promise<RestaurantSearchResult> {
    const { places, isTruncated } = await this.findPlaces(keyword, page);
    const pagePlaces = places.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const registeredPlaceIds = await this.findRegisteredPlaceIds(
      pagePlaces.map(({ kakaoPlaceId }) => kakaoPlaceId),
    );

    return {
      restaurants: pagePlaces.map((place) => ({
        ...place,
        isRegistered: registeredPlaceIds.includes(place.kakaoPlaceId),
      })),
      hasNext: places.length > page * PAGE_SIZE,
      isTruncated,
    };
  }

  private async findPlaces(keyword: string, page: number) {
    const cached = this.cache.get(keyword);
    // 1페이지는 새 검색이라 카카오를 다시 호출하고, 2페이지부터는 더 보기라 처음 검색한 결과를 쓴다
    if (page > 1 && cached && cached.expiresAt > Date.now()) return cached;

    const result = await this.placeSearchService.search(keyword);
    this.saveCache(keyword, result);
    return result;
  }

  private saveCache(keyword: string, result: PlaceSearchResult) {
    const now = Date.now();
    for (const [key, { expiresAt }] of this.cache) {
      if (expiresAt <= now) this.cache.delete(key);
    }
    this.cache.delete(keyword);
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKeyword = this.cache.keys().next().value;
      if (oldestKeyword !== undefined) this.cache.delete(oldestKeyword);
    }
    this.cache.set(keyword, { ...result, expiresAt: now + CACHE_TTL_MS });
  }

  private async findRegisteredPlaceIds(kakaoPlaceIds: string[]) {
    if (kakaoPlaceIds.length === 0) return [];

    const registered = await this.db
      .select({ kakaoPlaceId: restaurants.kakaoPlaceId })
      .from(restaurants)
      .where(inArray(restaurants.kakaoPlaceId, kakaoPlaceIds));
    return registered.map(({ kakaoPlaceId }) => kakaoPlaceId);
  }
}
