import { Button, Group, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { type FormEvent, useRef } from "react";

interface SearchFormProps {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
  onSearch: (keyword: string) => void;
}

export function SearchForm({
  label,
  defaultValue,
  placeholder,
  maxLength,
  onSearch,
}: SearchFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = inputRef.current?.value.trim();
    if (!keyword) return;
    onSearch(keyword);
  };

  return (
    <form role="search" onSubmit={handleSubmit}>
      <Group gap="xs" wrap="nowrap">
        <TextInput
          ref={inputRef}
          aria-label={label}
          defaultValue={defaultValue}
          placeholder={placeholder}
          maxLength={maxLength}
          leftSection={<IconSearch size={16} />}
          flex={1}
        />
        <Button type="submit">검색</Button>
      </Group>
    </form>
  );
}
