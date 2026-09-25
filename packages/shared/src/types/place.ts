import { z } from "zod";

export const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Coordinate = z.infer<typeof coordinateSchema>;

export const placeCategorySchema = z.enum([
  "korean",
  "chinese",
  "japanese",
  "western",
  "asian",
  "cafe",
  "bar",
  "etc",
]);
export type PlaceCategory = z.infer<typeof placeCategorySchema>;

export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: placeCategorySchema,
  address: z.string(),
  roadAddress: z.string().nullable(),
  coordinate: coordinateSchema,
  phone: z.string().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Place = z.infer<typeof placeSchema>;

export const boundsSchema = z.object({
  south: z.number(),
  west: z.number(),
  north: z.number(),
  east: z.number(),
});
export type Bounds = z.infer<typeof boundsSchema>;
