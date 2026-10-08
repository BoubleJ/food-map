import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpClient, InjectHttpClient, toHttpException } from "@nestjs/http-client";
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

interface AddressCandidate {
  roadAddress: string;
  jibunAddress: string;
  regionSido: string;
  regionSigungu: string | null;
  regionEupmyeondong: string;
  coordinateQuery: JusoCoordinateQuery;
}

interface JusoSearchStatus {
  errorCode: string;
  errorMessage: string;
}

interface JusoResponse<T> {
  results: {
    common: JusoSearchStatus;
    juso: T[] | null;
  };
}

interface JusoRequestParams {
  path: string;
  query: Record<string, string | number>;
  failureMessage: string;
}

interface JusoCoordinateItem {
  entX: string;
  entY: string;
}

interface AddressCoordinate {
  longitude: number;
  latitude: number;
}

export const JUSO_CLIENT = "juso";

const JUSO_SUCCESS_CODE = "0";

const JUSO_TOO_MANY_REQUESTS_CODE = "E0007";

const TOO_MANY_REQUESTS_RETRY_DELAY_MS = 500;

const MAX_TOO_MANY_REQUESTS_RETRIES = 3;

// 좌표제공 API 는 UTM-K(EPSG:5179) 좌표를 돌려준다. restaurants.location 은 WGS84(EPSG:4326) 로 저장한다
const UTM_K =
  "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs";

const JUSO_BAD_REQUEST_CODES = new Set([
  "E0005",
  "E0006",
  "E0008",
  "E0009",
  "E0010",
  "E0011",
  "E0012",
  "E0013",
  "E0015",
]);

function createJusoException(
  { errorCode, errorMessage }: JusoSearchStatus,
  failureMessage: string,
) {
  if (JUSO_BAD_REQUEST_CODES.has(errorCode)) return new BadRequestException(errorMessage);
  return new BadGatewayException(failureMessage);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      path: "/addrlink/addrLinkApi.do",
      query: {
        confmKey: this.config.get("JUSO_SEARCH_API_KEY", { infer: true }),
        keyword,
        currentPage: 1,
        countPerPage: 20,
      },
      failureMessage: "주소 검색에 실패했습니다.",
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
      path: "/addrlink/addrCoordApi.do",
      query: { confmKey: this.config.get("JUSO_COORD_API_KEY", { infer: true }), ...query },
      failureMessage: "주소 좌표 조회에 실패했습니다.",
    });
    if (!coordinate) return null;

    const [longitude, latitude] = proj4(UTM_K, "WGS84", [
      Number(coordinate.entX),
      Number(coordinate.entY),
    ]);
    return { longitude, latitude };
  }

  private async request<T>({ path, query, failureMessage }: JusoRequestParams): Promise<T[]> {
    for (let attempt = 0; attempt <= MAX_TOO_MANY_REQUESTS_RETRIES; attempt++) {
      if (attempt > 0) await wait(TOO_MANY_REQUESTS_RETRY_DELAY_MS);

      const { data } = await this.juso
        .get<JusoResponse<T>>(path, { query: { ...query, resultType: "json" } })
        .catch((error: unknown) => {
          throw toHttpException(error);
        });
      const { common, juso } = data.results;
      if (common.errorCode === JUSO_TOO_MANY_REQUESTS_CODE) continue;
      if (common.errorCode !== JUSO_SUCCESS_CODE) throw createJusoException(common, failureMessage);
      return juso ?? [];
    }
    throw new ServiceUnavailableException("주소 조회 요청이 많습니다. 잠시 후 다시 시도해 주세요.");
  }
}
