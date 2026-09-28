import { RESTAURANT_CATEGORIES, RESTAURANT_CUISINES } from "@food-map/shared/restaurant";
import { defineRule } from "@oxlint/plugins";

const RESTAURANT_VALUES = new Set<string>([...RESTAURANT_CATEGORIES, ...RESTAURANT_CUISINES]);
const DEFINITION_FILE = "packages/shared/src/restaurant.ts";

export const noRestaurantValueUnion = defineRule({
  meta: {
    type: "problem",
    messages: {
      union:
        "업종, 요리 종류 유니온을 새로 선언하지 말고 @food-map/shared/restaurant 의 RestaurantCategory, RestaurantCuisine 을 쓴다.",
    },
  },
  create(context) {
    if (context.filename.endsWith(DEFINITION_FILE)) return {};

    return {
      TSUnionType(node) {
        const hasRestaurantValue = node.types.some(
          (member) =>
            member.type === "TSLiteralType" &&
            member.literal.type === "Literal" &&
            typeof member.literal.value === "string" &&
            RESTAURANT_VALUES.has(member.literal.value),
        );
        if (hasRestaurantValue) {
          context.report({ node, messageId: "union" });
        }
      },
    };
  },
});
