import { paidOf, remainingOf } from "./payment-due";

export type BankPlayer = {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  family_id?: string | null;
  created_at: string;
};
export type BankPayment = {
  id: string;
  player_id: string;
  month: number;
  year: number;
  amount: number | string;
  paid_amount?: number | string | null;
  status: string;
  payment_date?: string | null;
};
export type PayerAlias = { id: string; payer_name: string; player_id: string };
export type BankTransaction = {
  key: string;
  date: string;
  amount: number;
  sender: string;
  purpose: string;
};
export type Confidence = "high" | "medium" | "unmatched";
export type ReviewTransaction = BankTransaction & {
  playerId: string;
  confidence: Confidence;
  confirmed: boolean;
  remember: boolean;
  skip: boolean;
  duplicate: boolean;
  targetMonth: string;
  /** Matched player's schedule already shows this transfer (entered by hand). */
  recorded: boolean;
  /** User explicitly included a recorded / future-month row. */
  include: boolean;
  /** Remember a recorded row as handled (ledger only, no payment change). */
  handled: boolean;
  /** Transaction date is after today; never applied. */
  futureDate: boolean;
};
export type Allocation = {
  paymentId: string;
  playerId: string;
  month: number;
  year: number;
  amount: number;
  expectedPaid: number;
  resultingPaid: number;
  fullyPaid: boolean;
};
export type AllocationPreview = { allocations: Allocation[]; leftover: number; futureMonth: boolean };
const GEORGIAN = "აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ";
const LATIN = [
  "a",
  "b",
  "g",
  "d",
  "e",
  "v",
  "z",
  "t",
  "i",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "zh",
  "r",
  "s",
  "t",
  "u",
  "f",
  "k",
  "gh",
  "q",
  "sh",
  "ch",
  "ts",
  "dz",
  "ts",
  "ch",
  "kh",
  "j",
  "h",
];

