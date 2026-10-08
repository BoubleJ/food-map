import type { PlaceCandidate } from "@/admin/types/place-candidate";

export interface PlaceSearchResult {
  places: PlaceCandidate[];
  isTruncated: boolean;
}
