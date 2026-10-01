import { defineRule, type ESTree } from "@oxlint/plugins";

const PREFIXED_NAME = /^[IT][A-Z][a-z]/;

export const noTypePrefix = defineRule({
  meta: {
    type: "suggestion",
    messages: {
      prefixed: "타입 이름에 I, T 접두사를 붙이지 말아주세요: {{name}}",
    },
  },
  create(context) {
    function checkName({ id }: ESTree.TSInterfaceDeclaration | ESTree.TSTypeAliasDeclaration) {
      if (PREFIXED_NAME.test(id.name)) {
        context.report({ node: id, messageId: "prefixed", data: { name: id.name } });
      }
    }

    return {
      TSInterfaceDeclaration: checkName,
      TSTypeAliasDeclaration: checkName,
    };
  },
});
