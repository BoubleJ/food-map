import { BadGatewayException, ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddressLookupService } from "@/admin/address-lookup/address-lookup.service";
import { AddressSearchService } from "@/admin/address-search/address-search.service";

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
    roadAddress: "경기 성남시 분당구 야탑로 72",
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

describe("AddressLookupService", () => {
  const searchAddress = vi.fn<AddressSearchService["search"]>();
  const findCoordinate = vi.fn<AddressSearchService["findCoordinate"]>();
  let service: AddressLookupService;

  beforeEach(async () => {
    vi.resetAllMocks();
    findCoordinate.mockResolvedValue({ longitude: 127.12682, latitude: 37.40958 });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AddressLookupService,
        { provide: AddressSearchService, useValue: { search: searchAddress, findCoordinate } },
      ],
    }).compile();
    service = moduleRef.get(AddressLookupService);
  });

  it("카카오 도로명 주소로 행정안전부 주소와 좌표를 찾아 돌려준다", async () => {
    searchAddress.mockResolvedValue([createAddress({})]);

    await expect(service.lookup([createPlace({})])).resolves.toEqual({
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
            longitude: 127.12682,
            latitude: 37.40958,
          },
        },
      ],
    });
    expect(searchAddress).toHaveBeenCalledWith("경기 성남시 분당구 야탑로 72");
    expect(findCoordinate).toHaveBeenCalledWith(coordinateQuery);
  });

  it("주소 검색 결과가 여러 개면 시도를 뺀 도로명 주소가 카카오 주소와 같은 결과를 고른다", async () => {
    searchAddress.mockResolvedValue([
      createAddress({
        roadAddress: "경기도 성남시 분당구 야탑로 72-1",
        regionEupmyeondong: "다른동",
      }),
      createAddress({}),
    ]);

    const { results } = await service.lookup([createPlace({})]);

    expect(results[0]).toMatchObject({ address: { regionEupmyeondong: "야탑동" } });
  });

  it("주소 검색 결과가 하나뿐이면 주소가 달라도 그 결과를 쓴다", async () => {
    searchAddress.mockResolvedValue([
      createAddress({ roadAddress: "경기도 성남시 분당구 야탑로72" }),
    ]);

    const { results } = await service.lookup([createPlace({})]);

    expect(results[0]).toMatchObject({ address: { roadAddress: "경기도 성남시 분당구 야탑로72" } });
  });

  it("일치하는 주소가 없고 후보가 여러 개면 좌표를 조회하지 않고 notFound 로 돌려준다", async () => {
    searchAddress.mockResolvedValue([
      createAddress({ roadAddress: "경기도 성남시 분당구 야탑로 70" }),
      createAddress({ roadAddress: "경기도 성남시 분당구 야탑로 74" }),
    ]);

    const { results } = await service.lookup([createPlace({})]);

    expect(results).toEqual([{ kakaoPlaceId: "17131878", status: "notFound" }]);
    expect(findCoordinate).not.toHaveBeenCalled();
  });

  it("주소 검색 결과가 없으면 notFound 로 돌려준다", async () => {
    searchAddress.mockResolvedValue([]);

    const { results } = await service.lookup([createPlace({})]);

    expect(results).toEqual([{ kakaoPlaceId: "17131878", status: "notFound" }]);
  });

  it("좌표를 찾지 못하면 notFound 로 돌려준다", async () => {
    searchAddress.mockResolvedValue([createAddress({})]);
    findCoordinate.mockResolvedValue(null);

    const { results } = await service.lookup([createPlace({})]);

    expect(results).toEqual([{ kakaoPlaceId: "17131878", status: "notFound" }]);
  });

  it("여러 식당을 순서대로 조회하고 한 곳을 찾지 못해도 나머지 결과를 돌려준다", async () => {
    const order: string[] = [];
    searchAddress.mockImplementation(async (keyword) => {
      order.push(keyword);
      return keyword.includes("서초")
        ? [createAddress({ roadAddress: "서울특별시 서초구 서초대로77길 7" })]
        : [];
    });

    const { results } = await service.lookup([
      createPlace({ kakaoPlaceId: "1", roadAddress: "서울 서초구 서초대로77길 7" }),
      createPlace({ kakaoPlaceId: "2", roadAddress: "서울 마포구 양화로 188" }),
    ]);

    expect(order).toEqual(["서울 서초구 서초대로77길 7", "서울 마포구 양화로 188"]);
    expect(results.map(({ kakaoPlaceId, status }) => [kakaoPlaceId, status])).toEqual([
      ["1", "found"],
      ["2", "notFound"],
    ]);
  });

  it.each([
    ["502", new BadGatewayException("주소 검색에 실패했습니다.")],
    ["503", new ServiceUnavailableException("주소 조회 요청이 많습니다.")],
  ])("행정안전부 API 오류(%s)는 그대로 전달한다", async (_, exception) => {
    searchAddress.mockRejectedValue(exception);

    await expect(service.lookup([createPlace({})])).rejects.toBe(exception);
  });
});
