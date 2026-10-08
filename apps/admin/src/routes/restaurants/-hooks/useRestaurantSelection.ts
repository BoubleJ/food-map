import type { LookedUpAddress } from "@food-map/shared/admin/address-lookup";
import type { RestaurantCandidate } from "@food-map/shared/admin/restaurant-search";
import { useReducer } from "react";

export const MAX_SELECTED_COUNT = 10;

export type PlaceStatus =
  | { status: "selected"; restaurant: RestaurantCandidate }
  | { status: "excluded" };

interface RestaurantSelectionState {
  placeStatuses: Map<string, PlaceStatus>;
  confirmedAddresses: Record<string, LookedUpAddress>;
}

type RestaurantSelectionAction =
  | { type: "select"; restaurant: RestaurantCandidate }
  | { type: "deselect"; kakaoPlaceIds: string[] }
  | { type: "exclude"; kakaoPlaceId: string }
  | { type: "confirmAddresses"; addresses: Record<string, LookedUpAddress> }
  | { type: "clear" };

const INITIAL_STATE: RestaurantSelectionState = {
  placeStatuses: new Map(),
  confirmedAddresses: {},
};

export function getSelectedRestaurants(placeStatuses: Map<string, PlaceStatus>) {
  return [...placeStatuses.values()].flatMap((placeStatus) =>
    placeStatus.status === "selected" ? [placeStatus.restaurant] : [],
  );
}

function omitAddresses(addresses: Record<string, LookedUpAddress>, kakaoPlaceIds: string[]) {
  return Object.fromEntries(
    Object.entries(addresses).filter(([kakaoPlaceId]) => !kakaoPlaceIds.includes(kakaoPlaceId)),
  );
}

export function restaurantSelectionReducer(
  state: RestaurantSelectionState,
  action: RestaurantSelectionAction,
): RestaurantSelectionState {
  switch (action.type) {
    case "select": {
      const { kakaoPlaceId } = action.restaurant;
      const isSelected = state.placeStatuses.get(kakaoPlaceId)?.status === "selected";
      const selectedCount = getSelectedRestaurants(state.placeStatuses).length;
      if (isSelected || selectedCount >= MAX_SELECTED_COUNT) return state;

      const placeStatuses = new Map(state.placeStatuses);
      placeStatuses.set(kakaoPlaceId, { status: "selected", restaurant: action.restaurant });
      return { ...state, placeStatuses };
    }
    case "deselect": {
      const placeStatuses = new Map(state.placeStatuses);
      for (const kakaoPlaceId of action.kakaoPlaceIds) {
        if (placeStatuses.get(kakaoPlaceId)?.status === "selected")
          placeStatuses.delete(kakaoPlaceId);
      }
      return {
        placeStatuses,
        confirmedAddresses: omitAddresses(state.confirmedAddresses, action.kakaoPlaceIds),
      };
    }
    case "exclude": {
      const placeStatuses = new Map(state.placeStatuses);
      placeStatuses.set(action.kakaoPlaceId, { status: "excluded" });
      return {
        placeStatuses,
        confirmedAddresses: omitAddresses(state.confirmedAddresses, [action.kakaoPlaceId]),
      };
    }
    case "confirmAddresses":
      return {
        ...state,
        confirmedAddresses: { ...state.confirmedAddresses, ...action.addresses },
      };
    case "clear":
      return {
        placeStatuses: new Map(
          [...state.placeStatuses].filter(([, { status }]) => status === "excluded"),
        ),
        confirmedAddresses: {},
      };
  }
}

export function useRestaurantSelection() {
  return useReducer(restaurantSelectionReducer, INITIAL_STATE);
}
