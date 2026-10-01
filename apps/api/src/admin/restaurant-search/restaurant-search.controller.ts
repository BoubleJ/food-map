import { Controller, Get, Query } from "@nestjs/common";
import { SearchKeywordQuery } from "@/admin/dto/search-keyword.query";
import { RestaurantSearchService } from "@/admin/restaurant-search/restaurant-search.service";

@Controller("admin/restaurant-search")
export class RestaurantSearchController {
  constructor(private readonly restaurantSearchService: RestaurantSearchService) {}

  @Get()
  search(@Query() { keyword }: SearchKeywordQuery) {
    return this.restaurantSearchService.search(keyword);
  }
}
