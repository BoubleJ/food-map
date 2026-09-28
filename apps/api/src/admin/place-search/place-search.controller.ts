import { Controller, Get, Query } from "@nestjs/common";
import { PlaceSearchService } from "@/admin/place-search/place-search.service";
import { SearchKeywordQuery } from "@/admin/dto/search-keyword.query";

@Controller("admin/place-search")
export class PlaceSearchController {
  constructor(private readonly placeSearchService: PlaceSearchService) {}

  @Get()
  search(@Query() { keyword }: SearchKeywordQuery) {
    return this.placeSearchService.search(keyword);
  }
}
