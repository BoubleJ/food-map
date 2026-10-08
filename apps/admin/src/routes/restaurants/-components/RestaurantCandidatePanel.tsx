import { Box, Button, Group, ScrollArea, Skeleton, Stack, Text, Title } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import type { PropsWithChildren } from "react";
import { EmptyState } from "@/components/EmptyState";
import { QueryBoundary } from "@/components/QueryBoundary";
import { QueryErrorFallback } from "@/components/QueryErrorFallback";
import { MAX_SELECTED_COUNT } from "@/routes/restaurants/-hooks/useRestaurantSelection";

interface RestaurantCandidatePanelProps {
  keyword?: string;
  selectedCount: number;
  onRegisterClick: () => void;
}

const SKELETON_COUNT = 5;

export function RestaurantCandidatePanel({
  keyword,
  selectedCount,
  onRegisterClick,
  children,
}: PropsWithChildren<RestaurantCandidatePanelProps>) {
  return (
    <>
      {keyword ? (
        <>
          <Group justify="space-between" px="lg" pt="md" pb="sm">
            <Title order={2} fz="md">
              '{keyword}' 검색 결과
            </Title>
            <Text size="xs" c="dimmed">
              전국
            </Text>
          </Group>
          <ScrollArea flex={1} px="lg" pb="sm">
            <QueryBoundary
              pendingFallback={
                <Stack gap="xs">
                  {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                    <Skeleton key={index} h={104} radius="md" />
                  ))}
                </Stack>
              }
              errorFallback={({ error, resetErrorBoundary }) => (
                <QueryErrorFallback
                  title="검색에 실패했습니다"
                  error={error}
                  onRetry={() => resetErrorBoundary()}
                />
              )}
            >
              {children}
            </QueryBoundary>
          </ScrollArea>
        </>
      ) : (
        <Box flex={1}>
          <EmptyState
            icon={<IconSearch size={36} />}
            title="식당명을 검색하세요"
            description="카카오 장소 검색 결과에서 등록할 식당을 고릅니다"
          />
        </Box>
      )}
      <Group
        justify="space-between"
        px="lg"
        py="sm"
        bg="white"
        style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
      >
        <Text size="sm">
          <b>{selectedCount}개</b> 선택됨{" "}
          <Text span c="dimmed">
            (최대 {MAX_SELECTED_COUNT}개)
          </Text>
        </Text>
        <Button disabled={selectedCount === 0} onClick={onRegisterClick}>
          등록
        </Button>
      </Group>
    </>
  );
}
