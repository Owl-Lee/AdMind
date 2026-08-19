/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const mediaAssets = new Map([
  ["/media/admind-charge-demo-720p.mp4", "/admind-charge-demo-720p.mp4"],
  ["/media/coffee-run-emotion-720p.mp4", "/coffee-run-emotion-720p.mp4"],
  ["/media/llamigos-chase-720p.mp4", "/llamigos-chase-720p.mp4"],
  ["/media/coast-guard-rescue-720p.mp4", "/coast-guard-rescue-720p.mp4"],
  ["/media/usns-medical-evacuation-720p.mp4", "/usns-medical-evacuation-720p.mp4"],
]);

function parseRange(value: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    return { start: Math.max(0, size - suffixLength), end: size - 1 };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(requestedEnd) || start < 0 || start >= size || requestedEnd < start) return null;
  return { start, end: Math.min(requestedEnd, size - 1) };
}

async function serveMedia(request: Request, env: Env, assetPath: string): Promise<Response> {
  const upstreamRequest = new Request(new URL(assetPath, request.url), {
    headers: request.headers.get("range") ? { range: request.headers.get("range")! } : undefined,
  });
  const upstream = env.ASSETS
    ? await env.ASSETS.fetch(upstreamRequest)
    : await fetch(upstreamRequest);
  const headers = new Headers(upstream.headers);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "private, max-age=3600");

  if (request.method === "HEAD") {
    return new Response(null, { status: upstream.status, headers });
  }

  const rangeHeader = request.headers.get("range");
  if (!rangeHeader || upstream.status === 206) {
    return new Response(upstream.body, { status: upstream.status, headers });
  }

  const body = await upstream.arrayBuffer();
  const range = parseRange(rangeHeader, body.byteLength);
  if (!range) {
    headers.set("content-range", `bytes */${body.byteLength}`);
    return new Response(null, { status: 416, headers });
  }

  const chunk = body.slice(range.start, range.end + 1);
  headers.set("content-length", String(chunk.byteLength));
  headers.set("content-range", `bytes ${range.start}-${range.end}/${body.byteLength}`);
  return new Response(chunk, { status: 206, headers });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const mediaAsset = mediaAssets.get(url.pathname);
    if (mediaAsset && (request.method === "GET" || request.method === "HEAD")) {
      return serveMedia(request, env, mediaAsset);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => {
          if (!env.ASSETS) throw new Error("ASSETS binding is unavailable");
          return env.ASSETS.fetch(new Request(new URL(path, request.url)));
        },
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
