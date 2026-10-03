import { oc } from "@orpc/contract";
import { z } from "zod";

const restaurantSearchInputSchema = z.object({
  keyword: z.string().min(1).max(40),
});

const restaurantAddressSchema = z.object({
  roadAddress: z.string(),
  jibunAddress: z.string(),
  regionSido: z.string(),
  regionSigungu: z.string().nullable(),
  regionEupmyeondong: z.string(),
  longitude: z.number(),
  latitude: z.number(),
});

const restaurantCandidateSchema = z.object({
  kakaoPlaceId: z.string(),
  name: z.string(),
  categoryName: z.string(),
  placeUrl: z.string(),
  isRegistered: z.boolean(),
  address: restaurantAddressSchema.nullable(),
});

export type RestaurantAddress = z.infer<typeof restaurantAddressSchema>;

export type RestaurantCandidate = z.infer<typeof restaurantCandidateSchema>;

export const restaurantSearchContract = oc
  .route({ method: "GET", path: "/admin/restaurant-search" })
  .input(restaurantSearchInputSchema)
  .output(z.array(restaurantCandidateSchema));
