import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import regularFontUrl from "../assets/fonts/NotoSansGeorgian-Regular.ttf?url";
import boldFontUrl from "../assets/fonts/NotoSansGeorgian-Bold.ttf?url";
import latinRegularFontUrl from "@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff?url";
import latinBoldFontUrl from "@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff?url";
import type { Database } from "@/integrations/supabase/types";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

type MoneyFormatter = (amount: number) => string;
type MonthFormatter = (month: number) => string;
type PdfLanguage = "de" | "en" | "es" | "fr" | "ka" | "ru";

const pdfText: Record<PdfLanguage, {
  payments: string;
  debts: string;
  month: string;
  amount: string;
  status: string;
  paidDate: string;
  note: string;
  fullName: string;
  phone: string;
  months: string;
  paid: string;
  remaining: string;
  totalDebt: string;
  paidStatus: string;
  overdueStatus: string;
  pendingStatus: string;
  contactType: string;
  parentContact: string;
  playerContact: string;
  page: string;
}> = {
  en: { payments: "Payments", debts: "All debts", month: "Month", amount: "Amount", status: "Status", paidDate: "Payment date", note: "Note", fullName: "Full name", phone: "Phone", months: "Months", paid: "Paid", remaining: "Remaining", totalDebt: "Total debt", paidStatus: "Paid", overdueStatus: "Overdue", pendingStatus: "Pending", contactType: "Contact", parentContact: "Parent", playerContact: "Player", page: "Page" },
  ka: { payments: "გადახდები", debts: "ყველა დავალიანება", month: "თვე", amount: "თანხა", status: "სტატუსი", paidDate: "გადახდის თარიღი", note: "შენიშვნა", fullName: "სახელი და გვარი", phone: "ტელეფონი", months: "თვეები", paid: "გადახდილი", remaining: "დარჩენილი", totalDebt: "სულ დავალიანება", paidStatus: "გადახდილი", overdueStatus: "დავალიანება", pendingStatus: "მოლოდინში", contactType: "კონტაქტი", parentContact: "მშობელი", playerContact: "მოთამაშე", page: "გვერდი" },
  de: { payments: "Zahlungen", debts: "Alle Schulden", month: "Monat", amount: "Betrag", status: "Status", paidDate: "Zahlungsdatum", note: "Notiz", fullName: "Name", phone: "Telefon", months: "Monate", paid: "Bezahlt", remaining: "Offen", totalDebt: "Gesamtschuld", paidStatus: "Bezahlt", overdueStatus: "Überfällig", pendingStatus: "Ausstehend", contactType: "Kontakt", parentContact: "Elternteil", playerContact: "Spieler", page: "Seite" },
  es: { payments: "Pagos", debts: "Todas las deudas", month: "Mes", amount: "Importe", status: "Estado", paidDate: "Fecha de pago", note: "Nota", fullName: "Nombre completo", phone: "Teléfono", months: "Meses", paid: "Pagado", remaining: "Pendiente", totalDebt: "Deuda total", paidStatus: "Pagado", overdueStatus: "Vencido", pendingStatus: "Pendiente", contactType: "Contacto", parentContact: "Padre/Madre", playerContact: "Jugador", page: "Página" },
  fr: { payments: "Paiements", debts: "Toutes les dettes", month: "Mois", amount: "Montant", status: "Statut", paidDate: "Date de paiement", note: "Note", fullName: "Nom complet", phone: "Téléphone", months: "Mois", paid: "Payé", remaining: "Restant", totalDebt: "Dette totale", paidStatus: "Payé", overdueStatus: "En retard", pendingStatus: "En attente", contactType: "Contact", parentContact: "Parent", playerContact: "Joueur", page: "Page" },
  ru: { payments: "Платежи", debts: "Все долги", month: "Месяц", amount: "Сумма", status: "Статус", paidDate: "Дата оплаты", note: "Примечание", fullName: "Имя и фамилия", phone: "Телефон", months: "Месяцы", paid: "Оплачено", remaining: "Осталось", totalDebt: "Общий долг", paidStatus: "Оплачено", overdueStatus: "Просрочено", pendingStatus: "Ожидает", contactType: "Контакт", parentContact: "Родитель", playerContact: "Игрок", page: "Страница" },
};

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
  const [regularBytes, boldBytes, latinRegularBytes, latinBoldBytes] = await Promise.all([
    loadFont(regularFontUrl),
    loadFont(boldFontUrl),
    loadFont(latinRegularFontUrl),
    loadFont(latinBoldFontUrl),
  ]);
  return {
    pdf,
    regular: await pdf.embedFont(regularBytes),
    bold: await pdf.embedFont(boldBytes),
    latinRegular: await pdf.embedFont(latinRegularBytes),
    latinBold: await pdf.embedFont(latinBoldBytes),
  };
}

function safePdfText(value: string) {
  return (value || "—").replace(/₾/g, "GEL ").replace(/€/g, "EUR ").replace(/\$/g, "USD ");
}

