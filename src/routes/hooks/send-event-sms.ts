import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Kind = "registration" | "schedule" | "payment_paid";
type Lang = "en" | "ka" | "ru" | "de" | "es" | "fr";

interface Body {
  userId: string;
  playerId: string;
  kind: Kind;
  paymentId?: string;
  clubName?: string;
  sportName?: string;
  lang?: Lang;
}

const MONTHS_LONG: Record<Lang, string[]> = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  ka: ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"],
  ru: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
  de: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
  es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
};

function fmtDate(y: number, m: number, day: number): string {
  const d = String(Math.min(Math.max(1, day), 28)).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${d}.${mm}.${y}`;
}

interface TemplateVars {
  playerName: string;
  clubName: string;
  sportName: string;
  amount?: number;
  months?: number;
  firstDueDate?: string;
  monthLabel?: string;
}

function buildText(kind: Kind, lang: Lang, v: TemplateVars): string {
  const club = v.clubName || "Club";
  const sport = v.sportName || "";
  const sportPart = sport ? ` (${sport})` : "";

  if (lang === "ka") {
    if (kind === "registration") {
      return `გამარჯობა! ${v.playerName} წარმატებით დარეგისტრირდა ${club}-ში${sportPart}.`;
    }
    if (kind === "schedule") {
      return `${v.playerName}-ის გადახდის გრაფიკი ${club}-ში: ${v.months} თვე, ყოველთვიური თანხა ${v.amount}₾. პირველი ვადა: ${v.firstDueDate}.`;
    }
    return `მადლობა! ${v.playerName}-ის გადახდა ${v.amount}₾ (${v.monthLabel}) ${club}-ში წარმატებით ჩაირიცხა.`;
  }
  if (lang === "ru") {
    if (kind === "registration") return `Здравствуйте! ${v.playerName} успешно зарегистрирован(а) в ${club}${sportPart}.`;
    if (kind === "schedule") return `График платежей ${v.playerName} в ${club}: ${v.months} мес., ежемесячно ${v.amount}. Первый срок: ${v.firstDueDate}.`;
    return `Спасибо! Платёж ${v.playerName} ${v.amount} (${v.monthLabel}) в ${club} получен.`;
  }
  if (lang === "de") {
    if (kind === "registration") return `Hallo! ${v.playerName} wurde erfolgreich bei ${club}${sportPart} angemeldet.`;
    if (kind === "schedule") return `Zahlungsplan von ${v.playerName} bei ${club}: ${v.months} Monate, monatlich ${v.amount}. Erste Fälligkeit: ${v.firstDueDate}.`;
    return `Danke! Zahlung von ${v.playerName} über ${v.amount} (${v.monthLabel}) bei ${club} eingegangen.`;
  }
  if (lang === "es") {
    if (kind === "registration") return `¡Hola! ${v.playerName} se registró con éxito en ${club}${sportPart}.`;
    if (kind === "schedule") return `Plan de pagos de ${v.playerName} en ${club}: ${v.months} meses, ${v.amount}/mes. Primer vencimiento: ${v.firstDueDate}.`;
    return `¡Gracias! Pago de ${v.playerName} de ${v.amount} (${v.monthLabel}) en ${club} recibido.`;
  }
  if (lang === "fr") {
    if (kind === "registration") return `Bonjour ! ${v.playerName} a été inscrit(e) avec succès à ${club}${sportPart}.`;
    if (kind === "schedule") return `Échéancier de ${v.playerName} à ${club} : ${v.months} mois, ${v.amount}/mois. Première échéance : ${v.firstDueDate}.`;
    return `Merci ! Paiement de ${v.playerName} de ${v.amount} (${v.monthLabel}) à ${club} reçu.`;
  }
  // en
  if (kind === "registration") return `Hello! ${v.playerName} has been successfully registered at ${club}${sportPart}.`;
  if (kind === "schedule") return `${v.playerName}'s payment schedule at ${club}: ${v.months} months, ${v.amount} per month. First due: ${v.firstDueDate}.`;
  return `Thank you! Payment of ${v.amount} (${v.monthLabel}) for ${v.playerName} at ${club} received.`;
}

