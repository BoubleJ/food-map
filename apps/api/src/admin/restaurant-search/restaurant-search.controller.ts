import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@food-map/shared/contract";
import { RestaurantSearchService } from "@/admin/restaurant-search/restaurant-search.service";

@Controller()
export class RestaurantSearchController {
  constructor(private readonly restaurantSearchService: RestaurantSearchService) {}

  @Implement(contract.admin.restaurantSearch)
  search() {
    return implement(contract.admin.restaurantSearch).handler(({ input: { keyword, page } }) =>
      this.restaurantSearchService.search(keyword, page),
    );
  }
}
