import { definePlugin } from "@oxlint/plugins";
import { exportKindByFolder } from "./rules/export-kind-by-folder.ts";
import { nestFileLocation } from "./rules/nest-file-location.ts";
import { noExportedFunctionInNestFile } from "./rules/no-exported-function-in-nest-file.ts";
import { noForeignInternalImport } from "./rules/no-foreign-internal-import.ts";
import { noNestedTypeLiteral } from "./rules/no-nested-type-literal.ts";
import { noRestaurantValueUnion } from "./rules/no-restaurant-value-union.ts";
import { noTypePrefix } from "./rules/no-type-prefix.ts";
import { preferObjectParams } from "./rules/prefer-object-params.ts";
import { preferPropsWithChildren } from "./rules/prefer-props-with-children.ts";

const plugin = definePlugin({
  meta: { name: "food-map" },
  rules: {
    "export-kind-by-folder": exportKindByFolder,
    "nest-file-location": nestFileLocation,
    "no-exported-function-in-nest-file": noExportedFunctionInNestFile,
    "no-foreign-internal-import": noForeignInternalImport,
    "no-nested-type-literal": noNestedTypeLiteral,
    "no-restaurant-value-union": noRestaurantValueUnion,
    "no-type-prefix": noTypePrefix,
    "prefer-object-params": preferObjectParams,
    "prefer-props-with-children": preferPropsWithChildren,
  },
});

export default plugin;
