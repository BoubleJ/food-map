import { defineRule, type ESTree } from "@oxlint/plugins";

function getNullishName(node: ESTree.Expression) {
  if (node.type === "Identifier" && node.name === "undefined") return "undefined";
  if (node.type === "Literal" && node.value === null && node.raw === "null") return "null";
  if (node.type === "UnaryExpression" && node.operator === "void") return "void";
  return null;
}

export const noNullishTernaryConsequent = defineRule({
  meta: {
    type: "suggestion",
    messages: {
      nullishConsequent:
        "삼항연산자의 참 분기에 {{value}} 값을 쓰지 말아주세요. &&, ||, ??, 스프레드 문법을 쓰거나 조건을 뒤집어주세요.",
    },
  },
  create(context) {
    return {
      ConditionalExpression(node) {
        const value = getNullishName(node.consequent);
        if (value) context.report({ node, messageId: "nullishConsequent", data: { value } });
      },
    };
  },
});
