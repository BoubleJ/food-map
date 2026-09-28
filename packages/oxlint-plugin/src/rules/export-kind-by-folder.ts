import { defineRule, type ESTree } from "@oxlint/plugins";
import { type ExportKind, getFoodMapSettings } from "../settings.ts";

const EXPORT_KIND_LABEL: Record<ExportKind, string> = {
  type: "타입",
  function: "함수",
  constant: "상수",
  class: "클래스",
};

function getParentFolder(filename: string) {
  const segments = filename.split("/");
  return segments.at(-2) ?? "";
}

function isFunctionInit(init: ESTree.Expression | null | undefined) {
  return init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression";
}

function getExportKinds(declaration: ESTree.Declaration): ExportKind[] {
  switch (declaration.type) {
    case "TSInterfaceDeclaration":
    case "TSTypeAliasDeclaration":
      return ["type"];
    case "ClassDeclaration":
      return ["class"];
    case "FunctionDeclaration":
      return ["function"];
    case "VariableDeclaration":
      return declaration.declarations.map(({ init }) =>
        isFunctionInit(init) ? "function" : "constant",
      );
    case "TSEnumDeclaration":
      return ["constant"];
    default:
      return [];
  }
}

export const exportKindByFolder = defineRule({
  meta: {
    type: "suggestion",
    messages: {
      wrongKind: "{{folder}}/ 에서는 {{allowed}}만 export 한다.",
      typeOutsideTypes: "export 하는 타입은 types/ 에 둔다. 이 파일에서만 쓰면 export 하지 않는다.",
    },
  },
  create(context) {
    const folder = getParentFolder(context.filename);
    const { roleFolders } = getFoodMapSettings(context.settings);
    const allowed = roleFolders[folder];

    return {
      ExportNamedDeclaration(node) {
        const { declaration } = node;
        if (!declaration) return;

        for (const kind of getExportKinds(declaration)) {
          if (allowed && kind !== allowed) {
            context.report({
              node,
              messageId: "wrongKind",
              data: { folder, allowed: EXPORT_KIND_LABEL[allowed] },
            });
            return;
          }
          if (!allowed && kind === "type") {
            context.report({ node, messageId: "typeOutsideTypes" });
            return;
          }
        }
      },
    };
  },
});
