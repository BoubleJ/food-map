import { oc } from "@orpc/contract";
import { z } from "zod";

const restaurantSearchInputSchema = z.object({
  keyword: z.string().min(1).max(40),
  page: z.coerce.number().int().min(1),
});

const coordinateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const restaurantCandidateSchema = z.object({
  kakaoPlaceId: z.string(),
  name: z.string(),
  categoryName: z.string(),
  placeUrl: z.string(),
  roadAddress: z.string(),
  coordinate: coordinateSchema,
  isRegistered: z.boolean(),
});

const restaurantSearchOutputSchema = z.object({
  restaurants: z.array(restaurantCandidateSchema),
  hasNext: z.boolean(),
  isTruncated: z.boolean(),
});

export type RestaurantCandidate = z.infer<typeof restaurantCandidateSchema>;

export type RestaurantSearchResult = z.infer<typeof restaurantSearchOutputSchema>;

export const restaurantSearchContract = oc
  .route({ method: "GET", path: "/admin/restaurant-search" })
  .input(restaurantSearchInputSchema)
  .output(restaurantSearchOutputSchema);
