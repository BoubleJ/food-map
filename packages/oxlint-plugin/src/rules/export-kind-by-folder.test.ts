import { ruleTester } from "../rule-tester.ts";
import { exportKindByFolder } from "./export-kind-by-folder.ts";

const FEATURE = "/repo/apps/api/src/admin/address-search";

ruleTester.run("export-kind-by-folder", exportKindByFolder, {
  valid: [
    {
      code: "export interface JusoSearchItem { siNm: string }",
      filename: `${FEATURE}/types/juso-search-item.ts`,
    },
    { code: "export type Tab = 'a';", filename: `${FEATURE}/types/tab.ts` },
    {
      code: "export function removeBuildingName() { return 1; }",
      filename: `${FEATURE}/utils/remove-building-name.ts`,
    },
    {
      code: "export const toUpper = (value: string) => value.toUpperCase();",
      filename: `${FEATURE}/utils/to-upper.ts`,
    },
    { code: 'export const JUSO_SUCCESS_CODE = "0";', filename: `${FEATURE}/constants/juso.ts` },
    {
      code: "export class SearchKeywordQuery {}",
      filename: "/repo/apps/api/src/admin/dto/search-keyword.query.ts",
    },
    {
      code: "interface Local { id: string }\nexport class AddressSearchService {}",
      filename: `${FEATURE}/address-search.service.ts`,
    },
    {
      code: 'export const JUSO_CLIENT = "juso";',
      filename: `${FEATURE}/address-search.service.ts`,
    },
  ],
  invalid: [
    {
      code: "export interface PlaceCandidate { name: string }",
      filename: "/repo/apps/api/src/admin/place-search/place-search.service.ts",
      errors: [{ messageId: "typeOutsideTypes" }],
    },
    {
      code: "export interface JusoSearchItem { siNm: string }\nexport function removeBuildingName() { return 1; }",
      filename: `${FEATURE}/utils/remove-building-name.ts`,
      errors: [{ messageId: "wrongKind" }],
    },
    {
      code: "export function createKey() { return 1; }",
      filename: `${FEATURE}/types/juso-search-item.ts`,
      errors: [{ messageId: "wrongKind" }],
    },
    {
      code: 'export const LABEL = "x";',
      filename: `${FEATURE}/utils/label.ts`,
      errors: [{ messageId: "wrongKind" }],
    },
    {
      code: "export const createCode = () => 1;",
      filename: `${FEATURE}/constants/code.ts`,
      errors: [{ messageId: "wrongKind" }],
    },
    {
      code: "export interface SearchKeyword { keyword: string }",
      filename: "/repo/apps/api/src/admin/dto/search-keyword.query.ts",
      errors: [{ messageId: "wrongKind" }],
    },
  ],
});
