import { paidOf, remainingOf } from './payment-due';

export type BankPlayer = { id: string; first_name: string; last_name: string; is_active: boolean; family_id?: string | null; created_at: string };
export type BankPayment = { id: string; player_id: string; month: number; year: number; amount: number | string; paid_amount?: number | string | null; status: string };
export type PayerAlias = { id: string; payer_name: string; player_id: string };
export type BankTransaction = { key: string; date: string; amount: number; sender: string; purpose: string };
export type Confidence = 'high' | 'medium' | 'unmatched';
export type ReviewTransaction = BankTransaction & { playerId: string; confidence: Confidence; confirmed: boolean; remember: boolean; skip: boolean; duplicate: boolean; targetMonth: string };
export type Allocation = { paymentId: string; playerId: string; month: number; year: number; amount: number; expectedPaid: number; resultingPaid: number; fullyPaid: boolean };
export type AllocationPreview = { allocations: Allocation[]; leftover: number };
const GEORGIAN = 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ';
const LATIN = ['a','b','g','d','e','v','z','t','i','k','l','m','n','o','p','zh','r','s','t','u','f','k','gh','q','sh','ch','ts','dz','ts','ch','kh','j','h'];

export function transliterate(value: string): string {
 return [...value.normalize('NFKC').toLowerCase()].map(char => {
  const code = char.codePointAt(0) ?? 0;
  const lower = code >= 0x1c90 && code <= 0x1cbf ? String.fromCodePoint(code - 0xbc0) : char;
  const index = GEORGIAN.indexOf(lower);
  return index < 0 ? lower : LATIN[index];
 }).join('');
}
export function normalizeName(value: string): string {
 return transliterate(value).replace(/[’'`]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}
function words(value: string) { return normalizeName(value).split(' ').filter(Boolean); }
function containsName(text: string, player: BankPlayer): boolean {
 const tokens = words(text);
 const required = [...words(player.first_name), ...words(player.last_name)];
 if (required.length < 2) return false;
 const available = [...tokens];
 return required.every(word => { const index = available.indexOf(word); if (index < 0) return false; available.splice(index, 1); return true; });
}
export function senderIsPlayer(sender: string, player: BankPlayer): boolean {
 return words(sender).length === words(`${player.first_name} ${player.last_name}`).length && containsName(sender, player);
}
export function matchTransaction(tx: BankTransaction, players: BankPlayer[], aliases: PayerAlias[]): { playerId: string; confidence: Confidence } {
 const active = players.filter(p => p.is_active);
 const full = active.filter(p => containsName(tx.purpose, p));
 if (full.length === 1) return { playerId: full[0].id, confidence: 'high' };
 if (full.length > 1) return { playerId: '', confidence: 'unmatched' };
 const alias = aliases.find(a => normalizeName(a.payer_name) === normalizeName(tx.sender) && active.some(p => p.id === a.player_id));
 if (alias) return { playerId: alias.player_id, confidence: 'high' };
 const sender = words(tx.sender);
 const surnames = active.filter(p => { const surname = words(p.last_name); return surname.length > 0 && surname.every(word => sender.includes(word)); });
 if (surnames.length === 1) return { playerId: surnames[0].id, confidence: 'medium' };
 return { playerId: '', confidence: 'unmatched' };
}
export function canonicalTransaction(date: string, amount: number, sender: string, purpose: string, bankId?: string): string {
 return bankId?.trim() ? `tbc:id:${bankId.trim()}` : JSON.stringify(['tbc', date, Math.round(amount * 100), normalizeName(sender), normalizeName(purpose)]);
}
const cents = (value: number) => Math.round(value * 100);
export function allocateTransaction(amount: number, playerId: string, players: BankPlayer[], payments: BankPayment[], targetMonth = ''): AllocationPreview {
 const player = players.find(p => p.id === playerId);
 if (!player) return { allocations: [], leftover: amount };
 const members = players.filter(p => p.id === playerId || (player.family_id && p.family_id === player.family_id)).sort((a,b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
 const memberOrder = new Map(members.map((p,i) => [p.id, i]));
 const eligible = payments.filter(p => memberOrder.has(p.player_id) && remainingOf(p) > 0 && (!targetMonth || `${p.year}-${String(p.month).padStart(2,'0')}` >= targetMonth))
  .sort((a,b) => a.year - b.year || a.month - b.month || (memberOrder.get(a.player_id) ?? 0) - (memberOrder.get(b.player_id) ?? 0) || a.id.localeCompare(b.id));
 let left = cents(amount);
 const allocations: Allocation[] = [];
 for (const payment of eligible) {
  if (left <= 0) break;
  const applied = Math.min(left, cents(remainingOf(payment)));
  const expected = cents(paidOf(payment));
  allocations.push({ paymentId: payment.id, playerId: payment.player_id, month: payment.month, year: payment.year, amount: applied / 100, expectedPaid: expected / 100, resultingPaid: (expected + applied) / 100, fullyPaid: expected + applied >= cents(Number(payment.amount)) });
  left -= applied;
 }
 return { allocations, leftover: Math.max(0,left) / 100 };
}
export function previewBatch(rows: ReviewTransaction[], players: BankPlayer[], payments: BankPayment[]): Map<string, AllocationPreview> {
 const working = payments.map(p => ({ ...p }));
 const previews = new Map<string, AllocationPreview>();
 for (const row of rows) {
  if (row.duplicate && previews.has(row.key)) continue;
  const preview = row.skip || row.duplicate ? { allocations: [], leftover: row.amount } : allocateTransaction(row.amount, row.playerId, players, working, row.targetMonth);
  previews.set(row.key, preview);
  if (!row.confirmed || !row.playerId) continue;
  for (const part of preview.allocations) {
   const payment = working.find(p => p.id === part.paymentId);
   if (payment) { payment.paid_amount = part.resultingPaid; if (part.fullyPaid) payment.status = 'paid'; }
  }
 }
 return previews;
}

export type ColumnMapping = { date: number; amount: number; sender: number; purpose: number; id: number; debit: number; direction: number };
export const EMPTY_MAPPING: ColumnMapping = { date:-1, amount:-1, sender:-1, purpose:-1, id:-1, debit:-1, direction:-1 };
const HEADERS: Record<keyof ColumnMapping, string[]> = {
 date: ['date','transaction date','value date','თარიღი','ოპერაციის თარიღი'],
 amount: ['paid in','credit','credit amount','credited amount','incoming amount','შემოსული თანხა','ჩარიცხვა','კრედიტი','შემოსავალი','amount','თანხა'],
 sender: ['sender','sender name','partner','partner name',"partner's name",'გამგზავნი','პარტნიორი','პარტნიორის დასახელება','გამგზავნის სახელი'],
 purpose: ['purpose','description','additional information','დანიშნულება','დამატებითი ინფორმაცია','აღწერა'],
 id: ['transaction id','document id','document number','document no','reference','ოპერაციის ნომერი','დოკუმენტის ნომერი','დოკუმენტი'],
 debit: ['paid out','debit','debit amount','outgoing amount','გასული თანხა','გასავალი','დებეტი'],
 direction: ['direction','type','transaction type','ოპერაციის ტიპი','მიმართულება'],
};
const headerText = (value: unknown) => String(value ?? '').toLowerCase().replace(/[’']/g,'').replace(/[\s_\-:]+/g,' ').trim();
export function detectColumns(grid: unknown[][]): { headerRow: number; mapping: ColumnMapping; confident: boolean } {
 let best = { headerRow: 0, mapping: { ...EMPTY_MAPPING }, confident: false }; let bestScore = 0;
 grid.slice(0,40).forEach((row,headerRow) => {
  const mapping = { ...EMPTY_MAPPING };
  (Object.keys(HEADERS) as (keyof ColumnMapping)[]).forEach(field => {
   const aliases = HEADERS[field].map(headerText);
   for (const alias of aliases) { const index = row.findIndex(value => headerText(value) === alias); if (index >= 0) { mapping[field] = index; break; } }
   if (mapping[field] < 0) mapping[field] = row.findIndex(value => { const text = headerText(value); return text.length > 2 && aliases.some(alias => alias.length > 5 && text.startsWith(alias + ' (')); });
  });
  const score = Object.values(mapping).filter(v => v >= 0).length;
  const signedOnly = ['amount','თანხა'].includes(headerText(row[mapping.amount])) && mapping.debit < 0 && mapping.direction < 0;
  if (score > bestScore) { bestScore = score; best = { headerRow, mapping, confident: mapping.date >= 0 && mapping.amount >= 0 && mapping.sender >= 0 && !signedOnly }; }
 });
 return best;
}
export function parseBankAmount(value: unknown): number {
 if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
 let text = String(value ?? '').trim().replace(/[\s\u00a0₾$€]/g,'');
 const negative = /^\(.*\)$/.test(text); text = text.replace(/[()]/g,'');
 if (text.includes(',') && text.includes('.')) text = text.lastIndexOf(',') > text.lastIndexOf('.') ? text.replace(/\./g,'').replace(',','.') : text.replace(/,/g,'');
 else if (text.includes(',')) text = /,\d{1,2}$/.test(text) ? text.replace(',','.') : text.replace(/,/g,'');
 const number = Number(text); return Number.isFinite(number) ? number * (negative ? -1 : 1) : 0;
}
export function parseBankDate(value: unknown): string | null {
 let year = 0, month = 0, day = 0;
 if (value instanceof Date && !Number.isNaN(value.getTime())) { year = value.getFullYear(); month = value.getMonth()+1; day = value.getDate(); }
 else if (typeof value === 'number' && value > 1 && value < 100000) { const date = new Date(Date.UTC(1899,11,30) + Math.floor(value)*86400000); year = date.getUTCFullYear(); month = date.getUTCMonth()+1; day = date.getUTCDate(); }
 else {
  const text = String(value ?? '').trim();
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s|T|$)/);
  const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s|$)/);
  if (iso) [,year,month,day] = iso.map(Number);
  else if (dmy) { day = Number(dmy[1]); month = Number(dmy[2]); year = Number(dmy[3]); }
 }
 const date = new Date(year,month-1,day);
 return year >= 1900 && year <= 2200 && date.getFullYear() === year && date.getMonth()+1 === month && date.getDate() === day ? `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` : null;
}
export function parseMappedRows(grid: unknown[][], headerRow: number, mapping: ColumnMapping): { transactions: (Omit<BankTransaction,'key'> & { identity: string })[]; ignored: number; invalid: number } {
 const transactions: (Omit<BankTransaction,'key'> & { identity: string })[] = []; let ignored = 0, invalid = 0;
 for (const row of grid.slice(headerRow+1)) {
  if (!row.some(v => String(v ?? '').trim())) continue;
  const amount = parseBankAmount(row[mapping.amount]);
  const sender = String(row[mapping.sender] ?? '').trim();
  const purpose = String(row[mapping.purpose] ?? '').trim();
  const direction = String(row[mapping.direction] ?? '').toLowerCase();
  const meta = `${sender} ${purpose}`.toLowerCase();
  if (amount <= 0 || (mapping.debit >= 0 && parseBankAmount(row[mapping.debit]) > 0) || /debit|outgoing|paid out|გასავალი|ჩამოჭრა|fee|commission|საკომისიო/.test(direction) || /^(opening balance|closing balance|balance|total|ნაშთი|საწყისი ნაშთი|საბოლოო ნაშთი|ჯამი)(?:\s|$)/i.test(meta.trim()) || /^(fee|commission|საკომისიო)(?:\s|$)/i.test(purpose.trim())) { ignored++; continue; }
  const date = parseBankDate(row[mapping.date]);
  if (!date) { invalid++; continue; }
  const rounded = Math.round(amount*100)/100;
  transactions.push({ date, amount: rounded, sender, purpose, identity: canonicalTransaction(date, rounded, sender, purpose, mapping.id >= 0 ? String(row[mapping.id] ?? '') : undefined) });
 }
 return { transactions, ignored, invalid };
}
