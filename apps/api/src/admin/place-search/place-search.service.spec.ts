import { getHttpClientToken } from "@nestjs/http-client";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KAKAO_LOCAL_CLIENT, PlaceSearchService } from "@/admin/place-search/place-search.service";

interface KakaoSearchQuery {
  query: string;
  size: number;
  page: number;
  rect?: string;
}

function createKakaoPlace(overrides: Record<string, string>) {
  return {
    id: "17131878",
    place_name: "수타우동겐 본점",
    category_group_code: "FD6",
    category_name: "음식점 > 일식 > 우동,소바",
    road_address_name: "경기 성남시 분당구 야탑로 72",
    address_name: "경기 성남시 분당구 야탑동 503",
    place_url: "http://place.map.kakao.com/17131878",
    x: "127.126824",
    y: "37.409579",
    ...overrides,
  };
}

function createKakaoResponse(
  documents: ReturnType<typeof createKakaoPlace>[],
  meta: { totalCount?: number; pageableCount?: number; isEnd?: boolean } = {},
) {
  const { totalCount = documents.length, pageableCount = totalCount, isEnd = true } = meta;
  return {
    data: {
      meta: { total_count: totalCount, pageable_count: pageableCount, is_end: isEnd },
      documents,
    },
  };
}

function getQuery(call: unknown[]) {
  const [, options] = call as [string, { query: KakaoSearchQuery }];
  return options.query;
}