function text(page: PDFPage, value: string, x: number, y: number, font: PDFFont, size = 10, color = ink) {
  page.drawText(safePdfText(value), { x, y, size, font, color });
}

function fit(value: string, font: PDFFont, size: number, maxWidth: number) {
  value = safePdfText(value);
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
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
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
  language,
}: {
  player: Player;
  payments: Payment[];
  clubName: string;
  sportName: string;
  monthShort: MonthFormatter;
  formatMoney: MoneyFormatter;
  language: PdfLanguage;
}) {
  const { pdf, regular, bold, latinRegular, latinBold } = await createDoc();
  const labels = pdfText[language] ?? pdfText.en;
  const bodyFont = language === "ka" ? regular : latinRegular;
  const boldFont = language === "ka" ? bold : latinBold;
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  header(page, `${player.first_name} ${player.last_name} — ${labels.payments}`, `${clubName} · ${sportName} · #${player.t_number}`, boldFont, bodyFont);

  const rows = payments.filter((p) => p.player_id === player.id).sort((a, b) => a.year - b.year || a.month - b.month);
  let y = PAGE.height - 128;
  const cols = [42, 170, 282, 390, 485];
  [labels.month, labels.amount, labels.status, labels.paidDate, labels.note].forEach((label, i) => text(page, label, cols[i], y, boldFont, 9, muted));
  y -= 14;
  page.drawLine({ start: { x: 40, y }, end: { x: PAGE.width - 40, y }, thickness: 1, color: line });
  y -= 20;

  rows.forEach((payment) => {
    const statusColor = payment.status === "paid" ? success : payment.status === "overdue" ? danger : muted;
    text(page, `${monthShort(payment.month)} ${payment.year}`, cols[0], y, bodyFont, 10);
    text(page, formatMoney(payment.amount), cols[1], y, bodyFont, 10);
    text(page, payment.status === "paid" ? labels.paidStatus : payment.status === "overdue" ? labels.overdueStatus : labels.pendingStatus, cols[2], y, boldFont, 10, statusColor);
    text(page, payment.payment_date ?? "—", cols[3], y, bodyFont, 10);
    text(page, fit(payment.notes ?? "—", bodyFont, 10, 68), cols[4], y, bodyFont, 10);
    y -= 22;
  });

  const paid = rows.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const debt = rows.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  page.drawRectangle({ x: 40, y: 48, width: PAGE.width - 80, height: 48, color: rgb(0.98, 0.99, 1), borderColor: line, borderWidth: 1 });
  text(page, `${labels.paid}: ${formatMoney(paid)}`, 58, 66, boldFont, 11, success);
  text(page, `${labels.remaining}: ${formatMoney(debt)}`, 230, 66, boldFont, 11, danger);

  download(await pdf.save(), `${player.first_name}-${player.last_name}-payments.pdf`);
}

export async function downloadAllDebtsPdf({
  players,
  payments,
  clubName,
  sportName,
  formatMoney,
  language,
}: {
  players: Player[];
  payments: Payment[];
  clubName: string;
  sportName: string;
  formatMoney: MoneyFormatter;
  language: PdfLanguage;
}) {
  const { pdf, regular, bold, latinRegular, latinBold } = await createDoc();
  const labels = pdfText[language] ?? pdfText.en;
  const bodyFont = language === "ka" ? regular : latinRegular;
  const boldFont = language === "ka" ? bold : latinBold;
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  header(page, labels.debts, `${clubName} · ${sportName}`, boldFont, bodyFont);
  let y = PAGE.height - 128;
  const cols = [42, 190, 326, 442];
  [labels.fullName, labels.phone, labels.months, labels.amount].forEach((label, i) => text(page, label, cols[i], y, boldFont, 9, muted));
  y -= 14;
  page.drawLine({ start: { x: 40, y }, end: { x: PAGE.width - 40, y }, thickness: 1, color: line });
  y -= 20;

  let total = 0;
  players.forEach((player) => {
    const debts = payments.filter((p) => p.player_id === player.id && isDebt(p, player));
    if (debts.length === 0) return;
    const amount = debts.reduce((s, p) => s + p.amount, 0);
    total += amount;
    text(page, fit(`${player.first_name} ${player.last_name}`, bodyFont, 10, 132), cols[0], y, bodyFont, 10);
    text(page, fit(player.primary_contact === "parent" ? player.parent_phone ?? player.phone ?? "—" : player.phone ?? player.parent_phone ?? "—", bodyFont, 10, 120), cols[1], y, bodyFont, 10);
    text(page, `${debts.length}`, cols[2], y, boldFont, 10, danger);
    text(page, formatMoney(amount), cols[3], y, boldFont, 10, danger);
    y -= 22;
  });

  page.drawRectangle({ x: 40, y: 48, width: PAGE.width - 80, height: 48, color: rgb(1, 0.96, 0.96), borderColor: rgb(0.95, 0.78, 0.78), borderWidth: 1 });
  text(page, `${labels.totalDebt}: ${formatMoney(total)}`, 58, 66, boldFont, 12, danger);
  download(await pdf.save(), "all-overdue-payments.pdf");
}