import { ruleTester } from "../rule-tester.ts";
import { noTypePrefix } from "./no-type-prefix.ts";

ruleTester.run("no-type-prefix", noTypePrefix, {
  valid: [
    "interface User { name: string }",
    'type OrderType = "like" | "recent";',
    "type ID = string;",
    "type TTL = number;",
    "interface IPAddress { value: string }",
    "interface Item { id: string }",
    "type Tab = 'home';",
  ],
  invalid: [
    { code: "interface IUser { name: string }", errors: [{ messageId: "prefixed" }] },
    { code: 'type TOrderType = "like" | "recent";', errors: [{ messageId: "prefixed" }] },
    { code: "interface IHost { url: string }", errors: [{ messageId: "prefixed" }] },
  ],
});