describe("PlaceSearchService", () => {
  const get = vi.fn<(url: string, options: { query: KakaoSearchQuery }) => Promise<unknown>>();
  let service: PlaceSearchService;

  beforeEach(async () => {
    get.mockReset();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PlaceSearchService,
        { provide: getHttpClientToken(KAKAO_LOCAL_CLIENT), useValue: { get } },
      ],
    }).compile();
    service = moduleRef.get(PlaceSearchService);
  });

  it("카카오 키워드 검색으로 장소 ID, 이름, 카테고리, 주소, 카카오맵 url, 좌표를 돌려준다", async () => {
    get.mockResolvedValue(createKakaoResponse([createKakaoPlace({})]));

    await expect(service.search("수타우동겐")).resolves.toEqual({
      places: [
        {
          kakaoPlaceId: "17131878",
          name: "수타우동겐 본점",
          categoryName: "음식점 > 일식 > 우동,소바",
          roadAddress: "경기 성남시 분당구 야탑로 72",
          placeUrl: "http://place.map.kakao.com/17131878",
          coordinate: { latitude: 37.409579, longitude: 127.126824 },
        },
      ],
      isTruncated: false,
    });
    expect(get).toHaveBeenCalledWith("/v2/local/search/keyword.json", {
      query: { query: "수타우동겐", size: 15, page: 1 },
    });
  });

  it("장소 이름에 검색어가 없어도 남긴다", async () => {
    get.mockResolvedValue(
      createKakaoResponse([
        createKakaoPlace({ id: "1", place_name: "고에몬" }),
        createKakaoPlace({ id: "2", place_name: "밀밭칼국수 본점" }),
      ]),
    );

    const { places } = await service.search("고에몬");

    expect(places.map(({ kakaoPlaceId }) => kakaoPlaceId)).toEqual(["1", "2"]);
  });

  it("음식점(FD6)과 카페(CE7) 장소만 남긴다", async () => {
    get.mockResolvedValue(
      createKakaoResponse([
        createKakaoPlace({ id: "1", category_group_code: "FD6" }),
        createKakaoPlace({ id: "2", category_group_code: "CE7" }),
        createKakaoPlace({ id: "3", category_group_code: "PK6" }),
        createKakaoPlace({ id: "4", category_group_code: "" }),
      ]),
    );

    const { places } = await service.search("수타우동겐");

    expect(places.map(({ kakaoPlaceId }) => kakaoPlaceId)).toEqual(["1", "2"]);
  });

  it("도로명 주소가 없는 장소는 뺀다", async () => {
    get.mockResolvedValue(
      createKakaoResponse([
        createKakaoPlace({ id: "1" }),
        createKakaoPlace({ id: "2", road_address_name: "" }),
      ]),
    );

    const { places } = await service.search("포장마차");

    expect(places.map(({ kakaoPlaceId }) => kakaoPlaceId)).toEqual(["1"]);
  });

  it("마지막 페이지가 아니면 3페이지까지 이어서 받는다", async () => {
    get.mockImplementation(async (_, { query: { page } }) =>
      createKakaoResponse([createKakaoPlace({ id: `page-${page}` })], {
        totalCount: 45,
        isEnd: page === 3,
      }),
    );

    const { places } = await service.search("브런치빈");

    expect(places.map(({ kakaoPlaceId }) => kakaoPlaceId)).toEqual(["page-1", "page-2", "page-3"]);
    expect(get.mock.calls.map((call) => getQuery(call).page)).toEqual([1, 2, 3]);
  });

  it("마지막 페이지면 다음 페이지를 요청하지 않는다", async () => {
    get.mockResolvedValue(createKakaoResponse([createKakaoPlace({})], { isEnd: true }));

    await service.search("수타우동겐");

    expect(get).toHaveBeenCalledTimes(1);
  });

  it("찾은 장소가 받을 수 있는 수보다 많으면 한국 영역을 4개로 나눠 다시 검색한다", async () => {
    get.mockImplementation(async (_, { query: { rect } }) =>
      rect
        ? createKakaoResponse([createKakaoPlace({ id: rect })])
        : createKakaoResponse([createKakaoPlace({ id: "전국" })], {
            totalCount: 57,
            pageableCount: 45,
            isEnd: false,
          }),
    );

    const { places, isTruncated } = await service.search("브런치빈");

    expect(get.mock.calls.map((call) => getQuery(call).rect)).toEqual([
      undefined,
      "124,33,128,36",
      "128,33,132,36",
      "124,36,128,39",
      "128,36,132,39",
    ]);
    expect(places.map(({ kakaoPlaceId }) => kakaoPlaceId)).toEqual([
      "124,33,128,36",
      "128,33,132,36",
      "124,36,128,39",
      "128,36,132,39",
    ]);
    expect(isTruncated).toBe(false);
  });

  it("나눈 영역도 받을 수 있는 수보다 많으면 그 영역만 다시 4개로 나눈다", async () => {
    get.mockImplementation(async (_, { query: { rect } }) =>
      rect === undefined || rect === "124,36,128,39"
        ? createKakaoResponse([], { totalCount: 50, pageableCount: 45, isEnd: false })
        : createKakaoResponse([createKakaoPlace({ id: rect })]),
    );

    const { places } = await service.search("브런치빈");

    expect(places.map(({ kakaoPlaceId }) => kakaoPlaceId)).toEqual([
      "124,33,128,36",
      "128,33,132,36",
      "124,36,126,37.5",
      "126,36,128,37.5",
      "124,37.5,126,39",
      "126,37.5,128,39",
      "128,36,132,39",
    ]);
  });

  it("여러 영역에서 같은 장소가 나오면 하나만 남긴다", async () => {
    get.mockImplementation(async (_, { query: { rect } }) =>
      rect
        ? createKakaoResponse([createKakaoPlace({ id: "경계" }), createKakaoPlace({ id: rect })])
        : createKakaoResponse([], { totalCount: 57, pageableCount: 45, isEnd: false }),
    );

    const { places } = await service.search("브런치빈");

    expect(places.filter(({ kakaoPlaceId }) => kakaoPlaceId === "경계")).toHaveLength(1);
    expect(places).toHaveLength(5);
  });

  it("영역을 4번 나눈 뒤에는 받을 수 있는 수보다 많아도 더 나누지 않고 3페이지까지 받는다", async () => {
    get.mockImplementation(async (_, { query: { rect, page } }) =>
      createKakaoResponse([createKakaoPlace({ id: `${rect}-${page}` })], {
        totalCount: 100,
        pageableCount: 45,
        isEnd: false,
      }),
    );

    const { isTruncated } = await service.search("스타벅스");

    expect(isTruncated).toBe(true);
    const maxSplitRects = 4 ** 4;
    const splitRequests = 1 + 4 + 4 ** 2 + 4 ** 3;
    expect(get).toHaveBeenCalledTimes(splitRequests + maxSplitRects * 3);
  });
});
