import { getDrizzleToken } from "@nestjs/drizzle";
import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaceSearchService } from "@/admin/place-search/place-search.service";
import { RestaurantSearchService } from "@/admin/restaurant-search/restaurant-search.service";

function createPlace(kakaoPlaceId: string) {
  return {
    kakaoPlaceId,
    name: "수타우동겐 본점",
    categoryName: "음식점 > 일식 > 우동,소바",
    roadAddress: "경기 성남시 분당구 야탑로 72",
    placeUrl: `http://place.map.kakao.com/${kakaoPlaceId}`,
    coordinate: { latitude: 37.409579, longitude: 127.126824 },
  };
}

function createPlaces(count: number) {
  return Array.from({ length: count }, (_, index) => createPlace(String(index + 1)));
}

function createSearchResult(places: ReturnType<typeof createPlace>[], isTruncated = false) {
  return { places, isTruncated };
}

describe("RestaurantSearchService", () => {
  const searchPlace = vi.fn<PlaceSearchService["search"]>();
  const findRegistered = vi.fn<() => Promise<{ kakaoPlaceId: string | null }[]>>();
  let service: RestaurantSearchService;

  beforeEach(async () => {
    vi.resetAllMocks();
    findRegistered.mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        RestaurantSearchService,
        { provide: PlaceSearchService, useValue: { search: searchPlace } },
        {
          provide: getDrizzleToken(),
          useValue: { select: () => ({ from: () => ({ where: findRegistered }) }) },
        },
      ],
    }).compile();
    service = moduleRef.get(RestaurantSearchService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("카카오 장소에 등록 여부를 붙여 첫 15곳과 다음 페이지 여부를 돌려준다", async () => {
    searchPlace.mockResolvedValue(createSearchResult(createPlaces(20)));

    const { restaurants, hasNext } = await service.search("수타우동겐", 1);

    expect(restaurants).toHaveLength(15);
    expect(restaurants[0]).toEqual({ ...createPlace("1"), isRegistered: false });
    expect(hasNext).toBe(true);
  });

  it("카카오 결과를 모두 받지 못했으면 isTruncated 를 true 로 돌려준다", async () => {
    searchPlace.mockResolvedValue(createSearchResult(createPlaces(20), true));

    const { isTruncated } = await service.search("스타벅스", 1);

    expect(isTruncated).toBe(true);
  });

  it("요청한 페이지의 15곳을 잘라 돌려준다", async () => {
    searchPlace.mockResolvedValue(createSearchResult(createPlaces(20)));

    const { restaurants, hasNext } = await service.search("수타우동겐", 2);

    expect(restaurants.map(({ kakaoPlaceId }) => kakaoPlaceId)).toEqual([
      "16",
      "17",
      "18",
      "19",
      "20",
    ]);
    expect(hasNext).toBe(false);
  });

  it("DB 에 같은 카카오 장소 ID 로 등록된 식당이 있으면 isRegistered 를 true 로 돌려준다", async () => {
    searchPlace.mockResolvedValue(createSearchResult(createPlaces(2)));
    findRegistered.mockResolvedValue([{ kakaoPlaceId: "2" }]);

    const { restaurants } = await service.search("수타우동겐", 1);

    expect(
      restaurants.map(({ kakaoPlaceId, isRegistered }) => [kakaoPlaceId, isRegistered]),
    ).toEqual([
      ["1", false],
      ["2", true],
    ]);
  });

  it("2페이지부터는 5분 안에 모은 결과를 다시 쓰고 카카오를 다시 검색하지 않는다", async () => {
    searchPlace.mockResolvedValue(createSearchResult(createPlaces(20)));

    await service.search("수타우동겐", 1);
    await service.search("수타우동겐", 2);

    expect(searchPlace).toHaveBeenCalledTimes(1);
  });

  it("1페이지는 모은 결과가 있어도 카카오를 다시 검색한다", async () => {
    searchPlace.mockResolvedValue(createSearchResult(createPlaces(20)));

    await service.search("수타우동겐", 1);
    await service.search("수타우동겐", 1);

    expect(searchPlace).toHaveBeenCalledTimes(2);
  });

  it("모은 지 5분이 지나면 2페이지도 카카오를 다시 검색한다", async () => {
    vi.useFakeTimers();
    searchPlace.mockResolvedValue(createSearchResult(createPlaces(20)));

    await service.search("수타우동겐", 1);
    vi.advanceTimersByTime(5 * 60 * 1000);
    await service.search("수타우동겐", 2);

    expect(searchPlace).toHaveBeenCalledTimes(2);
  });

  it("검색어마다 모은 결과를 따로 다시 쓴다", async () => {
    searchPlace.mockImplementation(async (keyword) => createSearchResult([createPlace(keyword)]));

    await service.search("고에몬", 1);
    await service.search("수타우동겐", 1);
    const { restaurants } = await service.search("고에몬", 2);

    expect(searchPlace).toHaveBeenCalledTimes(2);
    expect(restaurants).toEqual([]);
  });

  it("모은 결과가 100개를 넘으면 가장 먼저 모은 검색어부터 지운다", async () => {
    searchPlace.mockResolvedValue(createSearchResult(createPlaces(20)));

    for (let index = 0; index <= 100; index++) {
      await service.search(`검색어${index}`, 1);
    }
    await service.search("검색어0", 2);
    await service.search("검색어100", 2);

    expect(searchPlace).toHaveBeenCalledTimes(102);
    expect(searchPlace).toHaveBeenLastCalledWith("검색어0");
  });

  it("돌려줄 장소가 없으면 등록 여부를 조회하지 않는다", async () => {
    searchPlace.mockResolvedValue(createSearchResult([]));

    await expect(service.search("주원초밥", 1)).resolves.toEqual({
      restaurants: [],
      hasNext: false,
      isTruncated: false,
    });
    expect(findRegistered).not.toHaveBeenCalled();
  });
});
