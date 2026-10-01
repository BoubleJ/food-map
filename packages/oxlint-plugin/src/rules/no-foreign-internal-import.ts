import { defineRule } from "@oxlint/plugins";
import { getFoodMapSettings } from "../settings.ts";

export const noForeignInternalImport = defineRule({
  meta: {
    type: "problem",
    messages: {
      foreign:
        "{{owner}}/{{kind}} 는 {{owner}} 안에서만 import 해주세요. 여러 기능이 쓰면 {{sharedFolder}}/{{kind}} 로 옮겨주세요.",
    },
  },
  create(context) {
    const { roleFolders, sharedFolder } = getFoodMapSettings(context.settings);
    const internalImport = new RegExp(`^@/(.+?)/(${Object.keys(roleFolders).join("|")})/`);

    return {
      ImportDeclaration({ source }) {
        const match = internalImport.exec(source.value);
        if (!match) return;
        const [, owner = "", kind = ""] = match;
        if (owner === sharedFolder || owner.startsWith(`${sharedFolder}/`)) return;
        if (!context.filename.includes(`/src/${owner}/`)) {
          context.report({
            node: source,
            messageId: "foreign",
            data: { owner, kind, sharedFolder },
          });
        }
      },
    };
  },
});
