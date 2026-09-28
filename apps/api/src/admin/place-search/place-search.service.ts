import { Injectable } from "@nestjs/common";
import { HttpClient, InjectHttpClient, toHttpException } from "@nestjs/http-client";

interface KakaoPlaceDocument {
  id: string;
  place_name: string;
  road_address_name: string;
  address_name: string;
}

interface KakaoKeywordSearchResponse {
  documents: KakaoPlaceDocument[];
}

interface PlaceCandidate {
  kakaoPlaceId: string;
  name: string;
  roadAddress: string;
  jibunAddress: string;
}

export const KAKAO_LOCAL_CLIENT = "kakao-local";

@Injectable()
export class PlaceSearchService {
  constructor(@InjectHttpClient(KAKAO_LOCAL_CLIENT) private readonly kakaoLocal: HttpClient) {}

  async search(keyword: string): Promise<PlaceCandidate[]> {
    try {
      const {
        data: { documents },
      } = await this.kakaoLocal.get<KakaoKeywordSearchResponse>("/v2/local/search/keyword.json", {
        query: { query: keyword, size: 15 },
      });
      return documents.map(({ id, place_name, road_address_name, address_name }) => ({
        kakaoPlaceId: id,
        name: place_name,
        roadAddress: road_address_name,
        jibunAddress: address_name,
      }));
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
