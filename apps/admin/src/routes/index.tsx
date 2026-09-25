import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2">
      <h1 className="text-2xl font-semibold">맛집 지도 관리자</h1>
      <p className="text-sm opacity-60">admin · Vite + TanStack Router 세팅 완료</p>
    </main>
  );
}
