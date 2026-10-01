import { defineRule, type ESTree } from "@oxlint/plugins";

function isReactNodeType(type: ESTree.TSType) {
  if (type.type !== "TSTypeReference") return false;
  const { typeName } = type;
  if (typeName.type === "Identifier") return typeName.name === "ReactNode";
  return typeName.type === "TSQualifiedName" && typeName.right.name === "ReactNode";
}

export const preferPropsWithChildren = defineRule({
  meta: {
    type: "suggestion",
    messages: {
      childrenProp:
        "children: ReactNode 를 직접 선언하지 말고 PropsWithChildren<Props> 를 써주세요.",
    },
  },
  create(context) {
    return {
      TSPropertySignature(node) {
        const { key, typeAnnotation } = node;
        if (key.type !== "Identifier" || key.name !== "children" || !typeAnnotation) return;
        if (isReactNodeType(typeAnnotation.typeAnnotation)) {
          context.report({ node, messageId: "childrenProp" });
        }
      },
    };
  },
});
