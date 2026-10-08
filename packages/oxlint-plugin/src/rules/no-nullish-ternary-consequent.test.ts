import { ruleTester } from "../rule-tester.ts";
import { noNullishTernaryConsequent } from "./no-nullish-ternary-consequent.ts";

ruleTester.run("no-nullish-ternary-consequent", noNullishTernaryConsequent, {
  valid: [
    "const label = isOpen ? '열림' : '닫힘';",
    "const label = isOpen ? '열림' : undefined;",
    "const sigungu = sggNm ? sggNm : null;",
    "const label = isOpen && '열림';",
    "const name = value ?? null;",
    "const query = { ...(rect && { rect }) };",
    "const element = <div>{count > 0 ? <Badge /> : null}</div>;",
  ],
  invalid: [
    {
      code: "const label = isOpen ? undefined : '닫힘';",
      errors: [{ messageId: "nullishConsequent" }],
    },
    {
      code: "const sigungu = sggNm === '' ? null : sggNm;",
      errors: [{ messageId: "nullishConsequent" }],
    },
    {
      code: "const value = isEmpty ? void 0 : value;",
      errors: [{ messageId: "nullishConsequent" }],
    },
    {
      code: "const element = <div>{isLoading ? null : <List />}</div>;",
      errors: [{ messageId: "nullishConsequent" }],
    },
    {
      code: "function find(id: string) { return id ? undefined : load(); }",
      errors: [{ messageId: "nullishConsequent" }],
    },
  ],
});
