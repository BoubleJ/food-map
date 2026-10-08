import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/utils/error";
import { showErrorNotification } from "@/utils/notification";
import { orpc } from "@/utils/orpc";

export function useLookupAddresses() {
  return useMutation(
    orpc.admin.addressLookup.mutationOptions({
      onError: (error) => {
        showErrorNotification({
          title: "주소 조회에 실패했습니다",
          message: getErrorMessage(error),
        });
      },
    }),
  );
}
