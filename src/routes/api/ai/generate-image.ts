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

        const IMAGE_COST = 5;
        const admin = supabaseAdmin as any;
        const { data: deductOk, error: deductErr } = await admin.rpc("deduct_ai_credits", {
          _user_id: user.id,
          _amount: IMAGE_COST,
        });
        if (deductErr) {
          console.error("deduct_ai_credits failed", deductErr);
          return Response.json({ error: "Credit check failed" }, { status: 500 });
        }
        if (!deductOk) {
          return Response.json({ error: "Insufficient AI credits. Please purchase more." }, { status: 402 });
        }

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

          const refund = async () => {
            try { await admin.rpc("refund_ai_credits", { _user_id: user.id, _amount: IMAGE_COST }); } catch { /* ignore */ }
          };

          if (response.status === 429) {
            await refund();
            return Response.json({ error: "Rate limit exceeded. Please try again shortly." }, { status: 429 });
          }
          if (response.status === 402) {
            await refund();
            return Response.json({ error: "AI service temporarily unavailable. Please try again later." }, { status: 503 });
          }
          if (!response.ok) {
            await refund();
            const txt = await response.text();
            console.error("AI gateway error", response.status, txt);
            return Response.json({ error: "Image generation failed" }, { status: 500 });
          }

          const data = await response.json();
          const imageUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!imageUrl) {
            await refund();
            console.error("No image in AI response", JSON.stringify(data).slice(0, 500));
            return Response.json({ error: "No image returned" }, { status: 500 });
          }

          return Response.json({ imageUrl });
        } catch (err) {
          try { await admin.rpc("refund_ai_credits", { _user_id: user.id, _amount: IMAGE_COST }); } catch { /* ignore */ }
          console.error("generate-image exception", err);
          return Response.json({ error: "Image generation failed" }, { status: 500 });
        }
      },
    },
  },
});
