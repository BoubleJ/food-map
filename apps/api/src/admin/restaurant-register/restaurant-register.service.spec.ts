import { getDrizzleToken } from "@nestjs/drizzle";
import { Test } from "@nestjs/testing";
import { ORPCError } from "@orpc/nest";
import type { RestaurantRegisterInput } from "@food-map/shared/admin/restaurant-register";
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

describe("RestaurantRegisterService", () => {
  const insertValues = vi.fn<(values: { kakaoPlaceId: string }[]) => void>();
  const returnInserted = vi.fn<() => Promise<{ kakaoPlaceId: string | null }[]>>();
  let service: RestaurantRegisterService;

  beforeEach(async () => {
    vi.resetAllMocks();
    returnInserted.mockImplementation(async () =>
      (insertValues.mock.lastCall?.[0] ?? []).map(({ kakaoPlaceId }) => ({ kakaoPlaceId })),
    );
    const mockTransaction = {
      insert: () => ({
        values: (values: { kakaoPlaceId: string }[]) => {
          insertValues(values);
          return { onConflictDoNothing: () => ({ returning: returnInserted }) };
        },
      }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        RestaurantRegisterService,
        {
          provide: getDrizzleToken(),
          useValue: {
            transaction: (callback: (transaction: typeof mockTransaction) => Promise<unknown>) =>
              callback(mockTransaction),
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

  it("이미 등록되어 저장되지 않은 식당이 있으면 그 카카오 장소 ID 를 담아 CONFLICT 로 던진다", async () => {
    returnInserted.mockResolvedValue([{ kakaoPlaceId: "1" }]);

    const error = await service
      .register(createInput([createRestaurant("1"), createRestaurant("2")]))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ORPCError);
    expect(error).toMatchObject({ code: "CONFLICT", data: { kakaoPlaceIds: ["2"] } });
  });

  it("다른 저장 오류는 그대로 던진다", async () => {
    const failure = new Error("connection closed");
    returnInserted.mockRejectedValue(failure);

    await expect(service.register(createInput([createRestaurant("1")]))).rejects.toBe(failure);
  });
});
