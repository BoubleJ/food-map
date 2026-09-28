import { ruleTester } from "../rule-tester.ts";
import { noNestedTypeLiteral } from "./no-nested-type-literal.ts";

ruleTester.run("no-nested-type-literal", noNestedTypeLiteral, {
  valid: [
    "interface AccountCardSns { provider: string }\ninterface AccountCard { sns: AccountCardSns[] }",
    "type Point = { x: number; y: number };",
    "function Button({ label }: { label: string }) { return label; }",
  ],
  invalid: [
    {
      code: "interface AccountCard { sns: { provider: string; isLinked: boolean }[] }",
      errors: [{ messageId: "nested" }],
    },
    {
      code: "interface Response { data: { id: string } }",
      errors: [{ messageId: "nested" }],
    },
    {
      code: "type Response = { meta: Record<string, { count: number }> };",
      errors: [{ messageId: "nested" }],
    },
  ],
});
