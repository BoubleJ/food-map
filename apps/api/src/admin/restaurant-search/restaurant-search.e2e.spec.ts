import type { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DrizzleModule } from "@nestjs/drizzle";
import { getHttpClientToken } from "@nestjs/http-client";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { JUSO_CLIENT } from "@/admin/address-search/address-search.service";
import { AdminModule } from "@/admin/admin.module";
import { KAKAO_LOCAL_CLIENT } from "@/admin/place-search/place-search.service";
import { configureApp } from "@/configure-app";
import { AppOrpcModule } from "@/orpc/orpc.module";

const kakaoPlace = {
  id: "17131878",
  place_name: "수타우동겐 본점",
  category_group_code: "FD6",
  category_name: "음식점 > 일식 > 우동,소바",
  road_address_name: "경기 성남시 분당구 야탑로 72",
  address_name: "경기 성남시 분당구 야탑동 503",
  place_url: "http://place.map.kakao.com/17131878",
};

const jusoAddress = {
  roadAddrPart1: "경기도 성남시 분당구 야탑로 72",
  jibunAddr: "경기도 성남시 분당구 야탑동 503 야탑시장주차장",
  siNm: "경기도",
  sggNm: "성남시 분당구",
  emdNm: "야탑동",
  bdNm: "야탑시장주차장",
  admCd: "4113510700",
  rnMgtSn: "411353180041",
  udrtYn: "0",
  buldMnnm: "72",
  buldSlno: "0",
};

function createJusoResponse(juso: object[]) {
  return { data: { results: { common: { errorCode: "0", errorMessage: "정상" }, juso } } };
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

  it("카카오 장소를 검색하고 행정안전부 주소와 WGS84 좌표를 합쳐 응답한다", async () => {
    kakaoGet.mockResolvedValue({ data: { documents: [kakaoPlace] } });
    jusoGet.mockImplementation(async (url) =>
      url === "/addrlink/addrLinkApi.do"
        ? createJusoResponse([jusoAddress])
        : createJusoResponse([{ entX: "966975.1231662666", entY: "1934560.2263797005" }]),
    );

    const response = await request(app.getHttpServer())
      .get("/api/admin/restaurant-search")
      .query({ keyword: "수타우동겐" })
      .expect(200);

    expect(response.body).toEqual([
      {
        kakaoPlaceId: "17131878",
        name: "수타우동겐 본점",
        categoryName: "음식점 > 일식 > 우동,소바",
        placeUrl: "http://place.map.kakao.com/17131878",
        isRegistered: false,
        address: {
          roadAddress: "경기도 성남시 분당구 야탑로 72",
          jibunAddress: "경기도 성남시 분당구 야탑동 503",
          regionSido: "경기도",
          regionSigungu: "성남시 분당구",
          regionEupmyeondong: "야탑동",
          longitude: expect.closeTo(127.126824, 6),
          latitude: expect.closeTo(37.409579, 6),
        },
      },
    ]);
    expect(kakaoGet).toHaveBeenCalledWith("/v2/local/search/keyword.json", {
      query: { query: "수타우동겐", size: 15 },
    });
    expect(jusoGet).toHaveBeenCalledWith(
      "/addrlink/addrLinkApi.do",
      expect.objectContaining({
        query: expect.objectContaining({ keyword: "경기 성남시 분당구 야탑로 72" }),
      }),
    );
  });

  it("DB 에 같은 카카오 장소 ID 로 등록된 식당이 있으면 isRegistered 를 true 로 응답한다", async () => {
    kakaoGet.mockResolvedValue({ data: { documents: [kakaoPlace] } });
    jusoGet.mockResolvedValue(createJusoResponse([]));
    findRegistered.mockResolvedValue([{ kakaoPlaceId: "17131878" }]);

    const response = await request(app.getHttpServer())
      .get("/api/admin/restaurant-search")
      .query({ keyword: "수타우동겐" })
      .expect(200);

    expect(response.body).toEqual([expect.objectContaining({ isRegistered: true })]);
  });

  it("이름이 검색어를 포함하는 장소가 없으면 주소를 검색하지 않고 빈 배열로 응답한다", async () => {
    kakaoGet.mockResolvedValue({
      data: { documents: [{ ...kakaoPlace, place_name: "밀밭칼국수 본점" }] },
    });

    await request(app.getHttpServer())
      .get("/api/admin/restaurant-search")
      .query({ keyword: "주원초밥" })
      .expect(200, []);

    expect(jusoGet).not.toHaveBeenCalled();
  });

  it("행정안전부 주소 검색이 서비스 오류를 응답하면 502 로 응답한다", async () => {
    kakaoGet.mockResolvedValue({ data: { documents: [kakaoPlace] } });
    jusoGet.mockResolvedValue({
      data: { results: { common: { errorCode: "-999", errorMessage: "시스템에러" }, juso: null } },
    });

    const response = await request(app.getHttpServer())
      .get("/api/admin/restaurant-search")
      .query({ keyword: "수타우동겐" });

    expect(response.status).toBe(502);
  });

  it.each([
    ["검색어가 없으면", {}],
    ["검색어가 비어 있으면", { keyword: "" }],
    ["검색어가 40자를 넘으면", { keyword: "가".repeat(41) }],
  ])("%s 카카오를 호출하지 않고 400 으로 응답한다", async (_, query) => {
    await request(app.getHttpServer()).get("/api/admin/restaurant-search").query(query).expect(400);

    expect(kakaoGet).not.toHaveBeenCalled();
  });
});
