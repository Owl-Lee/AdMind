"use client";

import Image from "next/image";

type AdCreativeProps = {
  scenarioId: string;
  fullscreen: boolean;
  remaining: number;
  onDismiss?: () => void;
};

export function AdCreative({ scenarioId, fullscreen, remaining, onDismiss }: AdCreativeProps) {
  if (scenarioId === "S2") {
    return (
      <>
        <div className={fullscreen ? "nova-creative nova-fullscreen" : "nova-creative nova-card"}>
          <div className="nova-product" aria-hidden="true">
            <span className="nova-headband" />
            <span className="nova-earcup left" />
            <span className="nova-earcup right" />
          </div>
          <div className="nova-copy">
            <span>NOVAGEAR</span>
            <strong>听见每一处细节。</strong>
            <small>Aero X1 沉浸式影音耳机</small>
            <b>了解产品</b>
          </div>
        </div>
        <span className="native-ad-label">广告 · {remaining}s</span>
        {!fullscreen ? <span className="native-muted">静音</span> : null}
        {!fullscreen && onDismiss ? (
          <button className="native-ad-close" aria-label="关闭广告，保留暂停画面" onClick={onDismiss}>×</button>
        ) : null}
      </>
    );
  }

  return (
    <>
      <Image
        alt="冰蓝色奇幻游戏广告画面"
        fill
        priority
        sizes={fullscreen ? "(max-width: 900px) 100vw, 1000px" : "310px"}
        src="/game-ad-clean.png"
      />
      {fullscreen ? (
        <div className="ad-badge real-countdown">广告 · {remaining}s</div>
      ) : (
        <>
          <span className="native-ad-label">广告 · {remaining}s</span>
          <span className="native-muted">静音</span>
        </>
      )}
    </>
  );
}
