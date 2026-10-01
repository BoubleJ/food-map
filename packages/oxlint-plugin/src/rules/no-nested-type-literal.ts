import { defineRule, type ESTree } from "@oxlint/plugins";

const TYPE_BOUNDARIES = new Set(["TSInterfaceDeclaration", "TSTypeAliasDeclaration", "Program"]);

function isInsideProperty(node: ESTree.Node) {
  let current = node.parent;
  while (current && !TYPE_BOUNDARIES.has(current.type)) {
    if (current.type === "TSPropertySignature") return true;
    current = current.parent;
  }
  return false;
}

export const noNestedTypeLiteral = defineRule({
  meta: {
    type: "suggestion",
    messages: {
      nested: "속성 안에 객체 타입을 직접 쓰지 말고 이름 있는 타입으로 분리해주세요.",
    },
  },
  create(context) {
    return {
      TSTypeLiteral(node) {
        if (isInsideProperty(node)) {
          context.report({ node, messageId: "nested" });
        }
      },
    };
  },
});
