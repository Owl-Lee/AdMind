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
    images: [{ url: "/og-attio-story.png", width: 1664, height: 936, alt: "AdMind 产品决策旅程演示" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdMind｜广告需要出现，也不必毁掉剧情",
    description: "同一个商业目标，更少的用户打断。",
    images: ["/og-attio-story.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
