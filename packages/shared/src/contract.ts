import { addressLookupContract } from "@food-map/shared/admin/address-lookup";
import { restaurantSearchContract } from "@food-map/shared/admin/restaurant-search";

export const contract = {
  admin: {
    restaurantSearch: restaurantSearchContract,
    addressLookup: addressLookupContract,
  },
};
