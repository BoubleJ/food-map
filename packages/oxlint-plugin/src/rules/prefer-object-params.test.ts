import { ruleTester } from "../rule-tester.ts";
import { preferObjectParams } from "./prefer-object-params.ts";

ruleTester.run("prefer-object-params", preferObjectParams, {
  valid: [
    "function search(keyword: string, page: number) {}",
    "function search({ keyword, page, rect }: SearchParams) {}",
    "const search = (keyword: string, page: number) => {};",
    "class A { search(keyword: string, page: number) {} }",
    "class A { constructor(private readonly a: A, private readonly b: B, private readonly c: C) {} }",
    "[1, 2].reduce((acc, cur, index) => acc + cur + index, 0);",
    "items.forEach(function (item, index, array) {});",
    "new Promise((resolve, reject, extra) => {});",
    "function bind(this: Window, a: string, b: string) {}",
  ],
  invalid: [
    {
      code: "function search(keyword: string, page: number, rect: Rect) {}",
      errors: [{ messageId: "tooManyParams" }],
    },
    {
      code: "const search = (keyword: string, page: number, rect: Rect) => {};",
      errors: [{ messageId: "tooManyParams" }],
    },
    {
      code: "const search = function (keyword: string, page: number, rect: Rect) {};",
      errors: [{ messageId: "tooManyParams" }],
    },
    {
      code: "class A { private search(keyword: string, page: number, rect: Rect) {} }",
      errors: [{ messageId: "tooManyParams" }],
    },
    {
      code: "const api = { run(name: string, rule: Rule, tests: Tests) {} };",
      errors: [{ messageId: "tooManyParams" }],
    },
    {
      code: "function request(path: string, query: Query, message: string, retryCount = 0) {}",
      errors: [{ messageId: "tooManyParams" }],
    },
  ],
});
