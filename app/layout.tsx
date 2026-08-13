import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://admind-decision-console.liyanbao06.chatgpt.site"),
  title: "AdMind — AI 广告决策引擎",
  description:
    "在履行商业约束的同时，识别内容高潮与自然转场，让视频广告少打断、可解释、可审计。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "AdMind — AI Ad Decision Engine",
    description: "同一商业目标，更少的用户打断。",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "AdMind AI Ad Decision Engine" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdMind — AI Ad Decision Engine",
    description: "同一商业目标，更少的用户打断。",
    images: ["/og.png"],
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
