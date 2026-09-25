/** API 가 목록을 돌려줄 때 쓰는 커서 기반 페이지. */
export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

/** NestJS 예외 필터가 내보내는 오류 표현. */
export type ApiError = {
  statusCode: number;
  code: string;
  message: string;
};
