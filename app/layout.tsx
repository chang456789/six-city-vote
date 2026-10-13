import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "六都模擬投票｜2026 直轄市長選舉",
  description: "2026 年臺北、新北、桃園、臺中、臺南、高雄市長選舉線上模擬投票。不收集任何個人資料，一台裝置一票。",
  openGraph: {
    title: "六都模擬投票｜2026 直轄市長選舉",
    description: "匿名、一台裝置一票。投完立即看各都模擬開票。",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E2022",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@600;900&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