export function transliterate(value: string): string {
  return [...value.normalize("NFKC").toLowerCase()]
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      const lower = code >= 0x1c90 && code <= 0x1cbf ? String.fromCodePoint(code - 0xbc0) : char;
      const index = GEORGIAN.indexOf(lower);
      return index < 0 ? lower : LATIN[index];
    })
    .join("");
}
export function normalizeName(value: string): string {
  return transliterate(value)
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
function words(value: string) {
  return normalizeName(value).split(" ").filter(Boolean);
}
function containsName(text: string, player: BankPlayer): boolean {
  const tokens = words(text);
  const required = [...words(player.first_name), ...words(player.last_name)];
  if (required.length < 2) return false;
  const available = [...tokens];
  return required.every((word) => {
    const index = available.indexOf(word);
    if (index < 0) return false;
    available.splice(index, 1);
    return true;
  });
}
export function senderIsPlayer(sender: string, player: BankPlayer): boolean {
  return (
    words(sender).length === words(`${player.first_name} ${player.last_name}`).length &&
    containsName(sender, player)
  );
}
export function matchTransaction(
  tx: BankTransaction,
  players: BankPlayer[],
  aliases: PayerAlias[],
): { playerId: string; confidence: Confidence } {
  const active = players.filter((p) => p.is_active);
  const full = active.filter((p) => containsName(tx.purpose, p));
  if (full.length === 1) return { playerId: full[0].id, confidence: "high" };
  if (full.length > 1) return { playerId: "", confidence: "unmatched" };
  const alias = aliases.find(
    (a) =>
      normalizeName(a.payer_name) === normalizeName(tx.sender) &&
      active.some((p) => p.id === a.player_id),
  );
  if (alias) return { playerId: alias.player_id, confidence: "high" };
  const sender = words(tx.sender);
  const surnames = active.filter((p) => {
    const surname = words(p.last_name);
    return surname.length > 0 && surname.every((word) => sender.includes(word));
  });
  if (surnames.length === 1) return { playerId: surnames[0].id, confidence: "medium" };
  return { playerId: "", confidence: "unmatched" };
}
export function canonicalTransaction(
  date: string,
  amount: number,
  sender: string,
  purpose: string,
  bankId?: string,
): string {
  return bankId?.trim()
    ? `tbc:id:${bankId.trim()}`
    : JSON.stringify([
        "tbc",
        date,
        Math.round(amount * 100),
        normalizeName(sender),
        normalizeName(purpose),
      ]);
}
const cents = (value: number) => Math.round(value * 100);
export function allocateTransaction(
  amount: number,
  playerId: string,
  players: BankPlayer[],
  payments: BankPayment[],
  targetMonth = "",
): AllocationPreview {
  const player = players.find((p) => p.id === playerId);
  if (!player) return { allocations: [], leftover: amount, futureMonth: false };
  const members = players
    .filter((p) => p.id === playerId || (player.family_id && p.family_id === player.family_id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const memberOrder = new Map(members.map((p, i) => [p.id, i]));
  const eligible = payments
    .filter(
      (p) =>
        memberOrder.has(p.player_id) &&
        remainingOf(p) > 0 &&
        (!targetMonth || `${p.year}-${String(p.month).padStart(2, "0")}` >= targetMonth),
    )
    .sort(
      (a, b) =>
        a.year - b.year ||
        a.month - b.month ||
        (memberOrder.get(a.player_id) ?? 0) - (memberOrder.get(b.player_id) ?? 0) ||
        a.id.localeCompare(b.id),
    );
  let left = cents(amount);
  const allocations: Allocation[] = [];
  for (const payment of eligible) {
    if (left <= 0) break;
    const applied = Math.min(left, cents(remainingOf(payment)));
    const expected = cents(paidOf(payment));
    allocations.push({
      paymentId: payment.id,
      playerId: payment.player_id,
      month: payment.month,
      year: payment.year,
      amount: applied / 100,
      expectedPaid: expected / 100,
      resultingPaid: (expected + applied) / 100,
      fullyPaid: expected + applied >= cents(Number(payment.amount)),
    });
    left -= applied;
  }
  return { allocations, leftover: Math.max(0, left) / 100, futureMonth: false };
}
const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;
/** True when an allocation month starts more than one month after the transfer date. */
export function paysFutureMonth(date: string, allocations: Pick<Allocation, "month" | "year">[]) {
  const [y, m, d] = date.split("-").map(Number);
  const limit = new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate()));
  const limitKey = `${monthKey(limit.getFullYear(), limit.getMonth() + 1)}-${String(limit.getDate()).padStart(2, "0")}`;
  return allocations.some((a) => `${monthKey(a.year, a.month)}-01` > limitKey);
}
const dayNumber = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
};
/** Detects a transfer that was already entered by hand on the matched player/family schedule. */
export function isAlreadyRecorded(
  tx: Pick<BankTransaction, "date" | "amount">,
  playerId: string,
  players: BankPlayer[],
  payments: BankPayment[],
): boolean {
  const player = players.find((p) => p.id === playerId);
  if (!player) return false;
  const family = new Set(
    players
      .filter((p) => p.id === playerId || (player.family_id && p.family_id === player.family_id))
      .map((p) => p.id),
  );
  const day = dayNumber(tx.date);
  const near = payments.filter(
    (p) =>
      family.has(p.player_id) &&
      p.payment_date &&
      Math.abs(dayNumber(String(p.payment_date).slice(0, 10)) - day) <= 3 &&
      paidOf(p) > 0,
  );
  if (cents(near.reduce((sum, p) => sum + paidOf(p), 0)) >= cents(tx.amount)) return true;
  const [y, m] = tx.date.split("-").map(Number);
  const own = payments.filter((p) => p.player_id === playerId && p.year === y && p.month === m);
  return own.length > 0 && own.every((p) => remainingOf(p) <= 0);
}
/** Whether a reviewed row is part of the Apply batch (with payment changes). */
export function rowIncluded(row: ReviewTransaction, preview?: AllocationPreview): boolean {
  if (row.skip || row.duplicate || row.futureDate || !row.playerId || !row.confirmed) return false;
  if ((row.recorded || preview?.futureMonth) && !row.include) return false;
  return (preview?.allocations.length ?? 0) > 0;
}
/** Recorded rows remembered as handled without payment changes. */
export function rowHandled(row: ReviewTransaction): boolean {
  return (
    row.recorded && row.handled && !row.include && !row.skip && !row.duplicate &&
    !row.futureDate && !!row.playerId && row.confirmed
  );
}
export function previewBatch(
  rows: ReviewTransaction[],
  players: BankPlayer[],
  payments: BankPayment[],
): Map<string, AllocationPreview> {
  const working = payments.map((p) => ({ ...p }));
  const previews = new Map<string, AllocationPreview>();
  for (const row of rows) {
    if (row.duplicate && previews.has(row.key)) continue;
    const base =
      row.skip || row.duplicate || row.futureDate
        ? { allocations: [], leftover: row.amount, futureMonth: false }
        : allocateTransaction(row.amount, row.playerId, players, working, row.targetMonth);
    const preview = { ...base, futureMonth: paysFutureMonth(row.date, base.allocations) };
    previews.set(row.key, preview);
    if (!rowIncluded(row, preview)) continue;
    for (const part of preview.allocations) {
      const payment = working.find((p) => p.id === part.paymentId);
      if (payment) {
        payment.paid_amount = part.resultingPaid;
        if (part.fullyPaid) payment.status = "paid";
      }
    }
  }
  return previews;
}
/** Per calendar month: number of payment rows changed by the included rows. */
export function monthChanges(rows: ReviewTransaction[], previews: Map<string, AllocationPreview>) {
  const months = new Map<string, Set<string>>();
  for (const row of rows) {
    const preview = previews.get(row.key);
    if (!rowIncluded(row, preview)) continue;
    for (const a of preview!.allocations) {
      const key = monthKey(a.year, a.month);
      if (!months.has(key)) months.set(key, new Set());
      months.get(key)!.add(a.paymentId);
    }
  }
  return [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, ids]) => ({ month, count: ids.size }));
}
/** Removes the trailing ", <personal id>" TBC appends to partner names. */
export function cleanPartnerName(value: string): string {
  return value.replace(/[,;]\s*\d{6,}\s*$/, "").trim();
}
/** Day-first unless the whole column proves month-first (second part > 12, no first part > 12). */
export function detectDateOrder(values: unknown[]): "dmy" | "mdy" {
  let firstOver = false, secondOver = false;
  for (const value of values) {
    if (value instanceof Date || typeof value === "number") continue;
    const m = String(value ?? "").trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.]\d{4}(?:\s|$)/);
    if (!m) continue;
    if (Number(m[1]) > 12) firstOver = true;
    if (Number(m[2]) > 12) secondOver = true;
  }
  return secondOver && !firstOver ? "mdy" : "dmy";
}

