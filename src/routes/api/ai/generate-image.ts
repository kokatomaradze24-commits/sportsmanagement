import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export const Route = createFileRoute("/api/ai/generate-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticate(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) return Response.json({ error: "AI gateway is not configured" }, { status: 500 });

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const prompt = String(body.prompt ?? "").trim();
        const referenceImage = typeof body.referenceImage === "string" ? body.referenceImage : "";
        const model = String(body.model ?? "google/gemini-3-pro-image-preview");

        if (!prompt) return Response.json({ error: "Prompt is required" }, { status: 400 });
        if (prompt.length > 2000) return Response.json({ error: "Prompt is too long" }, { status: 400 });

        const userContent: any[] = [{ type: "text", text: prompt }];
        if (referenceImage && referenceImage.startsWith("data:image/")) {
          userContent.push({ type: "image_url", image_url: { url: referenceImage } });
        }

        try {
          const response = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: userContent }],
              modalities: ["image", "text"],
            }),
          });

          if (response.status === 429) {
            return Response.json({ error: "Rate limit exceeded. Please try again shortly." }, { status: 429 });
          }
          if (response.status === 402) {
            return Response.json({ error: "AI credits exhausted. Please add credits in workspace settings." }, { status: 402 });
          }
          if (!response.ok) {
            const txt = await response.text();
            console.error("AI gateway error", response.status, txt);
            return Response.json({ error: "Image generation failed" }, { status: 500 });
          }

          const data = await response.json();
          const imageUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!imageUrl) {
            console.error("No image in AI response", JSON.stringify(data).slice(0, 500));
            return Response.json({ error: "No image returned" }, { status: 500 });
          }

          return Response.json({ imageUrl });
        } catch (err) {
          console.error("generate-image exception", err);
          return Response.json({ error: "Image generation failed" }, { status: 500 });
        }
      },
    },
  },
});
