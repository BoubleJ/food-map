import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AddressLookupOutput,
  AddressLookupPlace,
  AddressLookupResult,
  LookedUpAddress,
} from "@food-map/shared/admin/address-lookup";
import { AddressSearchService } from "@/admin/address-search/address-search.service";

type AddressField = "roadAddress" | "jibunAddress";

function toAddressKey(address: string) {
  return address.split(" ").slice(1).join("");
}

@Injectable()
export class AddressLookupService {
  constructor(private readonly addressSearchService: AddressSearchService) {}

  async lookup(places: AddressLookupPlace[]): Promise<AddressLookupOutput> {
    const results: AddressLookupResult[] = [];
    // 행정안전부 좌표 API 는 짧은 시간에 호출이 몰리면 E0007 을 돌려주므로 순서대로 조회한다
    for (const place of places) {
      results.push(await this.lookupPlace(place));
    }
    return { results };
  }

  private async lookupPlace({
    kakaoPlaceId,
    roadAddress,
    jibunAddress,
  }: AddressLookupPlace): Promise<AddressLookupResult> {
    const address = roadAddress
      ? await this.findAddress(roadAddress, "roadAddress")
      : await this.findAddress(jibunAddress, "jibunAddress");
    return address
      ? { kakaoPlaceId, status: "found", address }
      : { kakaoPlaceId, status: "notFound" };
  }

  private async findAddress(
    kakaoAddress: string,
    field: AddressField,
  ): Promise<LookedUpAddress | null> {
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
