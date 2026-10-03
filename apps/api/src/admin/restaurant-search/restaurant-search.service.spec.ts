import { BadGatewayException, NotFoundException } from "@nestjs/common";
import { getDrizzleToken } from "@nestjs/drizzle";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddressSearchService } from "@/admin/address-search/address-search.service";
import { PlaceSearchService } from "@/admin/place-search/place-search.service";
import { RestaurantSearchService } from "@/admin/restaurant-search/restaurant-search.service";

const coordinateQuery = {
  admCd: "4113510700",
  rnMgtSn: "411353180041",
  udrtYn: "0",
  buldMnnm: "72",
  buldSlno: "0",
};

function createPlace(overrides: Record<string, string>) {
  return {
    kakaoPlaceId: "17131878",
    name: "수타우동겐 본점",
    categoryName: "음식점 > 일식 > 우동,소바",
    roadAddress: "경기 성남시 분당구 야탑로 72",
    jibunAddress: "경기 성남시 분당구 야탑동 503",
    placeUrl: "http://place.map.kakao.com/17131878",
    ...overrides,
  };
}

function createAddress(overrides: Record<string, string>) {
  return {
    roadAddress: "경기도 성남시 분당구 야탑로 72",
    jibunAddress: "경기도 성남시 분당구 야탑동 503",
    regionSido: "경기도",
    regionSigungu: "성남시 분당구",
    regionEupmyeondong: "야탑동",
    coordinateQuery,
    ...overrides,
  };
}