async function sendMagti(apiKey: string, sender: string | null, to: string, text: string) {
  const params = new URLSearchParams({
    key: apiKey,
    destination: to.replace(/\D/g, ""),
    sender: sender || "Info",
    content: text,
  });
  try {
    const res = await fetch(`https://smsoffice.ge/api/v2/send/?${params.toString()}`);
    const body = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    try {
      const json = JSON.parse(body);
      if (json.Success === false) return { ok: false, error: `Magti: ${JSON.stringify(json).slice(0, 200)}` };
    } catch { /* plain text "OK" — treat 2xx as success */ }
    return { ok: true as const };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

async function sendTwilio(sid: string, token: string, from: string, to: string, text: string) {
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: text }),
    });
    const body = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    return { ok: true as const };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export const Route = createFileRoute("/hooks/send-event-sms")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const { userId, playerId, kind, paymentId } = body;
        if (!userId || !playerId || !kind) {
          return Response.json({ error: "Missing fields" }, { status: 400 });
        }

        // Verify caller is the same user via auth token
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace(/^Bearer\s+/i, "");
        if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(token);
        if (uErr || !userData.user || userData.user.id !== userId) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Load settings
        const { data: settings } = await supabaseAdmin
          .from("user_sms_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!settings || !settings.enabled) {
          return Response.json({ ok: true, skipped: "sms_disabled" });
        }

        // Load player
        const { data: player } = await supabaseAdmin
          .from("players")
          .select("id, first_name, last_name, parent_phone, phone, primary_contact, start_day, start_month, start_year, monthly_fee, subscription_months")
          .eq("id", playerId)
          .eq("user_id", userId)
          .maybeSingle();

        if (!player) return Response.json({ error: "Player not found" }, { status: 404 });

        const phone = player.parent_phone || player.phone;
        if (!phone) return Response.json({ ok: true, skipped: "no_phone" });

        // Optional payment context
        let amount: number | undefined;
        let monthLabel: string | undefined;
        const lang: Lang = (body.lang && MONTHS_LONG[body.lang] ? body.lang : "en");

        if (kind === "payment_paid" && paymentId) {
          const { data: pmt } = await supabaseAdmin
            .from("payments")
            .select("amount, month, year")
            .eq("id", paymentId)
            .eq("user_id", userId)
            .maybeSingle();
          if (pmt) {
            amount = Number(pmt.amount);
            monthLabel = `${MONTHS_LONG[lang][pmt.month - 1]} ${pmt.year}`;
          }
        }

        const playerName = `${player.first_name} ${player.last_name}`.trim();
        const firstDueDate = fmtDate(player.start_year, player.start_month, player.start_day);

        const text = buildText(kind, lang, {
          playerName,
          clubName: body.clubName || "Club",
          sportName: body.sportName || "",
          amount: kind === "schedule" ? Number(player.monthly_fee) : amount,
          months: player.subscription_months,
          firstDueDate,
          monthLabel,
        });

        let result: { ok: boolean; error?: string };
        if (settings.provider === "magti") {
          if (!settings.magti_api_key) result = { ok: false, error: "Missing Magti API key" };
          else result = await sendMagti(settings.magti_api_key, settings.magti_sender, phone, text);
        } else if (settings.provider === "twilio") {
          if (!settings.twilio_account_sid || !settings.twilio_auth_token || !settings.twilio_from) {
            result = { ok: false, error: "Missing Twilio credentials" };
          } else {
            result = await sendTwilio(
              settings.twilio_account_sid,
              settings.twilio_auth_token,
              settings.twilio_from,
              phone,
              text,
            );
          }
        } else {
          // email provider not supported in this SMS hook
          return Response.json({ ok: true, skipped: "provider_not_sms" });
        }

        await supabaseAdmin.from("sms_logs").insert({
          user_id: userId,
          player_id: playerId,
          payment_id: paymentId ?? null,
          phone,
          message: text,
          kind,
          provider: settings.provider,
          status: result.ok ? "sent" : "failed",
          error: result.error ?? null,
        });

        return Response.json({ ok: result.ok, error: result.error });
      },
    },
  },
});
