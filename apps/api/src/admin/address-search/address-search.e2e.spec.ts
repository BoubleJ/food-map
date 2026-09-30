import type { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { getHttpClientToken } from "@nestjs/http-client";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { JUSO_CLIENT } from "@/admin/address-search/address-search.service";
import { AdminModule } from "@/admin/admin.module";
import { configureApp } from "@/configure-app";

const coordinateQuery = {
  admCd: "4113510700",
  rnMgtSn: "411353180041",
  udrtYn: "0",
  buldMnnm: "72",
  buldSlno: "0",
};

function createCoordinateResponse(errorCode: string, juso: { entX: string; entY: string }[]) {
  return { data: { results: { common: { errorCode, errorMessage: "안내 문구" }, juso } } };
}

describe("GET /api/admin/address-search/coordinate", () => {
  const get = vi.fn<(url: string, options?: object) => Promise<unknown>>();
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
        AdminModule,
      ],
    })
      .overrideProvider(getHttpClientToken(JUSO_CLIENT))
      .useValue({ get })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    get.mockReset();
  });

  it("좌표제공 API 에 좌표 조회 키와 쿼리스트링을 보내고 WGS84 경도와 위도로 응답한다", async () => {
    get.mockResolvedValue(
      createCoordinateResponse("0", [{ entX: "966975.1231662666", entY: "1934560.2263797005" }]),
    );

    const response = await request(app.getHttpServer())
      .get("/api/admin/address-search/coordinate")
      .query(coordinateQuery)
      .expect(200);

    expect(get).toHaveBeenCalledWith("/addrlink/addrCoordApi.do", {
      query: { confmKey: "coord-key", ...coordinateQuery, resultType: "json" },
    });
    expect(response.body.longitude).toBeCloseTo(127.126824, 6);
    expect(response.body.latitude).toBeCloseTo(37.409579, 6);
  });

  it.each([
    ["admCd 가 10자리 숫자가 아니면", { admCd: "411351070" }],
    ["rnMgtSn 이 12자리 숫자가 아니면", { rnMgtSn: "41135318004a" }],
    ["udrtYn 이 0 이나 1 이 아니면", { udrtYn: "2" }],
    ["buldMnnm 이 비어 있으면", { buldMnnm: "" }],
  ])("%s 좌표제공 API 를 호출하지 않고 400 으로 응답한다", async (_, invalid) => {
    await request(app.getHttpServer())
      .get("/api/admin/address-search/coordinate")
      .query({ ...coordinateQuery, ...invalid })
      .expect(400);

    expect(get).not.toHaveBeenCalled();
  });

  it("쿼리스트링에 없는 값을 보내면 좌표제공 API 로 넘기지 않는다", async () => {
    get.mockResolvedValue(
      createCoordinateResponse("0", [{ entX: "966975.1231662666", entY: "1934560.2263797005" }]),
    );

    await request(app.getHttpServer())
      .get("/api/admin/address-search/coordinate")
      .query({ ...coordinateQuery, confmKey: "other-key" })
      .expect(200);

    expect(get).toHaveBeenCalledWith("/addrlink/addrCoordApi.do", {
      query: { confmKey: "coord-key", ...coordinateQuery, resultType: "json" },
    });
  });

  it("좌표 결과가 없으면 404 로 응답한다", async () => {
    get.mockResolvedValue(createCoordinateResponse("0", []));

    const response = await request(app.getHttpServer())
      .get("/api/admin/address-search/coordinate")
      .query(coordinateQuery)
      .expect(404);

    expect(response.body.message).toBe("주소의 좌표를 찾을 수 없습니다.");
  });

  it("좌표제공 API 서비스 문제 코드는 좌표 조회 실패 문구와 함께 502 로 응답한다", async () => {
    get.mockResolvedValue(createCoordinateResponse("E0001", []));

    const response = await request(app.getHttpServer())
      .get("/api/admin/address-search/coordinate")
      .query(coordinateQuery)
      .expect(502);

    expect(response.body.message).toBe("주소 좌표 조회에 실패했습니다.");
  });
});
