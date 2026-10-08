import type { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DrizzleModule } from "@nestjs/drizzle";
import { getHttpClientToken } from "@nestjs/http-client";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { JUSO_CLIENT } from "@/admin/address-search/address-search.service";
import { AdminModule } from "@/admin/admin.module";
import { configureApp } from "@/configure-app";
import { AppOrpcModule } from "@/orpc/orpc.module";

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

function createJusoResponse(juso: object[], errorCode = "0") {
  return { data: { results: { common: { errorCode, errorMessage: "" }, juso } } };
}

function createPlace(kakaoPlaceId: string) {
  return {
    kakaoPlaceId,
    roadAddress: "경기 성남시 분당구 야탑로 72",
  };
}

describe("POST /api/admin/address-lookups", () => {
  const jusoGet = vi.fn<(url: string, options?: object) => Promise<unknown>>();
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
        DrizzleModule.forRoot({ db: {}, autoCloseConnection: false }),
      ],
    })
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
    jusoGet.mockReset();
  });

  it("식당마다 행정안전부 주소와 WGS84 좌표를 찾아 응답한다", async () => {
    jusoGet.mockImplementation(async (url) =>
      url === "/addrlink/addrLinkApi.do"
        ? createJusoResponse([jusoAddress])
        : createJusoResponse([{ entX: "966975.1231662666", entY: "1934560.2263797005" }]),
    );

    const response = await request(app.getHttpServer())
      .post("/api/admin/address-lookups")
      .send({ places: [createPlace("17131878")] })
      .expect(200);

    expect(response.body).toEqual({
      results: [
        {
          kakaoPlaceId: "17131878",
          status: "found",
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
      ],
    });
  });

  it("주소를 찾지 못한 식당은 notFound 로 응답한다", async () => {
    jusoGet.mockResolvedValue(createJusoResponse([]));

    const response = await request(app.getHttpServer())
      .post("/api/admin/address-lookups")
      .send({ places: [createPlace("1")] })
      .expect(200);

    expect(response.body).toEqual({ results: [{ kakaoPlaceId: "1", status: "notFound" }] });
  });

  it("행정안전부 API 가 계속 E0007 로 응답하면 503 으로 응답한다", async () => {
    jusoGet.mockResolvedValue(createJusoResponse([], "E0007"));

    const response = await request(app.getHttpServer())
      .post("/api/admin/address-lookups")
      .send({ places: [createPlace("1")] });

    expect(response.status).toBe(503);
    expect(jusoGet).toHaveBeenCalledTimes(4);
  });

  it.each([
    ["식당이 없으면", { places: [] }],
    ["도로명 주소가 비어 있으면", { places: [{ kakaoPlaceId: "1", roadAddress: "" }] }],
    [
      "식당이 10곳을 넘으면",
      { places: Array.from({ length: 11 }, (_, index) => createPlace(String(index))) },
    ],
  ])("%s 행정안전부 API 를 호출하지 않고 400 으로 응답한다", async (_, body) => {
    await request(app.getHttpServer()).post("/api/admin/address-lookups").send(body).expect(400);

    expect(jusoGet).not.toHaveBeenCalled();
  });
});
