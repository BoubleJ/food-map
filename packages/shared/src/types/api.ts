export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ApiError = {
  statusCode: number;
  code: string;
  message: string;
};
