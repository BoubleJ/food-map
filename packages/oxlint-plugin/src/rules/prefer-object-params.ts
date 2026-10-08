import { defineRule, type ESTree } from "@oxlint/plugins";

const MAX_PARAMS = 2;

type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;

function isConstructor({ parent }: FunctionNode) {
  return parent?.type === "MethodDefinition" && parent.kind === "constructor";
}

function isCallbackArgument(node: FunctionNode) {
  const { parent } = node;
  return (
    (parent?.type === "CallExpression" || parent?.type === "NewExpression") &&
    parent.arguments.includes(node)
  );
}

function countParams({ params }: FunctionNode) {
  return params.filter((param) => !(param.type === "Identifier" && param.name === "this")).length;
}

export const preferObjectParams = defineRule({
  meta: {
    type: "suggestion",
    messages: {
      tooManyParams: "인자가 {{max}}개를 넘으면 객체 하나로 묶어주세요. 지금 {{count}}개입니다.",
    },
  },
  create(context) {
    function checkParams(node: FunctionNode) {
      if (isConstructor(node) || isCallbackArgument(node)) return;

      const count = countParams(node);
      if (count > MAX_PARAMS) {
        context.report({
          node,
          messageId: "tooManyParams",
          data: { max: String(MAX_PARAMS), count: String(count) },
        });
      }
    }

    return {
      FunctionDeclaration: checkParams,
      FunctionExpression: checkParams,
      ArrowFunctionExpression: checkParams,
    };
  },
});
