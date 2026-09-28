import { ruleTester } from "../rule-tester.ts";
import { nestFileLocation } from "./nest-file-location.ts";

const CODE = "export class Placeholder {}";

ruleTester.run("nest-file-location", nestFileLocation, {
  valid: [
    { code: CODE, filename: "/repo/apps/api/src/admin/address-search/address-search.service.ts" },
    { code: CODE, filename: "/repo/apps/api/src/admin/admin.module.ts" },
    {
      code: CODE,
      filename: "/repo/apps/api/src/admin/address-search/utils/remove-building-name.ts",
    },
  ],
  invalid: [
    {
      code: CODE,
      filename: "/repo/apps/api/src/admin/address-search/utils/address.service.ts",
      errors: [{ messageId: "misplaced" }],
    },
    {
      code: CODE,
      filename: "/repo/apps/api/src/admin/dto/search.controller.ts",
      errors: [{ messageId: "misplaced" }],
    },
  ],
});
