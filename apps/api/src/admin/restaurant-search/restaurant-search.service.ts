import { Injectable, NotFoundException } from "@nestjs/common";
import { AddressSearchService } from "@/admin/address-search/address-search.service";
import { PlaceSearchService } from "@/admin/place-search/place-search.service";

interface RestaurantAddress {
  roadAddress: string;
  jibunAddress: string;
  regionSido: string;
  regionSigungu: string | null;
  regionEupmyeondong: string;
  longitude: number;
  latitude: number;
}

interface RestaurantCandidate {
  kakaoPlaceId: string;
  name: string;
  placeUrl: string;
  address: RestaurantAddress | null;
}

type AddressField = "roadAddress" | "jibunAddress";

function toAddressKey(address: string) {
  return address.split(" ").slice(1).join("");
}

@Injectable()
export class RestaurantSearchService {
  constructor(
    private readonly placeSearchService: PlaceSearchService,
    private readonly addressSearchService: AddressSearchService,
  ) {}

  async search(keyword: string): Promise<RestaurantCandidate[]> {
    const places = await this.placeSearchService.search(keyword);

    return Promise.all(
      places.map(async ({ kakaoPlaceId, name, placeUrl, roadAddress, jibunAddress }) => ({
        kakaoPlaceId,
        name,
        placeUrl,
        address: roadAddress
          ? await this.findAddress(roadAddress, "roadAddress")
          : await this.findAddress(jibunAddress, "jibunAddress"),
      })),
    );
  }

  private async findAddress(
    kakaoAddress: string,
    field: AddressField,
  ): Promise<RestaurantAddress | null> {
    if (!kakaoAddress) return null;

    const addresses = await this.addressSearchService.search(kakaoAddress);
    const address =
      addresses.find(
        (candidate) => toAddressKey(candidate[field]) === toAddressKey(kakaoAddress),
      ) ?? (addresses.length === 1 ? addresses[0] : undefined);
    if (!address) return null;

    const { coordinateQuery, ...addressFields } = address;
    try {
      const coordinate = await this.addressSearchService.findCoordinate(coordinateQuery);
      return { ...addressFields, ...coordinate };
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }
}
