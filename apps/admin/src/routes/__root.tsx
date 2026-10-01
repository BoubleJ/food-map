import { Center, Stack, Text, Title } from "@mantine/core";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return <Outlet />;
}

function NotFound() {
  return (
    <Center mih="100dvh">
      <Stack align="center" gap="xs">
        <Title order={2}>404</Title>
        <Text size="sm" c="dimmed">
          요청하신 페이지를 찾을 수 없습니다.
        </Text>
      </Stack>
    </Center>
  );
}
