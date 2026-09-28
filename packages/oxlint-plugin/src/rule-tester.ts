import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";

RuleTester.describe = describe;
RuleTester.it = it;

const TEST_SETTINGS = {
  "food-map": {
    roleFolders: { types: "type", utils: "function", constants: "constant", dto: "class" },
    nestFileKinds: ["module", "controller", "service"],
    sharedFolder: "shared",
    sharedChildFolders: ["decorators", "filters", "guards", "interceptors", "middleware", "pipes"],
    infraFolders: { database: ["schema"] },
  },
};

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: "tsx" } },
});

type RunParameters = Parameters<RuleTester["run"]>;

export const ruleTester = {
  run(ruleName: RunParameters[0], rule: RunParameters[1], { valid, invalid }: RunParameters[2]) {
    tester.run(ruleName, rule, {
      valid: valid.map((test) => ({
        ...(typeof test === "string" ? { code: test } : test),
        settings: TEST_SETTINGS,
      })),
      invalid: invalid.map((test) => ({ ...test, settings: TEST_SETTINGS })),
    });
  },
};
