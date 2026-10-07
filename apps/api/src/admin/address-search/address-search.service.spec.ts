import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getHttpClientToken } from "@nestjs/http-client";
import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddressSearchService, JUSO_CLIENT } from "@/admin/address-search/address-search.service";

function createJusoResponse(errorCode: string, errorMessage: string) {
  return { data: { results: { common: { errorCode, errorMessage }, juso: null } } };
}

function createJusoResult(overrides: Record<string, string>) {
  const juso = {
    roadAddr: "경기도 성남시 분당구 야탑로 72 (야탑동)",
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
    zipNo: "13497",
    ...overrides,
  };
  return { data: { results: { common: { errorCode: "0", errorMessage: "정상" }, juso: [juso] } } };
}

function createCoordinateResponse(juso: { entX: string; entY: string }[]) {
  return { data: { results: { common: { errorCode: "0", errorMessage: "정상" }, juso } } };
}

const coordinateQuery = {
  admCd: "4113510700",
  rnMgtSn: "411353180041",
  udrtYn: "0",
  buldMnnm: "72",
  buldSlno: "0",
};

describe("AddressSearchService", () => {
  const get = vi.fn<(url: string, options?: object) => Promise<unknown>>();
  let service: AddressSearchService;

  beforeEach(async () => {
    get.mockReset();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AddressSearchService,
        { provide: getHttpClientToken(JUSO_CLIENT), useValue: { get } },
        { provide: ConfigService, useValue: { get: () => "test-key" } },
      ],
    }).compile();
    service = moduleRef.get(AddressSearchService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("괄호 참고항목이 없는 도로명 주소와 지역, 좌표 조회 값을 돌려준다", async () => {
    get.mockResolvedValue(createJusoResult({}));

    await expect(service.search("야탑로 72")).resolves.toEqual([
      {
        roadAddress: "경기도 성남시 분당구 야탑로 72",
        jibunAddress: "경기도 성남시 분당구 야탑동 503",
        regionSido: "경기도",
        regionSigungu: "성남시 분당구",
        regionEupmyeondong: "야탑동",
        coordinateQuery: {
          admCd: "4113510700",
          rnMgtSn: "411353180041",
          udrtYn: "0",
          buldMnnm: "72",
          buldSlno: "0",
        },
      },
    ]);
  });

  it("건물 이름이 없으면 지번 주소를 그대로 둔다", async () => {
    get.mockResolvedValue(
      createJusoResult({ jibunAddr: "서울특별시 마포구 연남동 246-4", bdNm: "" }),
    );

    await expect(service.search("성미산로23길 46")).resolves.toEqual([
      expect.objectContaining({ jibunAddress: "서울특별시 마포구 연남동 246-4" }),
    ]);
  });

  it("세종시처럼 시군구가 빈 문자열이면 null 로 바꾼다", async () => {
    get.mockResolvedValue(createJusoResult({ siNm: "세종특별자치시", sggNm: "", emdNm: "보람동" }));

    await expect(service.search("한누리대로 2130")).resolves.toEqual([
      expect.objectContaining({ regionSigungu: null }),
    ]);
  });

  it("검색 결과가 없으면 빈 배열을 돌려준다", async () => {
    get.mockResolvedValue(createJusoResponse("0", "정상"));

    await expect(service.search("없는주소")).resolves.toEqual([]);
  });

  it("검색어 문제 코드는 행정안전부 안내 문구와 함께 400 으로 바꾼다", async () => {
    get.mockResolvedValue(createJusoResponse("E0008", "검색어는 두글자 이상 입력되어야 합니다."));

    await expect(service.search("가")).rejects.toThrow(
      new BadRequestException("검색어는 두글자 이상 입력되어야 합니다."),
    );
  });

  it.each(["-999", "E0001", "E0014", "E9999"])(
    "서비스 문제 코드와 표에 없는 코드 %s 는 502 로 바꾼다",
    async (errorCode) => {
      get.mockResolvedValue(createJusoResponse(errorCode, "내부 안내 문구"));

      await expect(service.search("야탑로 72")).rejects.toBeInstanceOf(BadGatewayException);
    },
  );

  it("좌표제공 API 의 UTM-K 좌표를 WGS84 경도와 위도로 바꿔 돌려준다", async () => {
    get.mockResolvedValue(
      createCoordinateResponse([{ entX: "966975.1231662666", entY: "1934560.2263797005" }]),
    );

    const { longitude, latitude } = await service.findCoordinate(coordinateQuery);

    expect(longitude).toBeCloseTo(127.126824, 6);
    expect(latitude).toBeCloseTo(37.409579, 6);
  });

  it("좌표 결과가 없으면 404 로 바꾼다", async () => {
    get.mockResolvedValue(createCoordinateResponse([]));

    await expect(service.findCoordinate(coordinateQuery)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("좌표제공 API 서비스 문제 코드는 좌표 조회 실패 문구와 함께 502 로 바꾼다", async () => {
    get.mockResolvedValue(createJusoResponse("E0001", "승인되지 않은 KEY 입니다."));

    await expect(service.findCoordinate(coordinateQuery)).rejects.toThrow(
      new BadGatewayException("주소 좌표 조회에 실패했습니다."),
    );
  });
  it("짧은 시간 요청이 많다는 코드(E0007)면 0.5초 뒤 다시 요청한다", async () => {
    vi.useFakeTimers();
    get
      .mockResolvedValueOnce(createJusoResponse("E0007", "짧은 시간동안 다량의 주소검색 요청"))
      .mockResolvedValueOnce(
        createCoordinateResponse([{ entX: "966975.1231662666", entY: "1934560.2263797005" }]),
      );

    const coordinate = service.findCoordinate(coordinateQuery);
    await vi.advanceTimersByTimeAsync(499);
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(coordinate).resolves.toEqual({
      longitude: expect.closeTo(127.126824, 6),
      latitude: expect.closeTo(37.409579, 6),
    });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("E0007 이 3번 다시 요청해도 이어지면 503 으로 바꾼다", async () => {
    vi.useFakeTimers();
    get.mockResolvedValue(createJusoResponse("E0007", "짧은 시간동안 다량의 주소검색 요청"));

    const result = service.search("야탑로 72").catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(1500);

    await expect(result).resolves.toBeInstanceOf(ServiceUnavailableException);
    expect(get).toHaveBeenCalledTimes(4);
  });
});
