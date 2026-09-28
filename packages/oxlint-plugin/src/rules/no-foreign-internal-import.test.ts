import { ruleTester } from "../rule-tester.ts";
import { noForeignInternalImport } from "./no-foreign-internal-import.ts";

const REMOVE_BUILDING_NAME =
  'import { removeBuildingName } from "@/admin/address-search/utils/remove-building-name";';

ruleTester.run("no-foreign-internal-import", noForeignInternalImport, {
  valid: [
    {
      code: REMOVE_BUILDING_NAME,
      filename: "/repo/apps/api/src/admin/address-search/address-search.service.ts",
    },
    {
      code: REMOVE_BUILDING_NAME,
      filename: "/repo/apps/api/src/admin/address-search/utils/other.ts",
    },
    {
      code: 'import { SearchKeywordQuery } from "@/admin/dto/search-keyword.query";',
      filename: "/repo/apps/api/src/admin/place-search/place-search.controller.ts",
    },
    {
      code: 'import { formatDate } from "@/shared/utils/format-date";',
      filename: "/repo/apps/api/src/admin/place-search/place-search.service.ts",
    },
    {
      code: 'import { AdminModule } from "@/admin/admin.module";',
      filename: "/repo/apps/api/src/app.module.ts",
    },
  ],
  invalid: [
    {
      code: REMOVE_BUILDING_NAME,
      filename: "/repo/apps/api/src/admin/place-search/place-search.service.ts",
      errors: [{ messageId: "foreign" }],
    },
    {
      code: 'import { SearchKeywordQuery } from "@/admin/dto/search-keyword.query";',
      filename: "/repo/apps/api/src/restaurants/restaurants.controller.ts",
      errors: [{ messageId: "foreign" }],
    },
    {
      code: 'import type { Coordinate } from "@/admin/address-search/types/coordinate";',
      filename: "/repo/apps/api/src/app.module.ts",
      errors: [{ messageId: "foreign" }],
    },
  ],
});
