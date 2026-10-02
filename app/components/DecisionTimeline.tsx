"use client";

import type { CSSProperties } from "react";

export type TimelineSegment = {
  startSec: number;
  endSec: number;
  intensity: number;
};

export type TimelineMarker = {
  kind: "baseline" | "admind";
  timeSec: number;
  label: string;
  caption: string;
  onSelect?: () => void;
};

type DecisionTimelineProps = {
  durationSec: number;
  segments: TimelineSegment[];
  markers: TimelineMarker[];
  /** Shades the whole track as protected content (S3). */
  protectedLabel?: string;
  time?: number;
  animated?: boolean;
  legend?: { low: string; high: string };
};

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function percent(value: number, duration: number) {
  if (!duration) return 0;
  return Math.max(0, Math.min(100, (value / duration) * 100));
}

export function DecisionTimeline({
  durationSec,
  segments,
  markers,
  protectedLabel,
  time,
  animated = false,
  legend,
}: DecisionTimelineProps) {
  return (
    <div className={`am-timeline${protectedLabel ? " is-protected" : ""}${animated ? " is-animated" : ""}`}>
      <div className="am-timeline-markers">
        {markers.map((marker) => {
          const at = percent(marker.timeSec, durationSec);
          const edge = at > 82 ? " edge-end" : at < 18 ? " edge-start" : "";
          const style = { "--at": `${at}%` } as CSSProperties;
          const content = (
            <>
              <b>{marker.label}</b>
              <small>{marker.caption}</small>
            </>
          );
          return marker.onSelect ? (
            <button
              className={`am-marker ${marker.kind}${edge}`}
              key={`${marker.kind}-${marker.timeSec}`}
              onClick={marker.onSelect}
              style={style}
              type="button"
            >
              {content}
            </button>
          ) : (
            <span className={`am-marker ${marker.kind}${edge}`} key={`${marker.kind}-${marker.timeSec}`} style={style}>
              {content}
            </span>
          );
        })}
      </div>
      <div className="am-timeline-track" aria-hidden="true">
        {segments.map((segment) => (
          <i
            key={`${segment.startSec}-${segment.endSec}`}
            style={{
              left: `${percent(segment.startSec, durationSec)}%`,
              width: `${Math.max(0.6, percent(segment.endSec - segment.startSec, durationSec))}%`,
              "--level": Math.max(0.08, Math.min(1, segment.intensity)),
            } as CSSProperties}
          />
        ))}
        {protectedLabel ? <span className="am-timeline-protected">{protectedLabel}</span> : null}
        {markers.map((marker) => (
          <em className={`am-tick ${marker.kind}`} key={`tick-${marker.kind}-${marker.timeSec}`} style={{ left: `${percent(marker.timeSec, durationSec)}%` }} />
        ))}
        {typeof time === "number" ? <span className="am-playhead" style={{ left: `${percent(time, durationSec)}%` }} /> : null}
        {animated ? <span className="am-playhead sweep" /> : null}
      </div>
      <div className="am-timeline-scale">
        <span>00:00</span>
        {legend ? <span className="am-timeline-legend"><i />{legend.low}<i className="high" />{legend.high}</span> : null}
        <span>{formatTime(durationSec)}</span>
      </div>
    </div>
  );
}
