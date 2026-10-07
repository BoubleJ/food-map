import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@food-map/shared/contract";
import { RestaurantRegisterService } from "@/admin/restaurant-register/restaurant-register.service";

@Controller()
export class RestaurantRegisterController {
  constructor(private readonly restaurantRegisterService: RestaurantRegisterService) {}

  @Implement(contract.admin.restaurantRegister)
  register() {
    return implement(contract.admin.restaurantRegister).handler(({ input }) =>
      this.restaurantRegisterService.register(input),
    );
  }
}
