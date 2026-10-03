import { getHttpClientToken } from "@nestjs/http-client";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KAKAO_LOCAL_CLIENT, PlaceSearchService } from "@/admin/place-search/place-search.service";

function createKakaoPlace(overrides: Record<string, string>) {
  return {
    id: "17131878",
    place_name: "수타우동겐 본점",
    category_group_code: "FD6",
    category_name: "음식점 > 일식 > 우동,소바",
    road_address_name: "경기 성남시 분당구 야탑로 72",
    address_name: "경기 성남시 분당구 야탑동 503",
    place_url: "http://place.map.kakao.com/17131878",
    ...overrides,
  };
}

describe("PlaceSearchService", () => {
  const get = vi.fn<(url: string, options?: object) => Promise<unknown>>();
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

  it("카카오 키워드 검색으로 장소 ID, 이름, 카테고리, 주소, 카카오맵 url 을 돌려준다", async () => {
    get.mockResolvedValue({ data: { documents: [createKakaoPlace({})] } });

    await expect(service.search("수타우동겐")).resolves.toEqual([
      {
        kakaoPlaceId: "17131878",
        name: "수타우동겐 본점",
        categoryName: "음식점 > 일식 > 우동,소바",
        roadAddress: "경기 성남시 분당구 야탑로 72",
        jibunAddress: "경기 성남시 분당구 야탑동 503",
        placeUrl: "http://place.map.kakao.com/17131878",
      },
    ]);
    expect(get).toHaveBeenCalledWith("/v2/local/search/keyword.json", {
      query: { query: "수타우동겐", size: 15 },
    });
  });

  it("공백을 지운 장소 이름이 공백을 지운 검색어를 포함하는 장소만 남긴다", async () => {
    get.mockResolvedValue({
      data: {
        documents: [
          createKakaoPlace({ id: "1", place_name: "고에몬" }),
          createKakaoPlace({ id: "2", place_name: "고에몬 홍대AK점" }),
          createKakaoPlace({ id: "3", place_name: "밀밭칼국수 본점" }),
        ],
      },
    });

    const places = await service.search("고 에몬");

    expect(places.map(({ kakaoPlaceId }) => kakaoPlaceId)).toEqual(["1", "2"]);
  });

  it("음식점(FD6)과 카페(CE7) 장소만 남긴다", async () => {
    get.mockResolvedValue({
      data: {
        documents: [
          createKakaoPlace({ id: "1", category_group_code: "FD6" }),
          createKakaoPlace({ id: "2", category_group_code: "CE7" }),
          createKakaoPlace({ id: "3", category_group_code: "HP8" }),
          createKakaoPlace({ id: "4", category_group_code: "" }),
        ],
      },
    });

    const places = await service.search("수타우동겐");

    expect(places.map(({ kakaoPlaceId }) => kakaoPlaceId)).toEqual(["1", "2"]);
  });
});