export type ColumnMapping = {
  date: number;
  amount: number;
  sender: number;
  purpose: number;
  /** Other purpose-like columns used as per-row fallback / joined for matching. */
  purposeAlt: number[];
  id: number;
  debit: number;
  direction: number;
};
export const EMPTY_MAPPING: ColumnMapping = {
  date: -1,
  amount: -1,
  sender: -1,
  purpose: -1,
  purposeAlt: [],
  id: -1,
  debit: -1,
  direction: -1,
};
const HEADERS: Record<keyof ColumnMapping, string[]> = {
  purposeAlt: [],
  date: ["date", "transaction date", "value date", "თარიღი", "ოპერაციის თარიღი"],
  amount: [
    "paid in",
    "credit",
    "credit amount",
    "credited amount",
    "incoming amount",
    "შემოსული თანხა",
    "ჩარიცხვა",
    "კრედიტი",
    "შემოსავალი",
    "amount",
    "თანხა",
  ],
  sender: [
    "sender",
    "sender name",
    "partner",
    "partner name",
    "partner's name",
    "გამგზავნი",
    "პარტნიორი",
    "პარტნიორის დასახელება",
    "გამგზავნის სახელი",
  ],
  purpose: [
    "purpose",
    "დანიშნულება",
    "description",
    "აღწერა",
    "additional information",
    "დამატებითი ინფორმაცია",
  ],
  id: [
    "transaction id",
    "ტრანზაქციის id",
    "document id",
    "document number",
    "document no",
    "reference",
    "ოპერაციის ნომერი",
    "დოკუმენტის ნომერი",
    "დოკუმენტი",
  ],
  debit: [
    "paid out",
    "debit",
    "debit amount",
    "outgoing amount",
    "გასული თანხა",
    "გასავალი",
    "დებეტი",
  ],
  direction: [
    "direction",
    "type",
    "transaction type",
    "ოპერაციის ტიპი",
    "ტრანზაქციის ტიპი",
    "მიმართულება",
  ],
};
/** Purpose-like headers beyond the primary one, used as per-row fallback and joined for matching. */
const PURPOSE_ALT_HEADERS = [
  "purpose",
  "დანიშნულება",
  "description",
  "აღწერა",
  "additional information",
  "დამატებითი ინფორმაცია",
  "additional description",
];
const headerText = (value: unknown) =>
  String(value ?? "")
    .replace(/^\ufeff/, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[\s_\-:]+/g, " ")
    .trim();
