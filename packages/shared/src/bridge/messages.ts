import { z } from "zod";
import { coordinateSchema } from "../types/place";

export const webToNativeMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("REQUEST_LOCATION") }),
  z.object({ type: z.literal("REQUEST_PUSH_PERMISSION") }),
  z.object({ type: z.literal("SHARE"), payload: z.object({ url: z.string(), title: z.string().optional() }) }),
  z.object({ type: z.literal("OPEN_EXTERNAL"), payload: z.object({ url: z.string() }) }),
  z.object({ type: z.literal("LOGIN"), payload: z.object({ provider: z.enum(["kakao", "naver", "google", "apple"]) }) }),
  z.object({ type: z.literal("HAPTIC"), payload: z.object({ style: z.enum(["light", "medium", "heavy"]) }) }),
]);
export type WebToNativeMessage = z.infer<typeof webToNativeMessageSchema>;

export const nativeToWebMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("LOCATION"), payload: coordinateSchema }),
  z.object({ type: z.literal("LOCATION_DENIED") }),
  z.object({ type: z.literal("PUSH_TOKEN"), payload: z.object({ token: z.string() }) }),
  z.object({ type: z.literal("LOGIN_SUCCESS"), payload: z.object({ accessToken: z.string() }) }),
  z.object({ type: z.literal("LOGIN_CANCELED") }),
  z.object({ type: z.literal("BACK_PRESSED") }),
]);
export type NativeToWebMessage = z.infer<typeof nativeToWebMessageSchema>;

export const APP_BRIDGE_USER_AGENT_TAG = "FoodMapApp";
