import type { RestaurantCandidate } from "@food-map/shared/admin/restaurant-search";
import { useEffect, useRef } from "react";
import { useMap } from "react-kakao-maps-sdk";
import { PlaceMarker, type PlaceMarkerShape } from "@/components/PlaceMarker";
import { useGetRestaurantSearchWithoutSuspense } from "@/routes/restaurants/-hooks/useGetRestaurantSearch";
import type { PlaceStatus } from "@/routes/restaurants/-hooks/useRestaurantSelection";

interface RestaurantCandidateMarkersProps {
  keyword: string;
  placeStatuses: Map<string, PlaceStatus>;
  hoveredPlaceId?: string;
  markerShape: PlaceMarkerShape;
}

function getMarkerVariant({ isRegistered }: RestaurantCandidate, isSelected: boolean) {
  if (isRegistered) return "registered";
  return isSelected ? "selected" : "default";
}

export function RestaurantCandidateMarkers({
  keyword,
  placeStatuses,
  hoveredPlaceId,
  markerShape,
}: RestaurantCandidateMarkersProps) {
  const { data } = useGetRestaurantSearchWithoutSuspense(keyword);
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!data || data.restaurants.length === 0 || hasFittedRef.current) return;
    hasFittedRef.current = true;

    const bounds = new kakao.maps.LatLngBounds();
    for (const { coordinate } of data.restaurants) {
      bounds.extend(new kakao.maps.LatLng(coordinate.latitude, coordinate.longitude));
    }
    map.setBounds(bounds);
  }, [map, data]);

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
        shape={markerShape}
        isActive={candidate.kakaoPlaceId === hoveredPlaceId}
      />
    ));
}
