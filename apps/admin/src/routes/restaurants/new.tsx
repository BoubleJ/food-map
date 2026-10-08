import { Stack } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { RestaurantRegisterContent } from "@/routes/restaurants/-components/RestaurantRegisterContent";
import { RestaurantRegisterHeader } from "@/routes/restaurants/-components/RestaurantRegisterHeader";

const restaurantRegisterSearchSchema = z.object({
  keyword: z.string().trim().min(1).max(40).optional().catch(undefined),
  panel: z.literal("form").optional().catch(undefined),
});

export const Route = createFileRoute("/restaurants/new")({
  validateSearch: restaurantRegisterSearchSchema,
  component: RestaurantRegisterPage,
});

function RestaurantRegisterPage() {
  const { keyword } = Route.useSearch();

  return (
    <Stack h="100dvh" gap={0}>
      <RestaurantRegisterHeader />
      <RestaurantRegisterContent key={keyword ?? ""} keyword={keyword} />
    </Stack>
  );
}
