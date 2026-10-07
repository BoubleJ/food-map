import { oc } from "@orpc/contract";
import { z } from "zod";
import { lookedUpAddressSchema } from "@food-map/shared/admin/address-lookup";
import { RESTAURANT_CATEGORIES } from "@food-map/shared/restaurant";

const restaurantRegisterItemSchema = z.object({
  kakaoPlaceId: z.string().min(1),
  name: z.string().min(1),
  placeUrl: z.url(),
  address: lookedUpAddressSchema,
  description: z.string().trim().min(1).max(500).optional(),
  franchiseName: z.string().trim().min(1).optional(),
});

const restaurantRegisterInputSchema = z.object({
  common: z.object({
    categories: z.array(z.enum(RESTAURANT_CATEGORIES)).min(1),
    isVisible: z.boolean(),
  }),
  restaurants: z
    .array(restaurantRegisterItemSchema)
    .min(1)
    .max(10)
    .refine(
      (restaurants) =>
        new Set(restaurants.map(({ kakaoPlaceId }) => kakaoPlaceId)).size === restaurants.length,
      "같은 식당이 두 번 들어 있습니다.",
    ),
});

const restaurantRegisterOutputSchema = z.object({
  registeredPlaceIds: z.array(z.string()),
});

export type RestaurantRegisterInput = z.infer<typeof restaurantRegisterInputSchema>;

export type RestaurantRegisterOutput = z.infer<typeof restaurantRegisterOutputSchema>;

export const restaurantRegisterContract = oc
  .route({ method: "POST", path: "/admin/restaurants", successStatus: 201 })
  .errors({
    CONFLICT: {
      message: "이미 등록된 식당이 있습니다.",
      data: z.object({ kakaoPlaceIds: z.array(z.string()) }),
    },
  })
  .input(restaurantRegisterInputSchema)
  .output(restaurantRegisterOutputSchema);
