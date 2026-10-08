import type { RestaurantCandidate } from "@food-map/shared/admin/restaurant-search";

export type PlaceCandidate = Omit<RestaurantCandidate, "isRegistered">;
