import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://admind-decision-console.liyanbao06.chatgpt.site"),
  title: "AdMind — Explainable AI decisions for less disruptive video ads",
  description: "AdMind combines video understanding, player state, and ethical boundaries to make explainable, lower-disruption advertising decisions.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "AdMind — Explainable AI video-ad decisions",
    description: "The same commercial goal, with less disruption for the viewer.",
    images: [{ url: "/og.png?v=2026-10-01", width: 1536, height: 1024, type: "image/png", alt: "AdMind: ads must appear without ruining the story — a CHARGE frame with a low-occlusion ad card and a timeline contrasting a traditional 00:45 slot with AdMind at 01:25" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdMind — Explainable AI video-ad decisions",
    description: "The same commercial goal, with less disruption for the viewer.",
    images: [{ url: "/og.png?v=2026-10-01", width: 1536, height: 1024, alt: "AdMind: ads must appear without ruining the story" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
