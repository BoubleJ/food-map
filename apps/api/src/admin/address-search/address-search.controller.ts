import { Controller, Get, Query } from "@nestjs/common";
import { AddressSearchService } from "@/admin/address-search/address-search.service";
import { AddressCoordinateQuery } from "@/admin/dto/address-coordinate.query";
import { SearchKeywordQuery } from "@/admin/dto/search-keyword.query";

@Controller("admin/address-search")
export class AddressSearchController {
  constructor(private readonly addressSearchService: AddressSearchService) {}

  @Get()
  search(@Query() { keyword }: SearchKeywordQuery) {
    return this.addressSearchService.search(keyword);
  }

  @Get("coordinate")
  findCoordinate(@Query() query: AddressCoordinateQuery) {
    return this.addressSearchService.findCoordinate(query);
  }
}
