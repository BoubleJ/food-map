import type { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DrizzleModule } from "@nestjs/drizzle";
import { getHttpClientToken, HttpResponseError } from "@nestjs/http-client";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { JUSO_CLIENT } from "@/admin/address-search/address-search.service";
import { AdminModule } from "@/admin/admin.module";
import { KAKAO_LOCAL_CLIENT } from "@/admin/place-search/place-search.service";
import { configureApp } from "@/configure-app";
import { AppOrpcModule } from "@/orpc/orpc.module";

interface KakaoSearchQuery {
  page: number;
}

interface KakaoSearchOptions {
  query: KakaoSearchQuery;
}

const kakaoPlace = {
  id: "17131878",
  place_name: "수타우동겐 본점",
  category_group_code: "FD6",
  category_name: "음식점 > 일식 > 우동,소바",
  road_address_name: "경기 성남시 분당구 야탑로 72",
  address_name: "경기 성남시 분당구 야탑동 503",
  place_url: "http://place.map.kakao.com/17131878",
  x: "127.126824",
  y: "37.409579",
};

function createKakaoResponse(
  documents: object[],
  { totalCount = documents.length, isEnd = true }: { totalCount?: number; isEnd?: boolean } = {},
) {
  return {
    data: {
      meta: { total_count: totalCount, pageable_count: totalCount, is_end: isEnd },
      documents,
    },
  };
}

describe("GET /api/admin/restaurant-search", () => {
  const kakaoGet = vi.fn<(url: string, options?: object) => Promise<unknown>>();
  const jusoGet = vi.fn<(url: string, options?: object) => Promise<unknown>>();
  const findRegistered = vi.fn<() => Promise<{ kakaoPlaceId: string | null }[]>>();
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              KAKAO_REST_API_KEY: "kakao-key",
              JUSO_SEARCH_API_KEY: "search-key",
              JUSO_COORD_API_KEY: "coord-key",
            }),
          ],
        }),
        AppOrpcModule,
        AdminModule,
        DrizzleModule.forRoot({
          db: { select: () => ({ from: () => ({ where: findRegistered }) }) },
          autoCloseConnection: false,
        }),
      ],
    })
      .overrideProvider(getHttpClientToken(KAKAO_LOCAL_CLIENT))
      .useValue({ get: kakaoGet })
      .overrideProvider(getHttpClientToken(JUSO_CLIENT))
      .useValue({ get: jusoGet })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    kakaoGet.mockReset();
    jusoGet.mockReset();
    findRegistered.mockReset();
    findRegistered.mockResolvedValue([]);
  });

  it("카카오 장소를 검색하고 카카오 좌표와 등록 여부를 붙여 15곳씩 응답한다", async () => {
    kakaoGet.mockResolvedValue(createKakaoResponse([kakaoPlace]));

    const response = await request(app.getHttpServer())
      .get("/api/admin/restaurant-search")
      .query({ keyword: "수타우동겐", page: 1 })
      .expect(200);

    expect(response.body).toEqual({
      restaurants: [
        {
          kakaoPlaceId: "17131878",
          name: "수타우동겐 본점",
          categoryName: "음식점 > 일식 > 우동,소바",
          placeUrl: "http://place.map.kakao.com/17131878",
          roadAddress: "경기 성남시 분당구 야탑로 72",
          coordinate: { latitude: 37.409579, longitude: 127.126824 },
          isRegistered: false,
        },
      ],
      hasNext: false,
    });
    expect(kakaoGet).toHaveBeenCalledWith("/v2/local/search/keyword.json", {
      query: { query: "수타우동겐", size: 15, page: 1 },
    });
    expect(jusoGet).not.toHaveBeenCalled();
  });

  it("DB 에 같은 카카오 장소 ID 로 등록된 식당이 있으면 isRegistered 를 true 로 응답한다", async () => {
    kakaoGet.mockResolvedValue(createKakaoResponse([kakaoPlace]));
    findRegistered.mockResolvedValue([{ kakaoPlaceId: "17131878" }]);

    const response = await request(app.getHttpServer())
      .get("/api/admin/restaurant-search")
      .query({ keyword: "수타우동겐", page: 1 })
      .expect(200);

    expect(response.body.restaurants).toEqual([expect.objectContaining({ isRegistered: true })]);
  });

  it("쿼리스트링의 page 를 숫자로 받아 해당 페이지를 응답한다", async () => {
    kakaoGet.mockImplementation(async (_, options) => {
      const { query } = options as KakaoSearchOptions;
      return createKakaoResponse(
        Array.from({ length: 15 }, (_, index) => ({
          ...kakaoPlace,
          id: `${query.page}-${index}`,
        })),
        { totalCount: 20, isEnd: query.page === 2 },
      );
    });

    await request(app.getHttpServer())
      .get("/api/admin/restaurant-search")
      .query({ keyword: "브런치빈", page: 1 })
      .expect(200);
    const response = await request(app.getHttpServer())
      .get("/api/admin/restaurant-search")
      .query({ keyword: "브런치빈", page: "2" })
      .expect(200);

    expect(response.body.restaurants[0].kakaoPlaceId).toBe("2-0");
    expect(response.body.hasNext).toBe(false);
  });

  it("카카오 검색이 실패 응답을 주면 502 로 응답한다", async () => {
    kakaoGet.mockRejectedValue(
      new HttpResponseError({ method: "GET", url: "/v2/local/search/keyword.json", status: 401 }),
    );

    const response = await request(app.getHttpServer())
      .get("/api/admin/restaurant-search")
      .query({ keyword: "수타우동겐", page: 1 });

    expect(response.status).toBe(502);
  });

  it.each([
    ["검색어가 없으면", { page: 1 }],
    ["검색어가 비어 있으면", { keyword: "", page: 1 }],
    ["검색어가 40자를 넘으면", { keyword: "가".repeat(41), page: 1 }],
    ["page 가 없으면", { keyword: "수타우동겐" }],
    ["page 가 0 이면", { keyword: "수타우동겐", page: 0 }],
    ["page 가 숫자가 아니면", { keyword: "수타우동겐", page: "abc" }],
  ])("%s 카카오를 호출하지 않고 400 으로 응답한다", async (_, query) => {
    await request(app.getHttpServer()).get("/api/admin/restaurant-search").query(query).expect(400);

    expect(kakaoGet).not.toHaveBeenCalled();
  });
});
