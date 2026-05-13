import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

export const Route = createFileRoute("/share-preview")({
  head: () => ({
    meta: [
      { title: "Share Preview Tester — My Club" },
      {
        name: "description",
        content: "Preview how a URL renders on Twitter, LinkedIn, Facebook and Slack link cards.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SharePreviewPage,
});

function hostnameOf(u: string | null): string {
  if (!u) return "";
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function SharePreviewPage() {
  const [input, setInput] = useState("https://my-club.live/");
  const [data, setData] = useState<PreviewMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      let url = input.trim();
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      const res = await fetch(`/api/og-preview?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setData(json as PreviewMeta);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const twTitle = data?.twitterTitle || data?.ogTitle || data?.title || "";
  const twDesc = data?.twitterDescription || data?.ogDescription || data?.description || "";
  const twImage = data?.twitterImage || data?.ogImage || null;
  const twCard = data?.twitterCard || (twImage ? "summary_large_image" : "summary");

  const liTitle = data?.ogTitle || data?.title || "";
  const liDesc = data?.ogDescription || data?.description || "";
  const liImage = data?.ogImage || null;

  const fbTitle = data?.ogTitle || data?.title || "";
  const fbDesc = data?.ogDescription || data?.description || "";
  const fbImage = data?.ogImage || null;

  const slackTitle = data?.ogTitle || data?.title || "";
  const slackDesc = data?.ogDescription || data?.description || "";
  const slackImage = data?.ogImage || null;

  const issues = useMemo(() => {
    if (!data) return [] as string[];
    const out: string[] = [];
    if (!data.title) out.push("Missing <title>");
    if (!data.description) out.push("Missing meta description");
    if (!data.ogTitle) out.push("Missing og:title");
    if (!data.ogDescription) out.push("Missing og:description");
    if (!data.ogImage) out.push("Missing og:image (links will preview without an image)");
    if (!data.twitterCard) out.push("Missing twitter:card");
    if (!data.canonical) out.push("Missing canonical link");
    return out;
  }, [data]);

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-display tracking-wider">Share Preview Tester</h1>
          <p className="text-sm text-muted-foreground">
            Paste any URL to see how it renders on Twitter/X, LinkedIn, Facebook and Slack.
          </p>
        </header>

        <form onSubmit={submit} className="flex gap-2">
          <Input
            type="url"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://example.com"
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? "Fetching…" : "Preview"}
          </Button>
        </form>

        {error && (
          <Card className="p-4 border-destructive bg-destructive/10 text-destructive text-sm">
            {error}
          </Card>
        )}

        {data && (
          <div className="space-y-8">
            {issues.length > 0 && (
              <Card className="p-4 border-amber-500/50 bg-amber-500/10">
                <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-2 text-sm">
                  Issues found
                </h3>
                <ul className="text-sm space-y-1 text-amber-700 dark:text-amber-400 list-disc list-inside">
                  {issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Twitter / X */}
              <PreviewSection label="Twitter / X" sub={`Card: ${twCard}`}>
                {twCard === "summary_large_image" ? (
                  <div className="rounded-2xl overflow-hidden border border-border bg-card max-w-[500px]">
                    {twImage && (
                      <img
                        src={twImage}
                        alt=""
                        className="w-full aspect-[1.91/1] object-cover bg-muted"
                      />
                    )}
                    <div className="p-3 space-y-1">
                      <div className="text-xs text-muted-foreground">{hostnameOf(data.finalUrl)}</div>
                      <div className="text-[15px] font-semibold leading-snug line-clamp-2">{twTitle}</div>
                      {twDesc && (
                        <div className="text-[13px] text-muted-foreground line-clamp-2">{twDesc}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex rounded-2xl overflow-hidden border border-border bg-card max-w-[500px]">
                    {twImage && (
                      <img src={twImage} alt="" className="w-32 h-32 object-cover bg-muted shrink-0" />
                    )}
                    <div className="p-3 space-y-1 min-w-0">
                      <div className="text-xs text-muted-foreground truncate">{hostnameOf(data.finalUrl)}</div>
                      <div className="text-[15px] font-semibold leading-snug line-clamp-2">{twTitle}</div>
                      {twDesc && (
                        <div className="text-[13px] text-muted-foreground line-clamp-2">{twDesc}</div>
                      )}
                    </div>
                  </div>
                )}
              </PreviewSection>

              {/* LinkedIn */}
              <PreviewSection label="LinkedIn">
                <div className="rounded-md overflow-hidden border border-border bg-card max-w-[520px]">
                  {liImage && (
                    <img src={liImage} alt="" className="w-full aspect-[1.91/1] object-cover bg-muted" />
                  )}
                  <div className="p-3 space-y-1 bg-muted/50">
                    <div className="text-[15px] font-semibold leading-snug line-clamp-2">{liTitle}</div>
                    {liDesc && (
                      <div className="text-[12px] text-muted-foreground line-clamp-2">{liDesc}</div>
                    )}
                    <div className="text-[12px] text-muted-foreground">{hostnameOf(data.finalUrl)}</div>
                  </div>
                </div>
              </PreviewSection>

              {/* Facebook */}
              <PreviewSection label="Facebook">
                <div className="rounded-md overflow-hidden border border-border bg-card max-w-[520px]">
                  {fbImage && (
                    <img src={fbImage} alt="" className="w-full aspect-[1.91/1] object-cover bg-muted" />
                  )}
                  <div className="p-3 space-y-1 bg-muted/50">
                    <div className="text-[12px] uppercase text-muted-foreground tracking-wide">
                      {hostnameOf(data.finalUrl)}
                    </div>
                    <div className="text-[16px] font-semibold leading-snug line-clamp-2">{fbTitle}</div>
                    {fbDesc && (
                      <div className="text-[13px] text-muted-foreground line-clamp-2">{fbDesc}</div>
                    )}
                  </div>
                </div>
              </PreviewSection>

              {/* Slack */}
              <PreviewSection label="Slack / Discord">
                <div className="border-l-4 border-primary pl-3 py-2 bg-card max-w-[520px] rounded-r-md">
                  <div className="text-[13px] font-semibold mb-1 flex items-center gap-2">
                    {data.favicon && (
                      <img src={data.favicon} alt="" className="w-4 h-4 rounded-sm" />
                    )}
                    <span>{data.siteName || hostnameOf(data.finalUrl)}</span>
                  </div>
                  <div className="text-[14px] text-primary font-medium leading-snug line-clamp-2">
                    {slackTitle}
                  </div>
                  {slackDesc && (
                    <div className="text-[13px] text-muted-foreground line-clamp-3 mt-1">
                      {slackDesc}
                    </div>
                  )}
                  {slackImage && (
                    <img
                      src={slackImage}
                      alt=""
                      className="mt-2 max-h-48 rounded border border-border bg-muted"
                    />
                  )}
                </div>
              </PreviewSection>
            </div>

            {/* Raw tags */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 text-sm">Detected tags</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-4 gap-y-2 text-xs font-mono">
                <Row label="title" value={data.title} />
                <Row label="description" value={data.description} />
                <Row label="canonical" value={data.canonical} />
                <Row label="og:title" value={data.ogTitle} />
                <Row label="og:description" value={data.ogDescription} />
                <Row label="og:image" value={data.ogImage} />
                <Row label="og:url" value={data.ogUrl} />
                <Row label="og:type" value={data.ogType} />
                <Row label="og:site_name" value={data.siteName} />
                <Row label="twitter:card" value={data.twitterCard} />
                <Row label="twitter:title" value={data.twitterTitle} />
                <Row label="twitter:description" value={data.twitterDescription} />
                <Row label="twitter:image" value={data.twitterImage} />
              </dl>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewSection({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={value ? "break-all" : "text-destructive/70"}>{value || "—"}</dd>
    </>
  );
}
