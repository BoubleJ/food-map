import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { contract } from "@food-map/shared/contract";
import { AddressLookupService } from "@/admin/address-lookup/address-lookup.service";

@Controller()
export class AddressLookupController {
  constructor(private readonly addressLookupService: AddressLookupService) {}

  @Implement(contract.admin.addressLookup)
  lookup() {
    return implement(contract.admin.addressLookup).handler(({ input: { places } }) =>
      this.addressLookupService.lookup(places),
    );
  }
}
