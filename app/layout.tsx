import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdMind — Commercially-aware ad orchestration",
  description:
    "A policy-first AI decision system that makes video advertising less disruptive without ignoring commercial commitments.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
