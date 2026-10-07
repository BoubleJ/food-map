import { oc } from "@orpc/contract";
import { z } from "zod";

export const lookedUpAddressSchema = z.object({
  roadAddress: z.string(),
  jibunAddress: z.string(),
  regionSido: z.string(),
  regionSigungu: z.string().nullable(),
  regionEupmyeondong: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

const addressLookupPlaceSchema = z.object({
  kakaoPlaceId: z.string().min(1),
  roadAddress: z.string(),
  jibunAddress: z.string(),
});

const addressLookupInputSchema = z.object({
  places: z.array(addressLookupPlaceSchema).min(1).max(10),
});

const addressLookupResultSchema = z.discriminatedUnion("status", [
  z.object({
    kakaoPlaceId: z.string(),
    status: z.literal("found"),
    address: lookedUpAddressSchema,
  }),
  z.object({
    kakaoPlaceId: z.string(),
    status: z.literal("notFound"),
  }),
]);

const addressLookupOutputSchema = z.object({
  results: z.array(addressLookupResultSchema),
});

export type LookedUpAddress = z.infer<typeof lookedUpAddressSchema>;

export type AddressLookupPlace = z.infer<typeof addressLookupPlaceSchema>;

export type AddressLookupResult = z.infer<typeof addressLookupResultSchema>;

export type AddressLookupOutput = z.infer<typeof addressLookupOutputSchema>;

export const addressLookupContract = oc
  .route({ method: "POST", path: "/admin/address-lookups" })
  .input(addressLookupInputSchema)
  .output(addressLookupOutputSchema);
