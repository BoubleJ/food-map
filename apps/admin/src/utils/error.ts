import { ORPCError } from "@orpc/client";

const DEFAULT_ERROR_MESSAGE = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

function getResponseBodyMessage(data: unknown) {
  if (typeof data !== "object" || data === null || !("body" in data)) return undefined;
  const { body } = data;
  if (typeof body !== "object" || body === null || !("message" in body)) return undefined;
  const { message } = body;
  return typeof message === "string" ? message : undefined;
}

export function getErrorMessage(error: unknown) {
  if (!(error instanceof ORPCError)) return DEFAULT_ERROR_MESSAGE;
  return getResponseBodyMessage(error.data) ?? (error.message || DEFAULT_ERROR_MESSAGE);
}
