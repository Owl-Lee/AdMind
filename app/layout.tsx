import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://admind-decision-console.liyanbao06.chatgpt.site"),
  title: "AdMind — 广告必须出现，也不必毁掉剧情",
  description:
    "在履行商业约束的同时，识别内容高潮与自然转场，让视频广告少打断、可解释、可审计。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "AdMind — 广告必须出现，也不必毁掉剧情",
    description: "同一商业目标，更少的用户打断。",
    images: [{ url: "/og-showcase.png", width: 1536, height: 1024, alt: "AdMind 广告决策演示" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdMind — 广告必须出现，也不必毁掉剧情",
    description: "同一商业目标，更少的用户打断。",
    images: ["/og-showcase.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
