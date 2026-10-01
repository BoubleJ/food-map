import { defineRule } from "@oxlint/plugins";
import { createNestFilePattern, getFoodMapSettings } from "../settings.ts";

export const nestFileLocation = defineRule({
  meta: {
    type: "suggestion",
    messages: {
      misplaced:
        "service, controller, module 파일은 {{folder}}/ 가 아니라 기능 폴더 바로 아래에 둬주세요.",
    },
  },
  create(context) {
    const { filename } = context;
    const settings = getFoodMapSettings(context.settings);
    if (!createNestFilePattern(settings).test(filename)) return {};
    const folder = filename.split("/").find((segment) => segment in settings.roleFolders);
    if (!folder) return {};

    return {
      Program(node) {
        context.report({ node, messageId: "misplaced", data: { folder } });
      },
    };
  },
});
