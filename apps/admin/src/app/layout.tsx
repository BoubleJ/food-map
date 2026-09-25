import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "맛집 지도 관리자",
  description: "맛집 데이터 관리",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
