import { getDrizzleToken } from "@nestjs/drizzle";
import { Test } from "@nestjs/testing";
import { ORPCError } from "@orpc/nest";
import type { RestaurantRegisterInput } from "@food-map/shared/admin/restaurant-register";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RestaurantRegisterService } from "@/admin/restaurant-register/restaurant-register.service";

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

function createInput(restaurants: RestaurantRegisterInput["restaurants"]): RestaurantRegisterInput {
  return { common: { categories: ["japanese", "udon"], isVisible: true }, restaurants };
}

function createUniqueViolation() {
  return new DrizzleQueryError(
    "insert into restaurants",
    [],
    Object.assign(new Error("duplicate key"), { code: "23505" }),
  );
}

describe("RestaurantRegisterService", () => {
  const findRegisteredInTransaction = vi.fn<() => Promise<{ kakaoPlaceId: string | null }[]>>();
  const findRegistered = vi.fn<() => Promise<{ kakaoPlaceId: string | null }[]>>();
  const insertValues = vi.fn<(values: object[]) => Promise<void>>();
  let service: RestaurantRegisterService;

  beforeEach(async () => {
    vi.resetAllMocks();
    findRegisteredInTransaction.mockResolvedValue([]);
    findRegistered.mockResolvedValue([]);
    insertValues.mockResolvedValue();
    const transaction = {
      select: () => ({ from: () => ({ where: findRegisteredInTransaction }) }),
      insert: () => ({ values: insertValues }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        RestaurantRegisterService,
        {
          provide: getDrizzleToken(),
          useValue: {
            transaction: (callback: (tx: typeof transaction) => Promise<unknown>) =>
              callback(transaction),
            select: () => ({ from: () => ({ where: findRegistered }) }),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(RestaurantRegisterService);
  });

  it("식당마다 공통 입력과 주소 조회 결과를 합쳐 저장하고 등록한 카카오 장소 ID 를 돌려준다", async () => {
    const input = createInput([
      { ...createRestaurant("1"), description: "우동 맛집", franchiseName: "수타우동겐" },
      createRestaurant("2"),
    ]);

    await expect(service.register(input)).resolves.toEqual({ registeredPlaceIds: ["1", "2"] });
    expect(insertValues).toHaveBeenCalledWith([
      {
        name: "수타우동겐 본점",
        categories: ["japanese", "udon"],
        description: "우동 맛집",
        roadAddress: "경기도 성남시 분당구 야탑로 72",
        jibunAddress: "경기도 성남시 분당구 야탑동 503",
        regionSido: "경기도",
        regionSigungu: "성남시 분당구",
        regionEupmyeondong: "야탑동",
        location: { x: 127.126824, y: 37.409579 },
        kakaoPlaceId: "1",
        kakaoPlaceUrl: "http://place.map.kakao.com/1",
        franchiseName: "수타우동겐",
        isVisible: true,
      },
      expect.objectContaining({
        kakaoPlaceId: "2",
        description: undefined,
        franchiseName: undefined,
      }),
    ]);
  });

  it("이미 등록된 식당이 있으면 저장하지 않고 그 카카오 장소 ID 를 담아 CONFLICT 로 던진다", async () => {
    findRegisteredInTransaction.mockResolvedValue([{ kakaoPlaceId: "2" }]);

    const error = await service
      .register(createInput([createRestaurant("1"), createRestaurant("2")]))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ORPCError);
    expect(error).toMatchObject({ code: "CONFLICT", data: { kakaoPlaceIds: ["2"] } });
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("저장 중 같은 카카오 장소 ID 가 먼저 저장되면 다시 조회한 카카오 장소 ID 를 담아 CONFLICT 로 던진다", async () => {
    insertValues.mockRejectedValue(createUniqueViolation());
    findRegistered.mockResolvedValue([{ kakaoPlaceId: "1" }]);

    const error = await service
      .register(createInput([createRestaurant("1"), createRestaurant("2")]))
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: "CONFLICT", data: { kakaoPlaceIds: ["1"] } });
  });

  it("다른 저장 오류는 그대로 던진다", async () => {
    const failure = new Error("connection closed");
    insertValues.mockRejectedValue(failure);

    await expect(service.register(createInput([createRestaurant("1")]))).rejects.toBe(failure);
  });
});
