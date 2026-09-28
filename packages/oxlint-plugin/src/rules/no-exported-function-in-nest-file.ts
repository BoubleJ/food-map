import { defineRule, type ESTree } from "@oxlint/plugins";
import { createNestFilePattern, getFoodMapSettings } from "../settings.ts";

function isFunctionDeclaration(declaration: ESTree.Declaration) {
  if (declaration.type === "FunctionDeclaration") return true;
  return (
    declaration.type === "VariableDeclaration" &&
    declaration.declarations.some(
      ({ init }) => init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression",
    )
  );
}

export const noExportedFunctionInNestFile = defineRule({
  meta: {
    type: "suggestion",
    messages: {
      exported:
        "service, controller, module 파일에서 함수를 export 하지 않는다. 다른 파일에서 쓰는 함수는 utils/ 로 옮긴다.",
    },
  },
  create(context) {
    const nestFilePattern = createNestFilePattern(getFoodMapSettings(context.settings));
    if (!nestFilePattern.test(context.filename)) return {};

    return {
      ExportNamedDeclaration(node) {
        const { declaration } = node;
        if (declaration && isFunctionDeclaration(declaration)) {
          context.report({ node, messageId: "exported" });
        }
      },
    };
  },
});
