import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "맛집 지도" },
    { name: "description", content: "지도에서 찾는 맛집" },
  ];
}

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">맛집 지도</h1>
      <p className="text-sm opacity-60">web · React Router 세팅 완료</p>
    </main>
  );
}
