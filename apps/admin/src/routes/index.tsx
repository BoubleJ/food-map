import { Center, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Center mih="100dvh">
      <Stack align="center" gap="xs">
        <Title order={2}>맛집 지도 관리자</Title>
        <Text size="sm" c="dimmed">
          admin · Vite + TanStack Router + Mantine 세팅 완료
        </Text>
      </Stack>
    </Center>
  );
}
