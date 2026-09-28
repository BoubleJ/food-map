import { Controller, Get, Query } from "@nestjs/common";
import { AddressSearchService } from "@/admin/address-search/address-search.service";
import { SearchKeywordQuery } from "@/admin/dto/search-keyword.query";

@Controller("admin/address-search")
export class AddressSearchController {
  constructor(private readonly addressSearchService: AddressSearchService) {}

  @Get()
  search(@Query() { keyword }: SearchKeywordQuery) {
    return this.addressSearchService.search(keyword);
  }
}
