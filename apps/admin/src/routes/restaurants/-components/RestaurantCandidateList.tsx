import { Alert, Button, Stack } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { RestaurantCandidate } from "@food-map/shared/admin/restaurant-search";
import { EmptyState } from "@/components/EmptyState";
import { RestaurantCandidateItem } from "@/routes/restaurants/-components/RestaurantCandidateItem";
import { useGetRestaurantSearch } from "@/routes/restaurants/-hooks/useGetRestaurantSearch";
import type { PlaceStatus } from "@/routes/restaurants/-hooks/useRestaurantSelection";

interface RestaurantCandidateListProps {
  keyword: string;
  placeStatuses: Map<string, PlaceStatus>;
  hoveredPlaceId?: string;
  canSelect: boolean;
  onSelectedChange: (candidate: RestaurantCandidate, isSelected: boolean) => void;
  onLocate: (candidate: RestaurantCandidate) => void;
  onExclude: (kakaoPlaceId: string) => void;
  onHoveredPlaceChange: (kakaoPlaceId?: string) => void;
}

export function RestaurantCandidateList({
  keyword,
  placeStatuses,
  hoveredPlaceId,
  canSelect,
  onSelectedChange,
  onLocate,
  onExclude,
  onHoveredPlaceChange,
}: RestaurantCandidateListProps) {
  const {
    data: { restaurants, isTruncated },
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetRestaurantSearch(keyword);

  const visibleCandidates = restaurants.filter(
    ({ kakaoPlaceId }) => placeStatuses.get(kakaoPlaceId)?.status !== "excluded",
  );

  const handleMoreClick = () => {
    fetchNextPage();
  };

  if (visibleCandidates.length === 0 && !hasNextPage) {
    return (
      <EmptyState
        title={`'${keyword}' 검색 결과가 없습니다`}
        description="검색어를 바꿔 다시 검색해 주세요"
      />
    );
  }

  return (
    <Stack gap="xs">
      {isTruncated && (
        <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
          결과가 많아 일부 지역은 모두 가져오지 못했습니다. 지역명을 붙여 다시 검색해 주세요.
        </Alert>
      )}
      {visibleCandidates.map((candidate) => (
        <RestaurantCandidateItem
          key={candidate.kakaoPlaceId}
          candidate={candidate}
          isSelected={placeStatuses.get(candidate.kakaoPlaceId)?.status === "selected"}
          isHovered={candidate.kakaoPlaceId === hoveredPlaceId}
          canSelect={canSelect}
          onSelectedChange={(isSelected) => onSelectedChange(candidate, isSelected)}
          onLocate={() => onLocate(candidate)}
          onExclude={() => onExclude(candidate.kakaoPlaceId)}
          onHoverStart={() => onHoveredPlaceChange(candidate.kakaoPlaceId)}
          onHoverEnd={() => onHoveredPlaceChange()}
        />
      ))}
      {hasNextPage && (
        <Button variant="default" loading={isFetchingNextPage} onClick={handleMoreClick}>
          더 보기
        </Button>
      )}
    </Stack>
  );
}
