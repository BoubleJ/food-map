import { Box, Button, Flex, Group, ScrollArea, Skeleton, Stack, Text, Title } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import type { RestaurantCandidate } from "@food-map/shared/admin/restaurant-search";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { KakaoMap } from "@/components/KakaoMap";
import { QueryBoundary } from "@/components/QueryBoundary";
import { QueryErrorFallback } from "@/components/QueryErrorFallback";
import { RestaurantCandidateList } from "@/routes/restaurants/-components/RestaurantCandidateList";
import { RestaurantCandidateMarkers } from "@/routes/restaurants/-components/RestaurantCandidateMarkers";
import {
  getSelectedRestaurants,
  MAX_SELECTED_COUNT,
  useRestaurantSelection,
} from "@/routes/restaurants/-hooks/useRestaurantSelection";

interface RestaurantRegisterContentProps {
  keyword?: string;
}

const DEFAULT_MAP_LEVEL = 7;

const DOT_MARKER_MIN_LEVEL = 9;

const LOCATE_MAP_LEVEL = 3;

const SKELETON_COUNT = 5;

export function RestaurantRegisterContent({ keyword }: RestaurantRegisterContentProps) {
  const { panel } = useSearch({ from: "/restaurants/new" });
  const navigate = useNavigate({ from: "/restaurants/new" });
  const [{ placeStatuses }, dispatch] = useRestaurantSelection();
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string>();
  const [map, setMap] = useState<kakao.maps.Map>();
  const [mapLevel, setMapLevel] = useState(DEFAULT_MAP_LEVEL);

  const selectedRestaurants = getSelectedRestaurants(placeStatuses);
  const isFormOpen = panel === "form" && selectedRestaurants.length > 0;

  const handleMapCreate = (createdMap: kakao.maps.Map) => {
    setMap(createdMap);
  };

  const handleZoomChanged = (level: number) => {
    setMapLevel(level);
  };

  const handleSelectedChange = (restaurant: RestaurantCandidate, isSelected: boolean) => {
    dispatch(
      isSelected
        ? { type: "select", restaurant }
        : { type: "deselect", kakaoPlaceIds: [restaurant.kakaoPlaceId] },
    );
  };

  const handleLocate = ({ coordinate: { latitude, longitude } }: RestaurantCandidate) => {
    if (!map) return;
    map.setLevel(LOCATE_MAP_LEVEL);
    map.panTo(new kakao.maps.LatLng(latitude, longitude));
  };

  const handleExclude = (kakaoPlaceId: string) => {
    dispatch({ type: "exclude", kakaoPlaceId });
  };

  const handleHoveredPlaceChange = (kakaoPlaceId?: string) => {
    setHoveredPlaceId(kakaoPlaceId);
  };

  const handleFormOpen = () => {
    navigate({ search: (search) => ({ ...search, panel: "form" }) });
  };

  const handleFormClose = () => {
    navigate({ search: ({ panel: _panel, ...search }) => search });
  };

  return (
    <Flex flex={1} mih={0}>
      <Box flex={2} miw={0}>
        <KakaoMap
          defaultLevel={DEFAULT_MAP_LEVEL}
          onCreate={handleMapCreate}
          onZoomChanged={handleZoomChanged}
        >
          {keyword && (
            <RestaurantCandidateMarkers
              keyword={keyword}
              placeStatuses={placeStatuses}
              hoveredPlaceId={hoveredPlaceId}
              markerShape={mapLevel >= DOT_MARKER_MIN_LEVEL ? "dot" : "bubble"}
            />
          )}
        </KakaoMap>
      </Box>
      <Stack
        component="aside"
        flex={1}
        miw={0}
        gap={0}
        bg="gray.0"
        style={{ borderLeft: "1px solid var(--mantine-color-default-border)" }}
      >
        {isFormOpen ? (
          <Stack p="lg" align="flex-start">
            <Button variant="subtle" onClick={handleFormClose}>
              목록으로
            </Button>
            <Text c="dimmed">등록 폼은 다음 작업에서 만듭니다.</Text>
          </Stack>
        ) : (
          <>
            {keyword ? (
              <>
                <Group justify="space-between" px="lg" pt="md" pb="sm">
                  <Title order={2} fz="md">
                    '{keyword}' 검색 결과
                  </Title>
                  <Text size="xs" c="dimmed">
                    전국
                  </Text>
                </Group>
                <ScrollArea flex={1} px="lg" pb="sm">
                  <QueryBoundary
                    pendingFallback={
                      <Stack gap="xs">
                        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                          <Skeleton key={index} h={104} radius="md" />
                        ))}
                      </Stack>
                    }
                    errorFallback={({ error, resetErrorBoundary }) => (
                      <QueryErrorFallback
                        title="검색에 실패했습니다"
                        error={error}
                        onRetry={() => resetErrorBoundary()}
                      />
                    )}
                  >
                    <RestaurantCandidateList
                      keyword={keyword}
                      placeStatuses={placeStatuses}
                      hoveredPlaceId={hoveredPlaceId}
                      canSelect={selectedRestaurants.length < MAX_SELECTED_COUNT}
                      onSelectedChange={handleSelectedChange}
                      onLocate={handleLocate}
                      onExclude={handleExclude}
                      onHoveredPlaceChange={handleHoveredPlaceChange}
                    />
                  </QueryBoundary>
                </ScrollArea>
              </>
            ) : (
              <Box flex={1}>
                <EmptyState
                  icon={<IconSearch size={36} />}
                  title="식당명을 검색하세요"
                  description="카카오 장소 검색 결과에서 등록할 식당을 고릅니다"
                />
              </Box>
            )}
            <Group
              justify="space-between"
              px="lg"
              py="sm"
              bg="white"
              style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
            >
              <Text size="sm">
                <b>{selectedRestaurants.length}개</b> 선택됨{" "}
                <Text span c="dimmed">
                  (최대 {MAX_SELECTED_COUNT}개)
                </Text>
              </Text>
              <Button disabled={selectedRestaurants.length === 0} onClick={handleFormOpen}>
                등록
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Flex>
  );
}
