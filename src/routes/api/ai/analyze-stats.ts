import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // ~4MB per image after base64 decode estimate
const MAX_TEXT_CHARS = 60_000;

async function authenticate(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  const { data, error } = await (supabaseAdmin as any).auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export const Route = createFileRoute("/api/ai/analyze-stats")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authenticate(request);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) {
          return Response.json({ error: "AI gateway is not configured" }, { status: 500 });
        }

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const clubName = String(body.clubName ?? "").trim().slice(0, 200);
        const sport = String(body.sport ?? "basketball").slice(0, 50);
        const language = String(body.language ?? "en").slice(0, 10);
        const extra = String(body.context ?? "").trim().slice(0, 2000);
        const text = String(body.text ?? "").slice(0, MAX_TEXT_CHARS);
        const images = Array.isArray(body.images) ? (body.images as unknown[]).slice(0, MAX_IMAGES) : [];

        const validImages: string[] = [];
        for (const img of images) {
          if (typeof img !== "string") continue;
          if (!img.startsWith("data:image/")) continue;
          // rough size check: base64 length * 0.75
          if (img.length * 0.75 > MAX_IMAGE_BYTES) continue;
          validImages.push(img);
        }

        if (!text.trim() && validImages.length === 0) {
          return Response.json({ error: "No statistics provided" }, { status: 400 });
        }
        if (!clubName) {
          return Response.json({ error: "Club name is required" }, { status: 400 });
        }

        // Stats analysis is free — no AI credits are charged.
        const refund = async () => {
          /* no-op: analysis is free */
        };

        const systemPrompt = `You are an elite ${sport} performance analyst and head coach.
The user's club is named "${clubName}". Inside the provided statistics (text and/or images of stat sheets, box scores, league tables, individual game logs), identify which team belongs to "${clubName}" — match by exact name, abbreviation, partial match, or contextual cues. Then perform a deep analysis ONLY for that team.

Reply ONLY by calling the provided tool. Write all string fields in language code "${language}".
If you cannot identify the club's team in the data, set team_identified=false and explain in summary which teams you saw.`;

        const userParts: any[] = [];
        if (text.trim()) {
          userParts.push({
            type: "text",
            text: `Club name: ${clubName}\nSport: ${sport}\n${extra ? `Extra context: ${extra}\n` : ""}\nStatistics (extracted text):\n${text}`,
          });
        } else {
          userParts.push({
            type: "text",
            text: `Club name: ${clubName}\nSport: ${sport}\n${extra ? `Extra context: ${extra}\n` : ""}\nStatistics are provided as image(s) below. Read all numbers carefully.`,
          });
        }
        for (const img of validImages) {
          userParts.push({ type: "image_url", image_url: { url: img } });
        }

        const tools = [
          {
            type: "function",
            function: {
              name: "submit_stats_analysis",
              description: "Submit a deep statistical analysis for the identified team.",
              parameters: {
                type: "object",
                properties: {
                  team_identified: { type: "boolean" },
                  identified_team_name: { type: "string", description: "Exact team name as it appears in the source." },
                  summary: { type: "string", description: "2-4 sentence executive summary of the team's performance." },
                  key_metrics: {
                    type: "array",
                    description: "Most important numerical metrics for this team.",
                    minItems: 0,
                    maxItems: 12,
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        value: { type: "string" },
                        note: { type: "string", description: "Short interpretation, optional." },
                      },
                      required: ["label", "value"],
                      additionalProperties: false,
                    },
                  },
                  strengths: {
                    type: "array",
                    minItems: 0,
                    maxItems: 8,
                    items: { type: "string" },
                  },
                  weaknesses: {
                    type: "array",
                    minItems: 0,
                    maxItems: 8,
                    items: { type: "string" },
                  },
                  top_players: {
                    type: "array",
                    minItems: 0,
                    maxItems: 8,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        highlight: { type: "string", description: "Key stat or contribution." },
                      },
                      required: ["name", "highlight"],
                      additionalProperties: false,
                    },
                  },
                  recommendations: {
                    type: "array",
                    description: "Concrete things the coaching staff should work on next.",
                    minItems: 1,
                    maxItems: 10,
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string", description: "Skill / tactical area." },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        action: { type: "string", description: "Specific drill, tactic or focus to implement." },
                      },
                      required: ["area", "priority", "action"],
                      additionalProperties: false,
                    },
                  },
                },
                required: [
                  "team_identified",
                  "summary",
                  "key_metrics",
                  "strengths",
                  "weaknesses",
                  "recommendations",
                ],
                additionalProperties: false,
              },
            },
          },
        ];

        try {
          const response = await fetch(GATEWAY_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-pro",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userParts },
              ],
              tools,
              tool_choice: { type: "function", function: { name: "submit_stats_analysis" } },
            }),
          });

          if (response.status === 429) {
            await refund();
            return Response.json({ error: "Rate limit exceeded. Please try again shortly." }, { status: 429 });
          }
          if (response.status === 402) {
            await refund();
            return Response.json(
              { error: "AI service temporarily unavailable. Please try again later." },
              { status: 503 },
            );
          }
          if (!response.ok) {
            await refund();
            const txt = await response.text();
            console.error("AI gateway error", response.status, txt);
            return Response.json({ error: "Analysis failed" }, { status: 500 });
          }

          const data = await response.json();
          const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
          const argsStr = toolCall?.function?.arguments;
          if (!argsStr) {
            await refund();
            console.error("No tool call in response", JSON.stringify(data).slice(0, 500));
            return Response.json({ error: "AI returned no analysis" }, { status: 500 });
          }
          let parsed: any;
          try {
            parsed = JSON.parse(argsStr);
          } catch {
            await refund();
            return Response.json({ error: "AI returned invalid analysis" }, { status: 500 });
          }
          return Response.json(parsed);
        } catch (err) {
          await refund();
          console.error("analyze-stats exception", err);
          return Response.json({ error: "Analysis failed" }, { status: 500 });
        }
      },
    },
  },
});
