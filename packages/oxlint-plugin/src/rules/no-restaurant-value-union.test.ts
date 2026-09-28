import { ruleTester } from "../rule-tester.ts";
import { noRestaurantValueUnion } from "./no-restaurant-value-union.ts";

ruleTester.run("no-restaurant-value-union", noRestaurantValueUnion, {
  valid: [
    'type OrderType = "like" | "recent";',
    'import type { RestaurantCategory } from "@food-map/shared/restaurant";\ntype Filter = RestaurantCategory | "all";',
    {
      code: 'type Category = "restaurant" | "cafe";',
      filename: "/repo/packages/shared/src/restaurant.ts",
    },
  ],
  invalid: [
    { code: 'type Category = "restaurant" | "cafe";', errors: [{ messageId: "union" }] },
    { code: 'let cuisine: "korean" | "japanese";', errors: [{ messageId: "union" }] },
    { code: 'type Filter = "all" | "bar";', errors: [{ messageId: "union" }] },
  ],
});
