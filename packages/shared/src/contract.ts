import { addressLookupContract } from "@food-map/shared/admin/address-lookup";
import { restaurantRegisterContract } from "@food-map/shared/admin/restaurant-register";
import { restaurantSearchContract } from "@food-map/shared/admin/restaurant-search";

export const contract = {
  admin: {
    restaurantSearch: restaurantSearchContract,
    addressLookup: addressLookupContract,
    restaurantRegister: restaurantRegisterContract,
  },
};
