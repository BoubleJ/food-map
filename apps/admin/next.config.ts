import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 멀티스테이지 빌드에서 최소 런타임만 복사하기 위해 필요하다.
  output: "standalone",
  // 모노레포 루트를 기준으로 standalone 산출물을 만든다.
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
  transpilePackages: ["@food-map/shared"],
};

export default nextConfig;
