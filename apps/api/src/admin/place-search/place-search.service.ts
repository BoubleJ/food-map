import { Injectable } from "@nestjs/common";
import { HttpClient, InjectHttpClient, toHttpException } from "@nestjs/http-client";
import type { RestaurantCandidate } from "@food-map/shared/admin/restaurant-search";

interface KakaoPlaceDocument {
  id: string;
  place_name: string;
  category_group_code: string;
  category_name: string;
  road_address_name: string;
  place_url: string;
  x: string;
  y: string;
}

interface KakaoKeywordSearchMeta {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
}

interface KakaoKeywordSearchResponse {
  meta: KakaoKeywordSearchMeta;
  documents: KakaoPlaceDocument[];
}

interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface SearchInRectParams {
  keyword: string;
  rect?: Rect;
  depth: number;
}

interface KeywordSearchParams {
  keyword: string;
  page: number;
  rect?: Rect;
}

type PlaceCandidate = Omit<RestaurantCandidate, "isRegistered">;

export const KAKAO_LOCAL_CLIENT = "kakao-local";

const RESTAURANT_CATEGORY_GROUP_CODES = ["FD6", "CE7"];

// 카카오 키워드 검색은 검색어 하나당 45곳까지만 준다. 더 많으면 이 영역부터 4등분해 다시 검색한다
const KOREA_RECT: Rect = { minX: 124, minY: 33, maxX: 132, maxY: 39 };

const KAKAO_PAGE_SIZE = 15;

const KAKAO_MAX_PAGE = 3;

const MAX_SPLIT_DEPTH = 4;

function splitRect({ minX, minY, maxX, maxY }: Rect): Rect[] {
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  return [
    { minX, minY, maxX: midX, maxY: midY },
    { minX: midX, minY, maxX, maxY: midY },
    { minX, minY: midY, maxX: midX, maxY },
    { minX: midX, minY: midY, maxX, maxY },
  ];
}

function toRectQuery({ minX, minY, maxX, maxY }: Rect) {
  return `${minX},${minY},${maxX},${maxY}`;
}

@Injectable()
export class PlaceSearchService {
  constructor(@InjectHttpClient(KAKAO_LOCAL_CLIENT) private readonly kakaoLocal: HttpClient) {}

  async search(keyword: string): Promise<PlaceCandidate[]> {
    const documents = await this.searchInRect({ keyword, depth: 0 });
    const uniqueDocuments = new Map(documents.map((document) => [document.id, document]));

    return [...uniqueDocuments.values()]
      .filter(
        ({ category_group_code, road_address_name }) =>
          RESTAURANT_CATEGORY_GROUP_CODES.includes(category_group_code) && road_address_name !== "",
      )
      .map(({ id, place_name, category_name, road_address_name, place_url, x, y }) => ({
        kakaoPlaceId: id,
        name: place_name,
        categoryName: category_name,
        roadAddress: road_address_name,
        placeUrl: place_url,
        coordinate: { latitude: Number(y), longitude: Number(x) },
      }));
  }

  private async searchInRect({
    keyword,
    rect,
    depth,
  }: SearchInRectParams): Promise<KakaoPlaceDocument[]> {
    const { meta, documents } = await this.requestKeywordSearch({ keyword, page: 1, rect });

    if (meta.total_count > meta.pageable_count && depth < MAX_SPLIT_DEPTH) {
      const childDocuments: KakaoPlaceDocument[] = [];
      for (const childRect of splitRect(rect ?? KOREA_RECT)) {
        childDocuments.push(
          ...(await this.searchInRect({ keyword, rect: childRect, depth: depth + 1 })),
        );
      }
      return childDocuments;
    }

    let isEnd = meta.is_end;
    for (let page = 2; !isEnd && page <= KAKAO_MAX_PAGE; page++) {
      const nextPage = await this.requestKeywordSearch({ keyword, page, rect });
      documents.push(...nextPage.documents);
      isEnd = nextPage.meta.is_end;
    }
    return documents;
  }

  private async requestKeywordSearch({ keyword, page, rect }: KeywordSearchParams) {
    const { data } = await this.kakaoLocal
      .get<KakaoKeywordSearchResponse>("/v2/local/search/keyword.json", {
        query: {
          query: keyword,
          size: KAKAO_PAGE_SIZE,
          page,
          ...(rect && { rect: toRectQuery(rect) }),
        },
      })
      .catch((error: unknown) => {
        throw toHttpException(error);
      });
    return data;
  }
}
