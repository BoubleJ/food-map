import { definePlugin } from "@oxlint/plugins";
import { noNestedTypeLiteral } from "./rules/no-nested-type-literal.ts";
import { noRestaurantValueUnion } from "./rules/no-restaurant-value-union.ts";
import { noTypePrefix } from "./rules/no-type-prefix.ts";
import { preferPropsWithChildren } from "./rules/prefer-props-with-children.ts";

const plugin = definePlugin({
  meta: { name: "food-map" },
  rules: {
    "no-nested-type-literal": noNestedTypeLiteral,
    "no-restaurant-value-union": noRestaurantValueUnion,
    "no-type-prefix": noTypePrefix,
    "prefer-props-with-children": preferPropsWithChildren,
  },
});

export default plugin;