export function detectColumns(grid: unknown[][]): {
  headerRow: number;
  mapping: ColumnMapping;
  confident: boolean;
} {
  let best = { headerRow: 0, mapping: { ...EMPTY_MAPPING }, confident: false };
  let bestScore = 0;
  grid.slice(0, 40).forEach((row, headerRow) => {
    const mapping = { ...EMPTY_MAPPING };
    (Object.keys(HEADERS) as (keyof ColumnMapping)[]).forEach((field) => {
      const aliases = HEADERS[field].map(headerText);
      for (const alias of aliases) {
        const index = row.findIndex((value) => headerText(value) === alias);
        if (index >= 0) {
          mapping[field] = index;
          break;
        }
      }
      if (mapping[field] < 0)
        mapping[field] = row.findIndex((value) => {
          const text = headerText(value);
          return (
            text.length > 2 &&
            aliases.some((alias) => alias.length > 5 && text.startsWith(alias + " ("))
          );
        });
    });
    const altAliases = PURPOSE_ALT_HEADERS.map(headerText);
    mapping.purposeAlt = row
      .map((value, index) => ({ text: headerText(value), index }))
      .filter(({ text, index }) => index !== mapping.purpose && altAliases.includes(text))
      .map(({ index }) => index);
    const score = Object.entries(mapping).filter(([k, v]) =>
      k === "purposeAlt" ? (v as number[]).length > 0 : (v as number) >= 0,
    ).length;
    const signedOnly =
      ["amount", "თანხა"].includes(headerText(row[mapping.amount])) &&
      mapping.debit < 0 &&
      mapping.direction < 0;
    if (score > bestScore) {
      bestScore = score;
      best = {
        headerRow,
        mapping,
        confident: mapping.date >= 0 && mapping.amount >= 0 && mapping.sender >= 0 && !signedOnly,
      };
    }
  });
  return best;
}
export function parseBankAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let text = String(value ?? "")
    .trim()
    .replace(/[\s\u00a0₾$€]/g, "");
  const negative = /^\(.*\)$/.test(text);
  text = text.replace(/[()]/g, "");
  if (text.includes(",") && text.includes("."))
    text =
      text.lastIndexOf(",") > text.lastIndexOf(".")
        ? text.replace(/\./g, "").replace(",", ".")
        : text.replace(/,/g, "");
  else if (text.includes(","))
    text = /,\d{1,2}$/.test(text) ? text.replace(",", ".") : text.replace(/,/g, "");
  const number = Number(text);
  return Number.isFinite(number) ? number * (negative ? -1 : 1) : 0;
}
export function parseBankDate(value: unknown, order: "dmy" | "mdy" = "dmy"): string | null {
  let year = 0,
    month = 0,
    day = 0;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    year = value.getFullYear();
    month = value.getMonth() + 1;
    day = value.getDate();
  } else if (typeof value === "number" && value > 1 && value < 100000) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000);
    year = date.getUTCFullYear();
    month = date.getUTCMonth() + 1;
    day = date.getUTCDate();
  } else {
    const text = String(value ?? "").trim();
    const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s|T|$)/);
    const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s|$)/);
    if (iso) [, year, month, day] = iso.map(Number);
    else if (dmy) {
      day = Number(dmy[order === "dmy" ? 1 : 2]);
      month = Number(dmy[order === "dmy" ? 2 : 1]);
      year = Number(dmy[3]);
    }
  }
  const date = new Date(year, month - 1, day);
  return year >= 1900 &&
    year <= 2200 &&
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    : null;
}
export function parseMappedRows(
  grid: unknown[][],
  headerRow: number,
  mapping: ColumnMapping,
): {
  transactions: (Omit<BankTransaction, "key"> & { identity: string })[];
  ignored: number;
  invalid: number;
  dateOrder: "dmy" | "mdy";
} {
  const dateOrder = detectDateOrder(grid.slice(headerRow + 1).map((row) => row[mapping.date]));
  const transactions: (Omit<BankTransaction, "key"> & { identity: string })[] = [];
  let ignored = 0,
    invalid = 0;
  for (const row of grid.slice(headerRow + 1)) {
    if (!row.some((v) => String(v ?? "").trim())) continue;
    const amount = parseBankAmount(row[mapping.amount]);
    const rawSender = String(row[mapping.sender] ?? "").trim();
    const sender = cleanPartnerName(rawSender);
    const purposePrimary = String(row[mapping.purpose] ?? "").trim();
    const purpose = [
      purposePrimary,
      ...mapping.purposeAlt.map((index) => String(row[index] ?? "").trim()),
    ]
      .filter(Boolean)
      .filter((part, index, parts) => parts.indexOf(part) === index)
      .join(" ");
    const direction = String(row[mapping.direction] ?? "").toLowerCase();
    const meta = `${sender} ${purpose}`.toLowerCase();
    if (
      amount <= 0 ||
      (mapping.debit >= 0 && parseBankAmount(row[mapping.debit]) > 0) ||
      /debit|outgoing|paid out|გასავალი|ჩამოჭრა|fee|commission|საკომისიო/.test(direction) ||
      /^(opening balance|closing balance|balance|total|ნაშთი|საწყისი ნაშთი|საბოლოო ნაშთი|ჯამი)(?:\s|$)/i.test(
        meta.trim(),
      ) ||
      /^(fee|commission|საკომისიო)(?:\s|$)/i.test(purpose.trim())
    ) {
      ignored++;
      continue;
    }
    const date = parseBankDate(row[mapping.date], dateOrder);
    if (!date) {
      invalid++;
      continue;
    }
    const rounded = Math.round(amount * 100) / 100;
    transactions.push({
      date,
      amount: rounded,
      sender,
      purpose,
      identity: canonicalTransaction(
        date,
        rounded,
        rawSender,
        purposePrimary,
        mapping.id >= 0 ? String(row[mapping.id] ?? "") : undefined,
      ),
    });
  }
  return { transactions, ignored, invalid, dateOrder };
}
