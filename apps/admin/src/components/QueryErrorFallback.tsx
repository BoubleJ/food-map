import { Alert, Button, Center, Stack, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { getErrorMessage } from "@/utils/error";

interface QueryErrorFallbackProps {
  title: string;
  error: unknown;
  onRetry: () => void;
}

export function QueryErrorFallback({ title, error, onRetry }: QueryErrorFallbackProps) {
  const handleRetry = () => {
    onRetry();
  };

  return (
    <Center h="100%" p="md">
      <Alert role="alert" w="100%" color="red" title={title} icon={<IconAlertCircle size={18} />}>
        <Stack gap="sm" align="flex-start">
          <Text size="sm">{getErrorMessage(error)}</Text>
          <Button size="xs" variant="outline" color="red" onClick={handleRetry}>
            다시 시도
          </Button>
        </Stack>
      </Alert>
    </Center>
  );
}
