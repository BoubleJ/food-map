import { Box, Flex, Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { KakaoMap } from "@/components/KakaoMap";
import { RestaurantRegisterHeader } from "@/routes/restaurants/-components/RestaurantRegisterHeader";

const restaurantRegisterSearchSchema = z.object({
  keyword: z.string().trim().min(1).max(40).optional().catch(undefined),
});

export const Route = createFileRoute("/restaurants/new")({
  validateSearch: restaurantRegisterSearchSchema,
  component: RestaurantRegisterPage,
});

function RestaurantRegisterPage() {
  return (
    <Stack h="100dvh" gap={0}>
      <RestaurantRegisterHeader />
      <Flex flex={1} mih={0}>
        <Box flex={2} miw={0}>
          <KakaoMap />
        </Box>
        <Box
          component="aside"
          flex={1}
          miw={0}
          bg="gray.0"
          style={{ borderLeft: "1px solid var(--mantine-color-default-border)" }}
        />
      </Flex>
    </Stack>
  );
}
