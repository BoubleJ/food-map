import { Injectable } from "@nestjs/common";
import type {
  AddressLookupOutput,
  AddressLookupPlace,
  AddressLookupResult,
  LookedUpAddress,
} from "@food-map/shared/admin/address-lookup";
import { AddressSearchService } from "@/admin/address-search/address-search.service";

function toAddressKey(address: string) {
  return address.split(" ").slice(1).join("");
}

@Injectable()
export class AddressLookupService {
  constructor(private readonly addressSearchService: AddressSearchService) {}

  async lookup(places: AddressLookupPlace[]): Promise<AddressLookupOutput> {
    // 행정안전부 좌표 API 는 짧은 시간에 호출이 몰리면 E0007 에러를 반환하므로 순서대로 조회한다
    const results = await Array.fromAsync(places, (place) => this.lookupPlace(place));
    return { results };
  }

  private async lookupPlace({
    kakaoPlaceId,
    roadAddress,
  }: AddressLookupPlace): Promise<AddressLookupResult> {
    const address = await this.findAddress(roadAddress);
    if (!address) return { kakaoPlaceId, status: "notFound" };
    return { kakaoPlaceId, status: "found", address };
  }

  private async findAddress(kakaoRoadAddress: string): Promise<LookedUpAddress | null> {
    const addresses = await this.addressSearchService.search(kakaoRoadAddress);
    const address =
      addresses.find(
        ({ roadAddress }) => toAddressKey(roadAddress) === toAddressKey(kakaoRoadAddress),
      ) ??
      (addresses.length === 1 && addresses[0]);
    if (!address) return null;

    const { coordinateQuery, ...addressFields } = address;
    const coordinate = await this.addressSearchService.findCoordinate(coordinateQuery);
    if (!coordinate) return null;
    return { ...addressFields, ...coordinate };
  }
}
