import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import regularFontUrl from "@fontsource/noto-sans-georgian/files/noto-sans-georgian-georgian-400-normal.woff?url";
import boldFontUrl from "@fontsource/noto-sans-georgian/files/noto-sans-georgian-georgian-700-normal.woff?url";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

type MoneyFormatter = (amount: number) => string;
type MonthFormatter = (month: number) => string;

const PAGE = { width: 595.28, height: 841.89 };
const ink = rgb(0.13, 0.15, 0.2);
const muted = rgb(0.42, 0.46, 0.55);
const line = rgb(0.86, 0.88, 0.92);
const accent = rgb(0.12, 0.38, 0.78);
const danger = rgb(0.78, 0.16, 0.16);
const success = rgb(0.12, 0.55, 0.32);

async function loadFont(url: string) {
  const response = await fetch(url);
  return response.arrayBuffer();
}

async function createDoc() {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await Promise.all([loadFont(regularFontUrl), loadFont(boldFontUrl)]);
  return {
    pdf,
    regular: await pdf.embedFont(regularBytes),
    bold: await pdf.embedFont(boldBytes),
  };
}

function text(page: PDFPage, value: string, x: number, y: number, font: PDFFont, size = 10, color = ink) {
  page.drawText(value || "—", { x, y, size, font, color });
}

function fit(value: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  let out = value;
  while (out.length > 1 && font.widthOfTextAtSize(`${out}…`, size) > maxWidth) out = out.slice(0, -1);
  return `${out}…`;
}

function header(page: PDFPage, title: string, subtitle: string, bold: PDFFont, regular: PDFFont) {
  page.drawRectangle({ x: 0, y: PAGE.height - 92, width: PAGE.width, height: 92, color: rgb(0.95, 0.97, 1) });
  text(page, title, 40, PAGE.height - 44, bold, 18, accent);
  text(page, subtitle, 40, PAGE.height - 67, regular, 10, muted);
  text(page, new Date().toLocaleDateString(), PAGE.width - 132, PAGE.height - 44, regular, 10, muted);
}

function download(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dueDate(payment: Payment, player: Player) {
  return new Date(payment.year, payment.month - 1, Math.min(player.start_day || 1, 28));
}

function isDebt(payment: Payment, player: Player) {
  return payment.status === "overdue" || (payment.status !== "paid" && dueDate(payment, player) <= new Date());
}

export async function downloadPlayerPaymentsPdf({
  player,
  payments,
  clubName,
  sportName,
  monthShort,
  formatMoney,
}: {
  player: Player;
  payments: Payment[];
  clubName: string;
  sportName: string;
  monthShort: MonthFormatter;
  formatMoney: MoneyFormatter;
}) {
  const { pdf, regular, bold } = await createDoc();
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  header(page, `${player.first_name} ${player.last_name} — გადახდები`, `${clubName} · ${sportName} · #${player.t_number}`, bold, regular);

  const rows = payments.filter((p) => p.player_id === player.id).sort((a, b) => a.year - b.year || a.month - b.month);
  let y = PAGE.height - 128;
  const cols = [42, 170, 282, 390, 485];
  ["თვე", "თანხა", "სტატუსი", "გადახდის თარიღი", "შენიშვნა"].forEach((label, i) => text(page, label, cols[i], y, bold, 9, muted));
  y -= 14;
  page.drawLine({ start: { x: 40, y }, end: { x: PAGE.width - 40, y }, thickness: 1, color: line });
  y -= 20;

  rows.forEach((payment) => {
    const statusColor = payment.status === "paid" ? success : payment.status === "overdue" ? danger : muted;
    text(page, `${monthShort(payment.month)} ${payment.year}`, cols[0], y, regular, 10);
    text(page, formatMoney(payment.amount), cols[1], y, regular, 10);
    text(page, payment.status === "paid" ? "გადახდილი" : payment.status === "overdue" ? "დავალიანება" : "მოლოდინში", cols[2], y, bold, 10, statusColor);
    text(page, payment.payment_date ?? "—", cols[3], y, regular, 10);
    text(page, fit(payment.notes ?? "—", regular, 10, 68), cols[4], y, regular, 10);
    y -= 22;
  });

  const paid = rows.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const debt = rows.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  page.drawRectangle({ x: 40, y: 48, width: PAGE.width - 80, height: 48, color: rgb(0.98, 0.99, 1), borderColor: line, borderWidth: 1 });
  text(page, `გადახდილი: ${formatMoney(paid)}`, 58, 66, bold, 11, success);
  text(page, `დარჩენილი: ${formatMoney(debt)}`, 230, 66, bold, 11, danger);

  download(await pdf.save(), `${player.first_name}-${player.last_name}-payments.pdf`);
}

export async function downloadAllDebtsPdf({
  players,
  payments,
  clubName,
  sportName,
  formatMoney,
}: {
  players: Player[];
  payments: Payment[];
  clubName: string;
  sportName: string;
  formatMoney: MoneyFormatter;
}) {
  const { pdf, regular, bold } = await createDoc();
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  header(page, "ყველა დავალიანება", `${clubName} · ${sportName}`, bold, regular);
  let y = PAGE.height - 128;
  const cols = [42, 190, 326, 442];
  ["სახელი და გვარი", "ტელეფონი", "თვეები", "თანხა"].forEach((label, i) => text(page, label, cols[i], y, bold, 9, muted));
  y -= 14;
  page.drawLine({ start: { x: 40, y }, end: { x: PAGE.width - 40, y }, thickness: 1, color: line });
  y -= 20;

  let total = 0;
  players.forEach((player) => {
    const debts = payments.filter((p) => p.player_id === player.id && isDebt(p, player));
    if (debts.length === 0) return;
    const amount = debts.reduce((s, p) => s + p.amount, 0);
    total += amount;
    text(page, fit(`${player.first_name} ${player.last_name}`, regular, 10, 132), cols[0], y, regular, 10);
    text(page, fit(player.primary_contact === "parent" ? player.parent_phone ?? player.phone ?? "—" : player.phone ?? player.parent_phone ?? "—", regular, 10, 120), cols[1], y, regular, 10);
    text(page, `${debts.length}`, cols[2], y, bold, 10, danger);
    text(page, formatMoney(amount), cols[3], y, bold, 10, danger);
    y -= 22;
  });

  page.drawRectangle({ x: 40, y: 48, width: PAGE.width - 80, height: 48, color: rgb(1, 0.96, 0.96), borderColor: rgb(0.95, 0.78, 0.78), borderWidth: 1 });
  text(page, `სულ დავალიანება: ${formatMoney(total)}`, 58, 66, bold, 12, danger);
  download(await pdf.save(), "all-overdue-payments.pdf");
}