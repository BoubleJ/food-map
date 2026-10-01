import { Injectable } from "@nestjs/common";
import { HttpClient, InjectHttpClient, toHttpException } from "@nestjs/http-client";

interface KakaoPlaceDocument {
  id: string;
  place_name: string;
  category_group_code: string;
  road_address_name: string;
  address_name: string;
  place_url: string;
}

interface KakaoKeywordSearchResponse {
  documents: KakaoPlaceDocument[];
}

interface PlaceCandidate {
  kakaoPlaceId: string;
  name: string;
  roadAddress: string;
  jibunAddress: string;
  placeUrl: string;
}

export const KAKAO_LOCAL_CLIENT = "kakao-local";

const RESTAURANT_CATEGORY_GROUP_CODES = ["FD6", "CE7"];

function removeSpaces(value: string) {
  return value.replace(/\s/g, "");
}

@Injectable()
export class PlaceSearchService {
  constructor(@InjectHttpClient(KAKAO_LOCAL_CLIENT) private readonly kakaoLocal: HttpClient) {}

  async search(keyword: string): Promise<PlaceCandidate[]> {
    const documents = await this.requestKeywordSearch(keyword);
    const keywordWithoutSpaces = removeSpaces(keyword);

    return documents
      .filter(
        ({ category_group_code, place_name }) =>
          RESTAURANT_CATEGORY_GROUP_CODES.includes(category_group_code) &&
          removeSpaces(place_name).includes(keywordWithoutSpaces),
      )
      .map(({ id, place_name, road_address_name, address_name, place_url }) => ({
        kakaoPlaceId: id,
        name: place_name,
        roadAddress: road_address_name,
        jibunAddress: address_name,
        placeUrl: place_url,
      }));
  }

  private async requestKeywordSearch(keyword: string) {
    try {
      const { data } = await this.kakaoLocal.get<KakaoKeywordSearchResponse>(
        "/v2/local/search/keyword.json",
        { query: { query: keyword, size: 15 } },
      );
      return data.documents;
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
