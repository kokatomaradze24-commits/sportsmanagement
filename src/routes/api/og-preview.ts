import { createFileRoute } from "@tanstack/react-router";

interface PreviewMeta {
  url: string;
  finalUrl: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
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

function findMeta(html: string, key: string, value: string): string | null {
  const re = new RegExp(
    `<meta\\b[^>]*\\b${key}\\s*=\\s*["']${value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  return getAttr(tag, "content");
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

export const Route = createFileRoute("/api/og-preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url).searchParams.get("url");
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

          const meta: PreviewMeta = {
            url: target.href,
            finalUrl,
            title: findTitle(html),
            description: findMeta(html, "name", "description"),
            siteName: findMeta(html, "property", "og:site_name"),
            ogTitle: findMeta(html, "property", "og:title"),
            ogDescription: findMeta(html, "property", "og:description"),
            ogImage: absolutize(findMeta(html, "property", "og:image"), finalUrl),
            ogUrl: findMeta(html, "property", "og:url"),
            ogType: findMeta(html, "property", "og:type"),
            twitterCard: findMeta(html, "name", "twitter:card"),
            twitterTitle: findMeta(html, "name", "twitter:title"),
            twitterDescription: findMeta(html, "name", "twitter:description"),
            twitterImage: absolutize(findMeta(html, "name", "twitter:image"), finalUrl),
            canonical: absolutize(findCanonical(html), finalUrl),
            favicon: absolutize(findFavicon(html) ?? "/favicon.ico", finalUrl),
          };

          return Response.json(meta, {
            headers: { "Cache-Control": "no-store" },
          });
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
