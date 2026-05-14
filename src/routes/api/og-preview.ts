import { createFileRoute } from "@tanstack/react-router";

interface PreviewMeta {
  url: string;
  finalUrl: string;
  fetchedAt: number;
  title: string | null;
  description: string | null;
  siteName: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogImages: string[];
  ogImageAlt: string | null;
  ogUrl: string | null;
  ogType: string | null;
  ogLocale: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  twitterImageAlt: string | null;
  canonical: string | null;
  favicon: string | null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

function getAttr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = tag.match(re);
  if (!m) return null;
  return decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMeta(html: string, key: string, value: string): string | null {
  const re = new RegExp(
    `<meta\\b[^>]*\\b${key}\\s*=\\s*["']${escapeRegex(value)}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  return getAttr(tag, "content");
}

function findAllMeta(html: string, key: string, value: string): string[] {
  const re = new RegExp(
    `<meta\\b[^>]*\\b${key}\\s*=\\s*["']${escapeRegex(value)}["'][^>]*>`,
    "gi",
  );
  const out: string[] = [];
  for (const m of html.matchAll(re)) {
    const c = getAttr(m[0], "content");
    if (c) out.push(c);
  }
  return out;
}

function findTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : null;
}

function findCanonical(html: string): string | null {
  const tag = html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i)?.[0];
  return tag ? getAttr(tag, "href") : null;
}

function findFavicon(html: string): string | null {
  const tag = html.match(/<link\b[^>]*\brel\s*=\s*["'][^"']*icon[^"']*["'][^>]*>/i)?.[0];
  return tag ? getAttr(tag, "href") : null;
}

function absolutize(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

// Simple in-memory LRU-ish cache (per worker instance). 5 min TTL.
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 100;
const cache = new Map<string, { meta: PreviewMeta; expires: number }>();

function cacheGet(key: string): PreviewMeta | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  // Bump recency
  cache.delete(key);
  cache.set(key, hit);
  return hit.meta;
}

function cacheSet(key: string, meta: PreviewMeta) {
  cache.set(key, { meta, expires: Date.now() + CACHE_TTL_MS });
  while (cache.size > CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    if (firstKey === undefined) break;
    cache.delete(firstKey);
  }
}

export const Route = createFileRoute("/api/og-preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const url = params.get("url");
        const refresh = params.get("refresh") === "1";
        if (!url) {
          return Response.json({ error: "Missing 'url' query param" }, { status: 400 });
        }

        let target: URL;
        try {
          target = new URL(url);
        } catch {
          return Response.json({ error: "Invalid URL" }, { status: 400 });
        }

        if (target.protocol !== "http:" && target.protocol !== "https:") {
          return Response.json({ error: "Only http(s) URLs are allowed" }, { status: 400 });
        }

        const cacheKey = target.href;
        if (!refresh) {
          const cached = cacheGet(cacheKey);
          if (cached) {
            return Response.json(
              { ...cached, cached: true },
              { headers: { "Cache-Control": "no-store", "X-Cache": "HIT" } },
            );
          }
        }

        try {
          const res = await fetch(target.href, {
            redirect: "follow",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; MyClubSharePreview/1.0; +https://my-club.live)",
              Accept: "text/html,application/xhtml+xml",
            },
          });

          const finalUrl = res.url || target.href;
          const html = (await res.text()).slice(0, 500_000);

          const ogImagesRaw = findAllMeta(html, "property", "og:image");
          const ogImages = ogImagesRaw
            .map((u) => absolutize(u, finalUrl))
            .filter((u): u is string => !!u);

          const meta: PreviewMeta = {
            url: target.href,
            finalUrl,
            fetchedAt: Date.now(),
            title: findTitle(html),
            description: findMeta(html, "name", "description"),
            siteName: findMeta(html, "property", "og:site_name"),
            ogTitle: findMeta(html, "property", "og:title"),
            ogDescription: findMeta(html, "property", "og:description"),
            ogImage: ogImages[0] ?? null,
            ogImages,
            ogImageAlt: findMeta(html, "property", "og:image:alt"),
            ogUrl: findMeta(html, "property", "og:url"),
            ogType: findMeta(html, "property", "og:type"),
            ogLocale: findMeta(html, "property", "og:locale"),
            twitterCard: findMeta(html, "name", "twitter:card"),
            twitterTitle: findMeta(html, "name", "twitter:title"),
            twitterDescription: findMeta(html, "name", "twitter:description"),
            twitterImage: absolutize(findMeta(html, "name", "twitter:image"), finalUrl),
            twitterImageAlt: findMeta(html, "name", "twitter:image:alt"),
            canonical: absolutize(findCanonical(html), finalUrl),
            favicon: absolutize(findFavicon(html) ?? "/favicon.ico", finalUrl),
          };

          cacheSet(cacheKey, meta);

          return Response.json(
            { ...meta, cached: false },
            { headers: { "Cache-Control": "no-store", "X-Cache": "MISS" } },
          );
        } catch (err) {
          return Response.json(
            { error: `Failed to fetch URL: ${(err as Error).message}` },
            { status: 502 },
          );
        }
      },
    },
  },
});
