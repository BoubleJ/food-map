import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpClient, InjectHttpClient, toHttpException } from "@nestjs/http-client";
import type { LookedUpAddress } from "@food-map/shared/admin/address-lookup";
import proj4 from "proj4";
import type { Env } from "@/_common/types/env";

interface JusoSearchItem {
  roadAddrPart1: string;
  jibunAddr: string;
  siNm: string;
  sggNm: string;
  emdNm: string;
  bdNm: string;
  admCd: string;
  rnMgtSn: string;
  udrtYn: string;
  buldMnnm: string;
  buldSlno: string;
}

type JusoCoordinateQuery = Pick<
  JusoSearchItem,
  "admCd" | "rnMgtSn" | "udrtYn" | "buldMnnm" | "buldSlno"
>;

type AddressCoordinate = Pick<LookedUpAddress, "latitude" | "longitude">;

interface AddressCandidate extends Omit<LookedUpAddress, "latitude" | "longitude"> {
  coordinateQuery: JusoCoordinateQuery;
}

interface JusoResponseStatus {
  errorCode: string;
  errorMessage: string;
}

interface JusoResults<T> {
  common: JusoResponseStatus;
  juso: T[] | null;
}

interface JusoResponse<T> {
  results: JusoResults<T>;
}

interface JusoCoordinateItem {
  entX: string;
  entY: string;
}

interface JusoRequestParams {
  endpoint: keyof typeof JUSO_ENDPOINTS;
  query: Record<string, string | number>;
}

export const JUSO_CLIENT = "juso";

const JUSO_ENDPOINTS = {
  search: {
    path: "/addrlink/addrLinkApi.do",
    apiKeyName: "JUSO_SEARCH_API_KEY",
    failureMessage: "주소 검색에 실패했습니다.",
  },
  coordinate: {
    path: "/addrlink/addrCoordApi.do",
    apiKeyName: "JUSO_COORD_API_KEY",
    failureMessage: "주소 좌표 조회에 실패했습니다.",
  },
} as const;

// 정상, 짧은_시간_다량_요청 외에는 검색어를 잘못 입력해서 나는 코드만 넣는다. 여기 있는 코드는 400 으로 응답한다
const JUSO_ERROR_CODE = {
  정상: "0",
  검색어_없음: "E0005",
  주소_상세_입력_필요: "E0006",
  짧은_시간_다량_요청: "E0007",
  검색어_한글자_미만: "E0008",
  숫자만_검색: "E0009",
  검색어_길이_초과: "E0010",
  검색어_숫자_길이_초과: "E0011",
  특수문자_숫자만_검색: "E0012",
  SQL_예약어_특수문자_포함: "E0013",
  검색_범위_초과: "E0015",
} as const;

const TOO_MANY_REQUESTS_RETRY_DELAY_MS = 500;

const MAX_TOO_MANY_REQUESTS_RETRIES = 3;

// 좌표제공 API 는 UTM-K(EPSG:5179) 좌표를 돌려준다. restaurants.location 은 WGS84(EPSG:4326) 로 저장한다
const UTM_K =
  "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs";

function createJusoException(
  { errorCode, errorMessage }: JusoResponseStatus,
  failureMessage: string,
) {
  const badRequestCodes: readonly string[] = Object.values(JUSO_ERROR_CODE);
  if (badRequestCodes.includes(errorCode)) return new BadRequestException(errorMessage);
  return new BadGatewayException(failureMessage);
}

function removeBuildingName(jibunAddress: string, buildingName: string) {
  const suffix = ` ${buildingName}`;
  return buildingName && jibunAddress.endsWith(suffix)
    ? jibunAddress.slice(0, -suffix.length)
    : jibunAddress;
}

@Injectable()
export class AddressSearchService {
  constructor(
    @InjectHttpClient(JUSO_CLIENT) private readonly juso: HttpClient,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async search(keyword: string): Promise<AddressCandidate[]> {
    const juso = await this.request<JusoSearchItem>({
      endpoint: "search",
      query: { keyword, currentPage: 1, countPerPage: 20 },
    });

    return juso.map(
      ({
        roadAddrPart1,
        jibunAddr,
        siNm,
        sggNm,
        emdNm,
        bdNm,
        admCd,
        rnMgtSn,
        udrtYn,
        buldMnnm,
        buldSlno,
      }) => ({
        roadAddress: roadAddrPart1,
        jibunAddress: removeBuildingName(jibunAddr, bdNm),
        regionSido: siNm,
        regionSigungu: sggNm || null,
        regionEupmyeondong: emdNm,
        coordinateQuery: { admCd, rnMgtSn, udrtYn, buldMnnm, buldSlno },
      }),
    );
  }

  async findCoordinate(query: JusoCoordinateQuery): Promise<AddressCoordinate | null> {
    const [coordinate] = await this.request<JusoCoordinateItem>({
      endpoint: "coordinate",
      query,
    });
    if (!coordinate) return null;

    const [longitude, latitude] = proj4(UTM_K, "WGS84", [
      Number(coordinate.entX),
      Number(coordinate.entY),
    ]);
    return { longitude, latitude };
  }

  private request<T>({ endpoint, query }: JusoRequestParams): Promise<T[]> {
    const { path, apiKeyName, failureMessage } = JUSO_ENDPOINTS[endpoint];
    const confmKey = this.config.get(apiKeyName, { infer: true });

    const attempt = async (retryCount: number): Promise<T[]> => {
      const { data } = await this.juso
        .get<JusoResponse<T>>(path, { query: { ...query, confmKey, resultType: "json" } })
        .catch((error: unknown) => {
          throw toHttpException(error);
        });
      const { common, juso } = data.results;

      if (common.errorCode === JUSO_ERROR_CODE.짧은_시간_다량_요청) {
        if (retryCount >= MAX_TOO_MANY_REQUESTS_RETRIES) {
          throw new ServiceUnavailableException(
            "주소 조회 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
          );
        }
        await new Promise((resolve) => setTimeout(resolve, TOO_MANY_REQUESTS_RETRY_DELAY_MS));
        return attempt(retryCount + 1);
      }
      if (common.errorCode !== JUSO_ERROR_CODE.정상)
        throw createJusoException(common, failureMessage);
      return juso ?? [];
    };

    return attempt(0);
  }
}
