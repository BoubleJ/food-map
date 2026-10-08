import type { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DrizzleModule } from "@nestjs/drizzle";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminModule } from "@/admin/admin.module";
import { configureApp } from "@/configure-app";
import { AppOrpcModule } from "@/orpc/orpc.module";

function createRestaurant(kakaoPlaceId: string) {
  return {
    kakaoPlaceId,
    name: "수타우동겐 본점",
    placeUrl: `http://place.map.kakao.com/${kakaoPlaceId}`,
    address: {
      roadAddress: "경기도 성남시 분당구 야탑로 72",
      jibunAddress: "경기도 성남시 분당구 야탑동 503",
      regionSido: "경기도",
      regionSigungu: "성남시 분당구",
      regionEupmyeondong: "야탑동",
      latitude: 37.409579,
      longitude: 127.126824,
    },
  };
}

function createBody(overrides: object = {}) {
  return {
    common: { categories: ["japanese"], isVisible: true },
    restaurants: [createRestaurant("1")],
    ...overrides,
  };
}

describe("POST /api/admin/restaurants", () => {
  const insertValues = vi.fn<(values: { kakaoPlaceId: string }[]) => void>();
  const returnInserted = vi.fn<() => Promise<{ kakaoPlaceId: string | null }[]>>();
  let app: INestApplication;

  beforeAll(async () => {
    const mockTransaction = {
      insert: () => ({
        values: (values: { kakaoPlaceId: string }[]) => {
          insertValues(values);
          return { onConflictDoNothing: () => ({ returning: returnInserted }) };
        },
      }),
    };
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
          db: {
            transaction: (callback: (transaction: typeof mockTransaction) => Promise<unknown>) =>
              callback(mockTransaction),
          },
          autoCloseConnection: false,
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    insertValues.mockReset();
    returnInserted.mockReset();
    returnInserted.mockImplementation(async () =>
      (insertValues.mock.lastCall?.[0] ?? []).map(({ kakaoPlaceId }) => ({ kakaoPlaceId })),
    );
  });

  it("식당을 저장하고 201 과 등록한 카카오 장소 ID 로 응답한다", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/admin/restaurants")
      .send(createBody({ restaurants: [createRestaurant("1"), createRestaurant("2")] }))
      .expect(201);

    expect(response.body).toEqual({ registeredPlaceIds: ["1", "2"] });
    expect(insertValues).toHaveBeenCalledTimes(1);
  });

  it("이미 등록된 식당이 있으면 409 와 그 카카오 장소 ID 를 oRPC 에러 형식으로 응답한다", async () => {
    returnInserted.mockResolvedValue([{ kakaoPlaceId: "2" }]);

    const response = await request(app.getHttpServer())
      .post("/api/admin/restaurants")
      .send(createBody({ restaurants: [createRestaurant("1"), createRestaurant("2")] }))
      .expect(409);

    expect(response.body).toEqual({
      defined: true,
      code: "CONFLICT",
      status: 409,
      message: "이미 등록된 식당이 있습니다.",
      data: { kakaoPlaceIds: ["1"] },
    });
  });

  it.each([
    ["카테고리가 비어 있으면", createBody({ common: { categories: [], isVisible: true } })],
    ["없는 카테고리면", createBody({ common: { categories: ["pizza"], isVisible: true } })],
    ["식당이 없으면", createBody({ restaurants: [] })],
    [
      "식당이 10곳을 넘으면",
      createBody({
        restaurants: Array.from({ length: 11 }, (_, index) => createRestaurant(String(index))),
      }),
    ],
    [
      "같은 식당이 두 번 들어 있으면",
      createBody({ restaurants: [createRestaurant("1"), createRestaurant("1")] }),
    ],
    [
      "가맹점 이름이 빈 문자열이면",
      createBody({ restaurants: [{ ...createRestaurant("1"), franchiseName: " " }] }),
    ],
  ])("%s 저장하지 않고 400 으로 응답한다", async (_, body) => {
    await request(app.getHttpServer()).post("/api/admin/restaurants").send(body).expect(400);

    expect(insertValues).not.toHaveBeenCalled();
  });
});
