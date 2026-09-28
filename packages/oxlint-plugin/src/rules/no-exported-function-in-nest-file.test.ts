import { ruleTester } from "../rule-tester.ts";
import { noExportedFunctionInNestFile } from "./no-exported-function-in-nest-file.ts";

const SERVICE_FILE = "/repo/apps/api/src/admin/place-search/place-search.service.ts";

ruleTester.run("no-exported-function-in-nest-file", noExportedFunctionInNestFile, {
  valid: [
    { code: 'export const KAKAO_LOCAL_CLIENT = "kakao-local";', filename: SERVICE_FILE },
    { code: "export class PlaceSearchService {}", filename: SERVICE_FILE },
    { code: "export interface PlaceCandidate { name: string }", filename: SERVICE_FILE },
    { code: "function createLabel() { return 1; }\nexport class A {}", filename: SERVICE_FILE },
    {
      code: "export function removeBuildingName() { return 1; }",
      filename: "/repo/apps/api/src/admin/address-search/utils/remove-building-name.ts",
    },
  ],
  invalid: [
    {
      code: "export function formatName() { return 1; }",
      filename: SERVICE_FILE,
      errors: [{ messageId: "exported" }],
    },
    {
      code: "export const toUpper = (value: string) => value.toUpperCase();",
      filename: "/repo/apps/api/src/admin/admin.controller.ts",
      errors: [{ messageId: "exported" }],
    },
    {
      code: "export const createClient = function () { return 1; };",
      filename: "/repo/apps/api/src/admin/admin.module.ts",
      errors: [{ messageId: "exported" }],
    },
  ],
});
