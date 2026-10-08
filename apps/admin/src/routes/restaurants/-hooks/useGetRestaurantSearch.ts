import { useInfiniteQuery, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

const SERVER_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

function createRestaurantSearchOptions(keyword: string) {
  return orpc.admin.restaurantSearch.infiniteOptions({
    input: (page: number) => ({ keyword, page }),
    initialPageParam: 1,
    getNextPageParam: ({ hasNext }, pages) => (hasNext ? pages.length + 1 : undefined),
    staleTime: SERVER_SEARCH_CACHE_TTL_MS,
    select: ({ pages }) => ({
      restaurants: pages.flatMap(({ restaurants }) => restaurants),
      isTruncated: pages.some(({ isTruncated }) => isTruncated),
    }),
  });
}

export function useGetRestaurantSearch(keyword: string) {
  return useSuspenseInfiniteQuery(createRestaurantSearchOptions(keyword));
}

export function useGetRestaurantSearchWithoutSuspense(keyword: string) {
  return useInfiniteQuery(createRestaurantSearchOptions(keyword));
}
