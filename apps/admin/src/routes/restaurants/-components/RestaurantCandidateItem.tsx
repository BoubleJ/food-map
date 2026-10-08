import {
  Anchor,
  Badge,
  Checkbox,
  CloseButton,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import type { RestaurantCandidate } from "@food-map/shared/admin/restaurant-search";
import type { ChangeEvent } from "react";

interface RestaurantCandidateItemProps {
  candidate: RestaurantCandidate;
  isSelected: boolean;
  isHovered: boolean;
  canSelect: boolean;
  onSelectedChange: (isSelected: boolean) => void;
  onLocate: () => void;
  onExclude: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export function RestaurantCandidateItem({
  candidate: { name, categoryName, roadAddress, placeUrl, isRegistered },
  isSelected,
  isHovered,
  canSelect,
  onSelectedChange,
  onLocate,
  onExclude,
  onHoverStart,
  onHoverEnd,
}: RestaurantCandidateItemProps) {
  const handleSelectedChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelectedChange(event.currentTarget.checked);
  };

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      bg={isHovered ? "blue.0" : "white"}
      bd={
        isHovered
          ? "1px solid var(--mantine-color-blue-3)"
          : "1px solid var(--mantine-color-default-border)"
      }
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <Group align="flex-start" gap="sm" wrap="nowrap">
        {isRegistered ? (
          <Badge variant="light" color="gray" style={{ flexShrink: 0 }}>
            등록됨
          </Badge>
        ) : (
          <Checkbox
            aria-label={`${name} 선택`}
            checked={isSelected}
            disabled={!isSelected && !canSelect}
            onChange={handleSelectedChange}
            mt={2}
          />
        )}
        <Stack gap={4} flex={1} miw={0}>
          <UnstyledButton onClick={onLocate}>
            <Stack gap={2}>
              <Text fw={700} c={isRegistered ? "gray.7" : undefined} truncate>
                {name}
              </Text>
              <Text size="xs" c="dimmed">
                {categoryName}
              </Text>
              <Text size="sm" c={isRegistered ? "dimmed" : "gray.7"}>
                {roadAddress}
              </Text>
            </Stack>
          </UnstyledButton>
          <Anchor
            href={placeUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            w="fit-content"
          >
            <Group gap={4} wrap="nowrap">
              카카오맵에서 보기
              <IconExternalLink size={12} />
            </Group>
          </Anchor>
        </Stack>
        <CloseButton aria-label={`${name} 목록에서 빼기`} onClick={onExclude} />
      </Group>
    </Paper>
  );
}
