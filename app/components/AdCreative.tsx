"use client";

import Image from "next/image";

type AdCreativeProps = {
  scenarioId: string;
  fullscreen: boolean;
  remaining: number;
  onDismiss?: () => void;
};

export function AdCreative({ scenarioId, fullscreen, remaining, onDismiss }: AdCreativeProps) {
  return (
    <>
      <Image
        alt="冰蓝色奇幻游戏广告画面"
        className="ad-creative-image"
        fill
        priority
        sizes={fullscreen ? "(max-width: 900px) 100vw, 1000px" : "310px"}
        src="/game-ad-clean.png?v=v0.3.0"
        unoptimized
      />
      {fullscreen ? (
        <>
          {onDismiss ? <button className="fullscreen-ad-skip" aria-label="跳过并关闭广告" onClick={onDismiss}>跳过广告</button> : null}
          <div className="ad-badge real-countdown">广告 · {remaining}s</div>
        </>
      ) : (
        <>
          <span className="native-ad-label">{scenarioId === "S2" ? "暂停广告 · 静音" : `广告 · ${remaining}s`}</span>
          <span className="native-muted">静音</span>
          {onDismiss ? <button className="native-ad-close" aria-label={scenarioId === "S2" ? "关闭广告，保留暂停画面" : "关闭广告"} onClick={onDismiss}>×</button> : null}
        </>
      )}
    </>
  );
}
