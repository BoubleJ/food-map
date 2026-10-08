import { MultiSelect } from "@mantine/core";
import {
  RESTAURANT_CATEGORIES,
  RESTAURANT_CATEGORY_LABELS,
  type RestaurantCategory,
} from "@food-map/shared/restaurant";

interface CategoryMultiSelectProps {
  value: RestaurantCategory[];
  error?: string;
  onChange: (categories: RestaurantCategory[]) => void;
}

const CATEGORY_OPTIONS = RESTAURANT_CATEGORIES.map((category) => ({
  value: category,
  label: RESTAURANT_CATEGORY_LABELS[category],
}));

export function CategoryMultiSelect({ value, error, onChange }: CategoryMultiSelectProps) {
  return (
    <MultiSelect<RestaurantCategory>
      label="카테고리"
      placeholder="카테고리 검색"
      nothingFoundMessage="일치하는 카테고리가 없습니다"
      withAsterisk
      searchable
      clearable
      data={CATEGORY_OPTIONS}
      value={value}
      error={error}
      onChange={onChange}
    />
  );
}