describe("RestaurantSearchService", () => {
  const searchPlace = vi.fn<PlaceSearchService["search"]>();
  const searchAddress = vi.fn<AddressSearchService["search"]>();
  const findCoordinate = vi.fn<AddressSearchService["findCoordinate"]>();
  const findRegistered = vi.fn<() => Promise<{ kakaoPlaceId: string | null }[]>>();
  let service: RestaurantSearchService;

  beforeEach(async () => {
    vi.resetAllMocks();
    findCoordinate.mockResolvedValue({ longitude: 127.12682, latitude: 37.40958 });
    findRegistered.mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        RestaurantSearchService,
        { provide: PlaceSearchService, useValue: { search: searchPlace } },
        { provide: AddressSearchService, useValue: { search: searchAddress, findCoordinate } },
        {
          provide: getDrizzleToken(),
          useValue: { select: () => ({ from: () => ({ where: findRegistered }) }) },
        },
      ],
    }).compile();
    service = moduleRef.get(RestaurantSearchService);
  });

  it("카카오 장소에 행정안전부 주소와 좌표, 등록 여부를 합쳐 돌려준다", async () => {
    searchPlace.mockResolvedValue([createPlace({})]);
    searchAddress.mockResolvedValue([createAddress({})]);

    await expect(service.search("수타우동겐")).resolves.toEqual([
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
          longitude: 127.12682,
          latitude: 37.40958,
        },
      },
    ]);
    expect(searchAddress).toHaveBeenCalledWith("경기 성남시 분당구 야탑로 72");
    expect(findCoordinate).toHaveBeenCalledWith(coordinateQuery);
  });

  it("카카오 장소에 도로명 주소가 없으면 지번 주소로 주소를 검색한다", async () => {
    searchPlace.mockResolvedValue([createPlace({ roadAddress: "" })]);
    searchAddress.mockResolvedValue([createAddress({})]);

    await service.search("수타우동겐");

    expect(searchAddress).toHaveBeenCalledWith("경기 성남시 분당구 야탑동 503");
  });

  it("카카오 장소에 도로명 주소와 지번 주소가 모두 없으면 주소를 검색하지 않고 address 를 null 로 돌려준다", async () => {
    searchPlace.mockResolvedValue([createPlace({ roadAddress: "", jibunAddress: "" })]);

    const [restaurant] = await service.search("수타우동겐");

    expect(restaurant?.address).toBeNull();
    expect(searchAddress).not.toHaveBeenCalled();
  });

  it("주소 검색 결과가 여러 개면 시도를 뺀 도로명 주소가 카카오 주소와 같은 결과를 고른다", async () => {
    searchPlace.mockResolvedValue([createPlace({})]);
    searchAddress.mockResolvedValue([
      createAddress({
        roadAddress: "경기도 성남시 분당구 야탑로 72-1",
        regionEupmyeondong: "다른동",
      }),
      createAddress({}),
    ]);

    const [restaurant] = await service.search("수타우동겐");

    expect(restaurant?.address?.regionEupmyeondong).toBe("야탑동");
  });

  it("지번 주소로 검색했을 때는 시도를 뺀 지번 주소가 같은 결과를 고른다", async () => {
    searchPlace.mockResolvedValue([createPlace({ roadAddress: "" })]);
    searchAddress.mockResolvedValue([
      createAddress({
        jibunAddress: "경기도 성남시 분당구 야탑동 503-1",
        regionEupmyeondong: "다른동",
      }),
      createAddress({}),
    ]);

    const [restaurant] = await service.search("수타우동겐");

    expect(restaurant?.address?.regionEupmyeondong).toBe("야탑동");
  });

  it("주소 검색 결과가 하나뿐이면 주소가 달라도 그 결과를 쓴다", async () => {
    searchPlace.mockResolvedValue([createPlace({})]);
    searchAddress.mockResolvedValue([
      createAddress({ roadAddress: "경기도 성남시 분당구 야탑로72" }),
    ]);

    const [restaurant] = await service.search("수타우동겐");

    expect(restaurant?.address?.roadAddress).toBe("경기도 성남시 분당구 야탑로72");
  });

  it("맞는 주소를 찾지 못하면 좌표를 조회하지 않고 address 를 null 로 돌려준다", async () => {
    searchPlace.mockResolvedValue([createPlace({})]);
    searchAddress.mockResolvedValue([
      createAddress({ roadAddress: "경기도 성남시 분당구 야탑로 70" }),
      createAddress({ roadAddress: "경기도 성남시 분당구 야탑로 74" }),
    ]);

    const [restaurant] = await service.search("수타우동겐");

    expect(restaurant?.address).toBeNull();
    expect(findCoordinate).not.toHaveBeenCalled();
  });

  it("주소 검색 결과가 없으면 address 를 null 로 돌려준다", async () => {
    searchPlace.mockResolvedValue([createPlace({})]);
    searchAddress.mockResolvedValue([]);

    const [restaurant] = await service.search("수타우동겐");

    expect(restaurant?.address).toBeNull();
  });

  it("좌표를 찾지 못하면 address 를 null 로 돌려준다", async () => {
    searchPlace.mockResolvedValue([createPlace({})]);
    searchAddress.mockResolvedValue([createAddress({})]);
    findCoordinate.mockRejectedValue(new NotFoundException());

    const [restaurant] = await service.search("수타우동겐");

    expect(restaurant?.address).toBeNull();
  });

  it("여러 장소의 주소를 각각 조회해 카카오 결과 순서대로 돌려준다", async () => {
    searchPlace.mockResolvedValue([
      createPlace({ kakaoPlaceId: "1", roadAddress: "서울 서초구 서초대로77길 7" }),
      createPlace({ kakaoPlaceId: "2", roadAddress: "서울 마포구 양화로 188" }),
    ]);
    searchAddress.mockImplementation(async (keyword: string) =>
      keyword.includes("서초")
        ? [createAddress({ roadAddress: "서울특별시 서초구 서초대로77길 7" })]
        : [createAddress({ roadAddress: "서울특별시 마포구 양화로 188" })],
    );

    const restaurants = await service.search("고에몬");

    expect(
      restaurants.map(({ kakaoPlaceId, address }) => [kakaoPlaceId, address?.roadAddress]),
    ).toEqual([
      ["1", "서울특별시 서초구 서초대로77길 7"],
      ["2", "서울특별시 마포구 양화로 188"],
    ]);
  });

  it("DB 에 같은 카카오 장소 ID 로 등록된 식당이 있으면 isRegistered 를 true 로 돌려준다", async () => {
    searchPlace.mockResolvedValue([
      createPlace({ kakaoPlaceId: "1" }),
      createPlace({ kakaoPlaceId: "2" }),
    ]);
    searchAddress.mockResolvedValue([createAddress({})]);
    findRegistered.mockResolvedValue([{ kakaoPlaceId: "2" }]);

    const restaurants = await service.search("수타우동겐");

    expect(
      restaurants.map(({ kakaoPlaceId, isRegistered }) => [kakaoPlaceId, isRegistered]),
    ).toEqual([
      ["1", false],
      ["2", true],
    ]);
  });

  it("남은 카카오 장소가 없으면 주소와 등록 여부를 조회하지 않고 빈 배열을 돌려준다", async () => {
    searchPlace.mockResolvedValue([]);

    await expect(service.search("주원초밥")).resolves.toEqual([]);
    expect(searchAddress).not.toHaveBeenCalled();
    expect(findRegistered).not.toHaveBeenCalled();
  });

  it("행정안전부 서비스 오류는 그대로 502 로 전달한다", async () => {
    searchPlace.mockResolvedValue([createPlace({})]);
    searchAddress.mockRejectedValue(new BadGatewayException("주소 검색에 실패했습니다."));

    await expect(service.search("수타우동겐")).rejects.toBeInstanceOf(BadGatewayException);
  });
});
