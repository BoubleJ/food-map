export const RESTAURANT_CATEGORIES = ["restaurant", "cafe", "bakery", "bar"] as const;

export const RESTAURANT_CUISINES = [
  "korean",
  "japanese",
  "chinese",
  "western",
  "vietnamese",
  "thai",
  "turkish",
  "bunsik",
  "mexican",
  "indian",
  "other",
] as const;

export type RestaurantCategory = (typeof RESTAURANT_CATEGORIES)[number];

export type RestaurantCuisine = (typeof RESTAURANT_CUISINES)[number];
