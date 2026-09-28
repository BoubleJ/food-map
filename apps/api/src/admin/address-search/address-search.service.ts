import { BadGatewayException, BadRequestException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpClient, InjectHttpClient, toHttpException } from "@nestjs/http-client";

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

interface JusoCoordinateQuery {
  admCd: string;
  rnMgtSn: string;
  udrtYn: string;
  buldMnnm: string;
  buldSlno: string;
}

interface AddressSearchResult {
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

interface JusoSearchResponse {
  results: {
    common: JusoSearchStatus;
    juso: JusoSearchItem[] | null;
  };
}

export const JUSO_CLIENT = "juso";

type JusoErrorStatus = HttpStatus.BAD_REQUEST | HttpStatus.BAD_GATEWAY;

const JUSO_SUCCESS_CODE = "0";

const JUSO_ERROR_STATUS: Record<string, JusoErrorStatus> = {
  "-999": HttpStatus.BAD_GATEWAY,
  E0001: HttpStatus.BAD_GATEWAY,
  E0005: HttpStatus.BAD_REQUEST,
  E0006: HttpStatus.BAD_REQUEST,
  E0008: HttpStatus.BAD_REQUEST,
  E0009: HttpStatus.BAD_REQUEST,
  E0010: HttpStatus.BAD_REQUEST,
  E0011: HttpStatus.BAD_REQUEST,
  E0012: HttpStatus.BAD_REQUEST,
  E0013: HttpStatus.BAD_REQUEST,
  E0014: HttpStatus.BAD_GATEWAY,
  E0015: HttpStatus.BAD_REQUEST,
};

function createJusoException({ errorCode, errorMessage }: JusoSearchStatus) {
  const status = JUSO_ERROR_STATUS[errorCode] ?? HttpStatus.BAD_GATEWAY;
  return status === HttpStatus.BAD_REQUEST
    ? new BadRequestException(errorMessage)
    : new BadGatewayException("주소 검색에 실패했습니다.");
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
    private readonly config: ConfigService,
  ) {}

  async search(keyword: string): Promise<AddressSearchResult[]> {
    const {
      results: { common, juso },
    } = await this.requestSearch(keyword);

    if (common.errorCode !== JUSO_SUCCESS_CODE) throw createJusoException(common);

    return (juso ?? []).map(
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

  private async requestSearch(keyword: string) {
    try {
      const { data } = await this.juso.get<JusoSearchResponse>("/addrlink/addrLinkApi.do", {
        query: {
          confmKey: this.config.getOrThrow<string>("JUSO_SEARCH_API_KEY"),
          keyword,
          currentPage: 1,
          countPerPage: 20,
          resultType: "json",
        },
      });
      return data;
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
