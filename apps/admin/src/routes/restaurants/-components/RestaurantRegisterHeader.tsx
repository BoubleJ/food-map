import { Box, Group, Title } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { SearchForm } from "@/components/SearchForm";

export function RestaurantRegisterHeader() {
  const { keyword } = useSearch({ from: "/restaurants/new" });
  const navigate = useNavigate({ from: "/restaurants/new" });

  const handleSearch = (nextKeyword: string) => {
    if (nextKeyword === keyword) return;
    navigate({ search: { keyword: nextKeyword } });
  };

  return (
    <Group
      component="header"
      h={72}
      px="lg"
      gap="xl"
      wrap="nowrap"
      style={{ flexShrink: 0, borderBottom: "1px solid var(--mantine-color-default-border)" }}
    >
      <Title order={1} fz="lg">
        식당 등록
      </Title>
      <Box w={420}>
        <SearchForm
          key={keyword}
          label="식당명"
          defaultValue={keyword}
          placeholder="식당명을 입력하세요"
          maxLength={40}
          onSearch={handleSearch}
        />
      </Box>
    </Group>
  );
}
