import {
  detectColumns,
  parseMappedRows,
  type ColumnMapping,
  type BankTransaction,
} from "./bank-import";
export async function readBankFile(file: File) {
  if (file.size > 20 * 1024 * 1024) throw new Error("BANK_FILE_TOO_LARGE");
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error("BANK_FILE_INVALID");
  const XLSX = await import("@e965/xlsx");
  const book = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
    codepage: 65001,
  });
  const sheets = book.SheetNames.map((name) => ({
    name,
    grid: XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[name], {
      header: 1,
      defval: "",
      raw: true,
    }),
    detection: undefined as ReturnType<typeof detectColumns> | undefined,
  }));
  for (const sheet of sheets) sheet.detection = detectColumns(sheet.grid);
  return sheets;
}
export async function transactionsFromGrid(
  grid: unknown[][],
  headerRow: number,
  mapping: ColumnMapping,
) {
  const parsed = parseMappedRows(grid, headerRow, mapping);
  const transactions: BankTransaction[] = [];
  for (const tx of parsed.transactions) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(tx.identity));
    const key =
      "tbc:" + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    transactions.push({
      key,
      date: tx.date,
      amount: tx.amount,
      sender: tx.sender,
      purpose: tx.purpose,
    });
  }
  return { transactions, ignored: parsed.ignored, invalid: parsed.invalid };
}
