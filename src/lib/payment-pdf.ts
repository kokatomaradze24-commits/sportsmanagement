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

const BOTTOM_LIMIT = 118;

function startPage(
  pdf: Awaited<ReturnType<typeof createDoc>>["pdf"],
  title: string,
  subtitle: string,
  cols: number[],
  headers: string[],
  boldFont: PDFFont,
  bodyFont: PDFFont,
) {
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  header(page, title, subtitle, boldFont, bodyFont);
  let y = PAGE.height - 128;
  headers.forEach((label, i) => text(page, label, cols[i], y, boldFont, 9, muted));
  y -= 14;
  page.drawLine({ start: { x: 40, y }, end: { x: PAGE.width - 40, y }, thickness: 1, color: line });
  y -= 20;
  return { page, y };
}

function drawFooters(pdf: Awaited<ReturnType<typeof createDoc>>["pdf"], font: PDFFont, label: string) {
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    text(p, `${label} ${i + 1} / ${pages.length}`, PAGE.width / 2 - 24, 26, font, 9, muted);
  });
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

  const title = `${player.first_name} ${player.last_name} — ${labels.payments}`;
  const subtitle = `${clubName} · ${sportName} · #${player.t_number}`;
  const cols = [42, 170, 282, 390, 485];
  const headers = [labels.month, labels.amount, labels.status, labels.paidDate, labels.note];

  let { page, y } = startPage(pdf, title, subtitle, cols, headers, boldFont, bodyFont);

  const rows = payments.filter((p) => p.player_id === player.id).sort((a, b) => a.year - b.year || a.month - b.month);

  rows.forEach((payment) => {
    if (y < BOTTOM_LIMIT) {
      ({ page, y } = startPage(pdf, title, subtitle, cols, headers, boldFont, bodyFont));
    }
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
  if (y < BOTTOM_LIMIT) {
    ({ page, y } = startPage(pdf, title, subtitle, cols, headers, boldFont, bodyFont));
  }
  page.drawRectangle({ x: 40, y: 48, width: PAGE.width - 80, height: 48, color: rgb(0.98, 0.99, 1), borderColor: line, borderWidth: 1 });
  text(page, `${labels.paid}: ${formatMoney(paid)}`, 58, 66, boldFont, 11, success);
  text(page, `${labels.remaining}: ${formatMoney(debt)}`, 230, 66, boldFont, 11, danger);

  drawFooters(pdf, bodyFont, labels.page);
  download(await pdf.save(), `${player.first_name}-${player.last_name}-payments.pdf`);
}

const playersListText: Record<PdfLanguage, {
  title: string;
  jersey: string;
  fee: string;
  birthDate: string;
  status: string;
  active: string;
  inactive: string;
  total: string;
  currentMonth: string;
  monthPaid: string;
  monthDebt: string;
  monthNone: string;
  paidCount: string;
  debtCount: string;
}> = {
  en: { title: "Players list", jersey: "Jersey", fee: "Monthly fee", birthDate: "Birth date", status: "Status", active: "Active", inactive: "Inactive", total: "Total players", currentMonth: "Current month", monthPaid: "Paid", monthDebt: "Debt", monthNone: "—", paidCount: "Paid this month", debtCount: "In debt this month" },
  ka: { title: "მოთამაშეების სია", jersey: "ნომერი", fee: "თვიური გადასახადი", birthDate: "დაბ. თარიღი", status: "სტატუსი", active: "აქტიური", inactive: "არააქტიური", total: "სულ მოთამაშე", currentMonth: "მიმდინარე თვე", monthPaid: "გადახდილი", monthDebt: "დავალიანება", monthNone: "—", paidCount: "გადახდილი ამ თვის", debtCount: "დავალიანება ამ თვის" },
  de: { title: "Spielerliste", jersey: "Nr.", fee: "Monatsbeitrag", birthDate: "Geburtsdatum", status: "Status", active: "Aktiv", inactive: "Inaktiv", total: "Spieler gesamt", currentMonth: "Aktueller Monat", monthPaid: "Bezahlt", monthDebt: "Schuld", monthNone: "—", paidCount: "Diesen Monat bezahlt", debtCount: "Diesen Monat Schuld" },
  es: { title: "Lista de jugadores", jersey: "Dorsal", fee: "Cuota mensual", birthDate: "Fecha de nac.", status: "Estado", active: "Activo", inactive: "Inactivo", total: "Jugadores totales", currentMonth: "Mes actual", monthPaid: "Pagado", monthDebt: "Deuda", monthNone: "—", paidCount: "Pagado este mes", debtCount: "Deuda este mes" },
  fr: { title: "Liste des joueurs", jersey: "N°", fee: "Cotisation", birthDate: "Date de naiss.", status: "Statut", active: "Actif", inactive: "Inactif", total: "Joueurs au total", currentMonth: "Mois en cours", monthPaid: "Payé", monthDebt: "Dette", monthNone: "—", paidCount: "Payé ce mois", debtCount: "Dette ce mois" },
  ru: { title: "Список игроков", jersey: "Номер", fee: "Взнос в месяц", birthDate: "Дата рожд.", status: "Статус", active: "Активен", inactive: "Неактивен", total: "Всего игроков", currentMonth: "Текущий месяц", monthPaid: "Оплачено", monthDebt: "Долг", monthNone: "—", paidCount: "Оплачено в этом месяце", debtCount: "Долг в этом месяце" },
};

export async function downloadPlayersListPdf({
  players,
  payments,
  clubName,
  sportName,
  formatMoney,
  language,
}: {
  players: Player[];
  payments?: Payment[];
  clubName: string;
  sportName: string;
  formatMoney: MoneyFormatter;
  language: PdfLanguage;
}) {
  const { pdf, regular, bold, latinRegular, latinBold } = await createDoc();
  const labels = pdfText[language] ?? pdfText.en;
  const list = playersListText[language] ?? playersListText.en;
  const bodyFont = language === "ka" ? regular : latinRegular;
  const boldFont = language === "ka" ? bold : latinBold;

  const subtitle = `${clubName} · ${sportName}`;
  const cols = [42, 160, 200, 286, 348, 408, 488];
  const headers = [labels.fullName, list.jersey, labels.phone, labels.contactType, list.fee, list.currentMonth, list.birthDate];

  const now = new Date();
  const cm = now.getMonth() + 1;
  const cy = now.getFullYear();

  type MonthStatus = "paid" | "debt" | "none";
  const monthStatus = (player: Player): MonthStatus => {
    if (!payments) return "none";
    const rows = payments.filter((p) => p.player_id === player.id && p.month === cm && p.year === cy);
    if (rows.some((p) => p.status === "paid")) return "paid";
    if (rows.some((p) => p.status === "overdue")) return "debt";
    if (rows.some((p) => p.status !== "paid" && dueDate(p, player) <= now)) return "debt";
    if (rows.length > 0) return "none";
    return "none";
  };

  const sorted = [...players].sort((a, b) => a.first_name.localeCompare(b.first_name) || a.last_name.localeCompare(b.last_name));

  let { page, y } = startPage(pdf, list.title, subtitle, cols, headers, boldFont, bodyFont);

  let paidCount = 0;
  let debtCount = 0;

  sorted.forEach((player) => {
    if (y < BOTTOM_LIMIT) {
      ({ page, y } = startPage(pdf, list.title, subtitle, cols, headers, boldFont, bodyFont));
    }

    const preferParent = player.primary_contact === "parent";
    const parentPhone = player.parent_phone ?? null;
    const playerPhone = player.phone ?? null;
    const phone = preferParent ? parentPhone ?? playerPhone : playerPhone ?? parentPhone;
    const usedParent = phone != null && phone === parentPhone && (preferParent || !playerPhone);
    const contactLabel = phone ? (usedParent ? labels.parentContact : labels.playerContact) : "—";

    const ms = monthStatus(player);
    if (ms === "paid") paidCount++;
    if (ms === "debt") debtCount++;
    const msLabel = ms === "paid" ? list.monthPaid : ms === "debt" ? list.monthDebt : list.monthNone;
    const msColor = ms === "paid" ? success : ms === "debt" ? danger : muted;

    text(page, fit(`${player.first_name} ${player.last_name}`, bodyFont, 10, 112), cols[0], y, bodyFont, 10, player.is_active ? ink : muted);
    text(page, `#${player.t_number}`, cols[1], y, bodyFont, 10);
    text(page, fit(phone ?? "—", bodyFont, 10, 78), cols[2], y, bodyFont, 10);
    text(page, contactLabel, cols[3], y, bodyFont, 9, usedParent ? accent : muted);
    text(page, formatMoney(player.monthly_fee), cols[4], y, bodyFont, 10);
    text(page, msLabel, cols[5], y, boldFont, 9, msColor);
    text(page, player.birth_date ?? "—", cols[6], y, bodyFont, 10);
    y -= 22;
  });

  if (y < BOTTOM_LIMIT) {
    ({ page, y } = startPage(pdf, list.title, subtitle, cols, headers, boldFont, bodyFont));
  }
  const activeCount = sorted.filter((p) => p.is_active).length;
  page.drawRectangle({ x: 40, y: 48, width: PAGE.width - 80, height: 48, color: rgb(0.95, 0.97, 1), borderColor: line, borderWidth: 1 });
  text(page, `${list.total}: ${sorted.length}`, 58, 66, boldFont, 11, accent);
  text(page, `${list.active}: ${activeCount}`, 200, 66, boldFont, 11, success);
  text(page, `${list.inactive}: ${sorted.length - activeCount}`, 330, 66, boldFont, 11, muted);
  if (payments) {
    text(page, `${list.paidCount}: ${paidCount}`, 58, 36, boldFont, 10, success);
    text(page, `${list.debtCount}: ${debtCount}`, 200, 36, boldFont, 10, danger);
  }

  drawFooters(pdf, bodyFont, labels.page);
  download(await pdf.save(), "players-list.pdf");
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

  const subtitle = `${clubName} · ${sportName}`;
  const cols = [42, 176, 292, 400, 470];
  const headers = [labels.fullName, labels.phone, labels.contactType, labels.months, labels.amount];

  let { page, y } = startPage(pdf, labels.debts, subtitle, cols, headers, boldFont, bodyFont);

  let total = 0;
  players.forEach((player) => {
    const debts = payments.filter((p) => p.player_id === player.id && isDebt(p, player));
    if (debts.length === 0) return;
    const amount = debts.reduce((s, p) => s + p.amount, 0);
    total += amount;

    if (y < BOTTOM_LIMIT) {
      ({ page, y } = startPage(pdf, labels.debts, subtitle, cols, headers, boldFont, bodyFont));
    }

    const preferParent = player.primary_contact === "parent";
    const parentPhone = player.parent_phone ?? null;
    const playerPhone = player.phone ?? null;
    const phone = preferParent ? parentPhone ?? playerPhone : playerPhone ?? parentPhone;
    const usedParent = phone != null && phone === parentPhone && (preferParent || !playerPhone);
    const contactLabel = phone ? (usedParent ? labels.parentContact : labels.playerContact) : "—";

    text(page, fit(`${player.first_name} ${player.last_name}`, bodyFont, 10, 126), cols[0], y, bodyFont, 10);
    text(page, fit(phone ?? "—", bodyFont, 10, 108), cols[1], y, bodyFont, 10);
    text(page, contactLabel, cols[2], y, bodyFont, 9, usedParent ? accent : muted);
    text(page, `${debts.length}`, cols[3], y, boldFont, 10, danger);
    text(page, formatMoney(amount), cols[4], y, boldFont, 10, danger);
    y -= 22;
  });

  if (y < BOTTOM_LIMIT) {
    ({ page, y } = startPage(pdf, labels.debts, subtitle, cols, headers, boldFont, bodyFont));
  }
  page.drawRectangle({ x: 40, y: 48, width: PAGE.width - 80, height: 48, color: rgb(1, 0.96, 0.96), borderColor: rgb(0.95, 0.78, 0.78), borderWidth: 1 });
  text(page, `${labels.totalDebt}: ${formatMoney(total)}`, 58, 66, boldFont, 12, danger);

  drawFooters(pdf, bodyFont, labels.page);
  download(await pdf.save(), "all-overdue-payments.pdf");
}
