import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://admind-decision-console.liyanbao06.chatgpt.site"),
  title: "AdMind｜广告需要出现，也不必毁掉剧情",
  description: "AdMind 结合视频理解、播放状态与伦理边界，为长视频生成更少打断、可解释的广告决策。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "AdMind｜广告需要出现，也不必毁掉剧情",
    description: "同一个商业目标，更少的用户打断。",
    images: [{ url: "/og-localsend-refresh.png", width: 1536, height: 1024, alt: "AdMind 广告决策演示" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdMind｜广告需要出现，也不必毁掉剧情",
    description: "同一个商业目标，更少的用户打断。",
    images: ["/og-localsend-refresh.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
