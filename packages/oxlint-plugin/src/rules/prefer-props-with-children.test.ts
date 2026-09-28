import { ruleTester } from "../rule-tester.ts";
import { preferPropsWithChildren } from "./prefer-props-with-children.ts";

ruleTester.run("prefer-props-with-children", preferPropsWithChildren, {
  valid: [
    "interface LayoutProps { title: string }",
    "interface ListProps { children: string[] }",
    "interface RenderProps { renderItem: () => ReactNode }",
  ],
  invalid: [
    {
      code: "interface LayoutProps { title: string; children: ReactNode }",
      errors: [{ messageId: "childrenProp" }],
    },
    {
      code: "interface LayoutProps { children?: React.ReactNode }",
      errors: [{ messageId: "childrenProp" }],
    },
    {
      code: "function Layout({ children }: { children: ReactNode }) { return children; }",
      errors: [{ messageId: "childrenProp" }],
    },
  ],
});
