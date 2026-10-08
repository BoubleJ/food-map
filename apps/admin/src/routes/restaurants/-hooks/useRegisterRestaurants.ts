import { isDefinedError } from "@orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/error";
import { showErrorNotification, showSuccessNotification } from "@/utils/notification";
import { orpc } from "@/utils/orpc";

interface UseRegisterRestaurantsParams {
  onConflict: (kakaoPlaceIds: string[]) => void;
}

export function useRegisterRestaurants({ onConflict }: UseRegisterRestaurantsParams) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.admin.restaurantRegister.mutationOptions({
      onSuccess: async (_, { restaurants }) => {
        showSuccessNotification({
          title: `${restaurants.length}개 식당을 등록했습니다`,
          message: restaurants.map(({ name }) => name).join(", "),
        });
        await queryClient.invalidateQueries({ queryKey: orpc.admin.restaurantSearch.key() });
      },
      onError: (error, { restaurants }) => {
        if (isDefinedError(error) && error.code === "CONFLICT") {
          const { kakaoPlaceIds } = error.data;
          const conflictNames = restaurants
            .filter(({ kakaoPlaceId }) => kakaoPlaceIds.includes(kakaoPlaceId))
            .map(({ name }) => name);
          onConflict(kakaoPlaceIds);
          showErrorNotification({
            title: "이미 등록된 식당이 있습니다",
            message: `${conflictNames.join(", ")}을 선택에서 뺐습니다. 남은 식당을 다시 등록해 주세요.`,
          });
          return;
        }
        showErrorNotification({
          title: "식당 등록에 실패했습니다",
          message: getErrorMessage(error),
        });
      },
    }),
  );
}
