import { z } from "zod";

export const userRoleSchema = z.enum(["USER", "ADMIN"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const oauthProviderSchema = z.enum(["kakao", "naver", "google", "apple"]);
export type OauthProvider = z.infer<typeof oauthProviderSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  nickname: z.string(),
  profileImageUrl: z.string().url().nullable(),
  role: userRoleSchema,
  provider: oauthProviderSchema,
  createdAt: z.string(),
});
export type User = z.infer<typeof userSchema>;
