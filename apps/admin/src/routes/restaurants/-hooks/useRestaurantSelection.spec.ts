import type { LookedUpAddress } from "@food-map/shared/admin/address-lookup";
import type { RestaurantCandidate } from "@food-map/shared/admin/restaurant-search";
import { describe, expect, it } from "vitest";
import {
  getSelectedRestaurants,
  MAX_SELECTED_COUNT,
  type PlaceStatus,
  restaurantSelectionReducer,
} from "@/routes/restaurants/-hooks/useRestaurantSelection";

function createRestaurant(kakaoPlaceId: string): RestaurantCandidate {
  return {
    kakaoPlaceId,
    name: `식당 ${kakaoPlaceId}`,
    categoryName: "음식점 > 분식",
    placeUrl: `http://place.map.kakao.com/${kakaoPlaceId}`,
    roadAddress: "서울 강남구 역삼로 123",
    coordinate: { latitude: 37.5, longitude: 127.03 },
    isRegistered: false,
  };
}

function createAddress(): LookedUpAddress {
  return {
    roadAddress: "서울특별시 강남구 역삼로 123",
    jibunAddress: "서울특별시 강남구 역삼동 1",
    regionSido: "서울특별시",
    regionSigungu: "강남구",
    regionEupmyeondong: "역삼동",
    latitude: 37.5,
    longitude: 127.03,
  };
}

function createSelected(kakaoPlaceId: string): [string, PlaceStatus] {
  return [kakaoPlaceId, { status: "selected", restaurant: createRestaurant(kakaoPlaceId) }];
}

function createState(entries: [string, PlaceStatus][] = [], addressPlaceIds: string[] = []) {
  return {
    placeStatuses: new Map(entries),
    confirmedAddresses: Object.fromEntries(addressPlaceIds.map((id) => [id, createAddress()])),
  };
}

function getSelectedPlaceIds(placeStatuses: Map<string, PlaceStatus>) {
  return getSelectedRestaurants(placeStatuses).map(({ kakaoPlaceId }) => kakaoPlaceId);
}

describe("restaurantSelectionReducer", () => {
  it("선택하면 선택한 식당에 추가한다", () => {
    const state = restaurantSelectionReducer(createState(), {
      type: "select",
      restaurant: createRestaurant("1"),
    });

    expect(getSelectedPlaceIds(state.placeStatuses)).toEqual(["1"]);
  });

  it("카카오 장소 ID 크기와 관계없이 선택한 순서대로 돌려준다", () => {
    const state = [createRestaurant("900"), createRestaurant("12")].reduce(
      (current, restaurant) => restaurantSelectionReducer(current, { type: "select", restaurant }),
      createState(),
    );

    expect(getSelectedPlaceIds(state.placeStatuses)).toEqual(["900", "12"]);
  });

  it(`${MAX_SELECTED_COUNT}곳을 선택했으면 더 추가하지 않는다`, () => {
    const full = createState(
      Array.from({ length: MAX_SELECTED_COUNT }, (_, index) => createSelected(String(index))),
    );

    const state = restaurantSelectionReducer(full, {
      type: "select",
      restaurant: createRestaurant("new"),
    });

    expect(state).toBe(full);
  });

  it("선택을 풀면 그 식당의 확인한 주소도 지운다", () => {
    const state = restaurantSelectionReducer(
      createState([createSelected("1"), createSelected("2")], ["1", "2"]),
      { type: "deselect", kakaoPlaceIds: ["1"] },
    );

    expect(getSelectedPlaceIds(state.placeStatuses)).toEqual(["2"]);
    expect(Object.keys(state.confirmedAddresses)).toEqual(["2"]);
  });

  it("선택을 풀어도 목록에서 뺀 식당은 그대로 둔다", () => {
    const state = restaurantSelectionReducer(createState([["1", { status: "excluded" }]]), {
      type: "deselect",
      kakaoPlaceIds: ["1"],
    });

    expect(state.placeStatuses.get("1")).toEqual({ status: "excluded" });
  });

  it("목록에서 빼면 선택을 풀고 확인한 주소를 지운다", () => {
    const state = restaurantSelectionReducer(createState([createSelected("1")], ["1"]), {
      type: "exclude",
      kakaoPlaceId: "1",
    });

    expect(state.placeStatuses.get("1")).toEqual({ status: "excluded" });
    expect(state.confirmedAddresses).toEqual({});
  });

  it("확인한 주소를 기존 주소에 더해 저장한다", () => {
    const state = restaurantSelectionReducer(createState([], ["1"]), {
      type: "confirmAddresses",
      addresses: { "2": createAddress() },
    });

    expect(Object.keys(state.confirmedAddresses)).toEqual(["1", "2"]);
  });

  it("비우면 선택과 확인한 주소를 지우고 목록에서 뺀 식당은 남긴다", () => {
    const state = restaurantSelectionReducer(
      createState([createSelected("1"), ["2", { status: "excluded" }]], ["1"]),
      { type: "clear" },
    );

    expect([...state.placeStatuses]).toEqual([["2", { status: "excluded" }]]);
    expect(state.confirmedAddresses).toEqual({});
  });
});
