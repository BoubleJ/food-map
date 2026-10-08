import { Box, Center, Stack, Text } from "@mantine/core";
import type { ReactElement } from "react";

interface EmptyStateProps {
  icon?: ReactElement;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Center h="100%" p="lg">
      <Stack align="center" gap="xs" ta="center">
        {icon && (
          <Box c="gray.5" lh={0}>
            {icon}
          </Box>
        )}
        <Text fw={700}>{title}</Text>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
      </Stack>
    </Center>
  );
}
