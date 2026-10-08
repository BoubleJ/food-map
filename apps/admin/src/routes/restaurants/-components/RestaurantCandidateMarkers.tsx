import type { RestaurantCandidate } from "@food-map/shared/admin/restaurant-search";
import { PlaceMarker } from "@/components/PlaceMarker";
import { useGetRestaurantSearchWithoutSuspense } from "@/routes/restaurants/-hooks/useGetRestaurantSearch";
import type { PlaceStatus } from "@/routes/restaurants/-hooks/useRestaurantSelection";

interface RestaurantCandidateMarkersProps {
  keyword: string;
  placeStatuses: Map<string, PlaceStatus>;
  hoveredPlaceId?: string;
}

function getMarkerVariant({ isRegistered }: RestaurantCandidate, isSelected: boolean) {
  if (isRegistered) return "registered";
  return isSelected ? "selected" : "default";
}

export function RestaurantCandidateMarkers({
  keyword,
  placeStatuses,
  hoveredPlaceId,
}: RestaurantCandidateMarkersProps) {
  const { data } = useGetRestaurantSearchWithoutSuspense(keyword);
  if (!data) return null;

  return data.restaurants
    .filter(({ kakaoPlaceId }) => placeStatuses.get(kakaoPlaceId)?.status !== "excluded")
    .map((candidate) => (
      <PlaceMarker
        key={candidate.kakaoPlaceId}
        name={candidate.name}
        coordinate={candidate.coordinate}
        variant={getMarkerVariant(
          candidate,
          placeStatuses.get(candidate.kakaoPlaceId)?.status === "selected",
        )}
        isActive={candidate.kakaoPlaceId === hoveredPlaceId}
      />
    ));
}
