import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, FileUp, History, LoaderCircle, Trash2, Undo2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { sendEventSms } from "@/lib/notifications";
import {
  detectColumns,
  EMPTY_MAPPING,
  isAlreadyRecorded,
  monthChanges,
  rowHandled,
  rowIncluded,
  matchTransaction,
  normalizeName,
  previewBatch,
  senderIsPlayer,
  type BankPlayer,
  type BankPayment,
  type ColumnMapping,
  type PayerAlias,
  type ReviewTransaction,
} from "@/lib/bank-import";
import {
  applyBankImport,
  deletePayerAlias,
  loadBankImportData,
  loadBankBalances,
  loadImportHistory,
  undoBankImport,
  type ImportBatch,
  type ImportResult,
} from "@/lib/bank-import-client";
import { readBankFile, transactionsFromGrid } from "@/lib/bank-import-file";
import type { TranslationKey } from "@/lib/i18n/translations";

function PlayerPicker({
  players,
  value,
  onChange,
  disabled,
}: {
  players: BankPlayer[];
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const player = players.find((p) => p.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          className="w-full justify-start whitespace-normal text-left h-auto min-h-9"
        >
          {player ? `${player.first_name} ${player.last_name}` : t("bankUnmatched")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder={t("playerSearch")} />
          <CommandList>
            <CommandEmpty>{t("bankUnmatched")}</CommandEmpty>
            {players
              .filter((p) => p.is_active)
              .map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.first_name} ${p.last_name} ${normalizeName(`${p.first_name} ${p.last_name}`)} ${p.id}`}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 size-4 ${value === p.id ? "opacity-100" : "opacity-0"}`}
                  />
                  {p.first_name} {p.last_name}
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function BankImportDialog({
  open,
  onOpenChange,
  sport,
  sportName,
  clubName,
  players,
  payments,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sport: string;
  sportName: string;
  clubName: string;
  players: BankPlayer[];
  payments: BankPayment[];
  onRefresh: () => Promise<void>;
}) {
  const { t, monthLong, language } = useI18n();
  const { user } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [sheets, setSheets] = useState<Awaited<ReturnType<typeof readBankFile>>>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [headerRow, setHeaderRow] = useState(0);
  const [mapping, setMapping] = useState<ColumnMapping>({ ...EMPTY_MAPPING });
  const [rows, setRows] = useState<ReviewTransaction[]>([]);
  const [aliases, setAliases] = useState<PayerAlias[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");
  const [filter, setFilter] = useState("all");
  const [showPayers, setShowPayers] = useState(false);
  const [sms, setSms] = useState(false);
  const [ignored, setIgnored] = useState(0);
  const [invalid, setInvalid] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [doneLeftover, setDoneLeftover] = useState(0);
  const [balances, setBalances] = useState<BankPayment[]>(payments);
  const previews = useMemo(() => previewBatch(rows, players, balances), [rows, players, balances]);
  const [history, setHistory] = useState<ImportBatch[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [undoTarget, setUndoTarget] = useState<ImportBatch | null>(null);
  const open_ = (r: ReviewTransaction) => !r.skip && !r.duplicate && !r.futureDate;
  const group = (r: ReviewTransaction) => {
    if (r.duplicate) return "duplicate";
    if (r.futureDate) return "futureDate";
    if (r.skip) return "skipped";
    if (r.recorded && !r.include) return "recorded";
    if (!r.playerId) return "unmatched";
    if (!r.confirmed || (previews.get(r.key)?.futureMonth && !r.include)) return "check";
    return "matched";
  };
  const counts = {
    matched: rows.filter((r) => group(r) === "matched").length,
    check: rows.filter((r) => group(r) === "check").length,
    unmatched: rows.filter((r) => group(r) === "unmatched").length,
    recorded: rows.filter((r) => group(r) === "recorded").length,
  };
  const ready = rows.filter((r) => rowIncluded(r, previews.get(r.key)));
  const handledRows = rows.filter(rowHandled);
  const changes = useMemo(() => monthChanges(rows, previews), [rows, previews]);
  const period = rows.length ? `${rows[0].date} – ${rows[rows.length - 1].date}` : "";
  const futureCount = rows.filter((r) => r.futureDate).length;
  async function refreshHistory() {
    try { setHistory(await loadImportHistory(sport)); } catch { /* history is optional */ }
  }
  const total = ready.reduce(
    (sum, row) => sum + (previews.get(row.key)?.allocations.reduce((n, p) => n + p.amount, 0) ?? 0),
    0,
  );
  const sheet = sheets[sheetIndex];
  const money = (amount: number) => `${amount.toFixed(2)} GEL`;
  useEffect(() => {
    if (!open) { setSheets([]); setRows([]); return; }
    setStep("upload");
    setSheets([]);
    setRows([]);
    setFilename("");
    setError("");
    setResult(null);
    setSms(false);
    setFilter("all");
    setBusy(false);
    setShowPayers(false);
    setShowHistory(false);
    void refreshHistory();
    let active = true;
    loadBankImportData(sport, [])
      .then((data) => {
        if (active) setAliases(data.aliases);
      })
      .catch(() => {
        if (active) setError(t("bankApplyError"));
      });
    return () => {
      active = false;
    };
  }, [open, sport]);
  function selectSheet(index: number) {
    setSheetIndex(index);
    const detection = sheets[index]?.detection;
    if (detection) {
      setHeaderRow(detection.headerRow);
      setMapping(detection.mapping);
    }
  }
  async function review(grid: unknown[][], header: number, columns: ColumnMapping) {
    setBusy(true);
    setError("");
    try {
      const parsed = await transactionsFromGrid(grid, header, columns);
      setIgnored(parsed.ignored);
      setInvalid(parsed.invalid);
      if (!parsed.transactions.length) {
        setError(t("bankNoIncoming"));
        return;
      }
      if (parsed.transactions.length > 2000) {
        setError(t("bankFileError"));
        return;
      }
      const [data, freshBalances] = await Promise.all([
        loadBankImportData(sport, parsed.transactions.map((tx) => tx.key)),
        loadBankBalances(sport),
      ]);
      setBalances(freshBalances);
      setAliases(data.aliases);
      const seen = new Set<string>();
      const today = new Date().toLocaleDateString("sv-SE");
      setRows(
        parsed.transactions
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((tx) => {
            const match = matchTransaction(tx, players, data.aliases);
            const duplicate = data.imported.has(tx.key) || seen.has(tx.key);
            seen.add(tx.key);
            const recorded =
              !!match.playerId && isAlreadyRecorded(tx, match.playerId, players, freshBalances);
            return {
              ...tx,
              ...match,
              confirmed: match.confidence === "high",
              remember: false,
              skip: false,
              duplicate,
              targetMonth: "",
              recorded,
              include: false,
              handled: recorded,
              futureDate: tx.date > today,
            };
          }),
      );
      setStep("review");
    } catch {
      setError(t("bankFileError"));
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    setBusy(true);
    setError("");
    setFilename(file.name);
    try {
      const read = await readBankFile(file);
      setSheets(read);
      const index = Math.max(
        0,
        read.findIndex((s) => s.detection?.confident),
      );
      setSheetIndex(index);
      const selected = read[index];
      if (!selected) {
        setError(t("bankFileError"));
        return;
      }
      const detection = selected.detection ?? detectColumns(selected.grid);
      setHeaderRow(detection.headerRow);
      setMapping(detection.mapping);
      // Multiple sheets require an explicit choice; ambiguous files always use mapping.
      if (detection.confident && read.length === 1)
        await review(selected.grid, detection.headerRow, detection.mapping);
    } catch (e) {
      setError(
        t(
          e instanceof Error && e.message === "BANK_FILE_TOO_LARGE"
            ? "bankTooLarge"
            : "bankFileError",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  function changeRow(key: string, changes: Partial<ReviewTransaction>) {
    setRows((old) => old.map((r) => (r.key === key ? { ...r, ...changes } : r)));
  }
  function pickPlayer(row: ReviewTransaction, id: string) {
    const player = players.find((p) => p.id === id);
    changeRow(row.key, {
      playerId: id,
      confidence: "high",
      confirmed: true,
      skip: false,
      remember: !!row.sender && !!player && !senderIsPlayer(row.sender, player),
      recorded: !!id && isAlreadyRecorded(row, id, players, balances),
      include: false,
      handled: !!id && isAlreadyRecorded(row, id, players, balances),
    });
  }
  async function undo(batch: ImportBatch) {
    setBusy(true);
    setError("");
    try {
      await undoBankImport(batch.batchId);
      await onRefresh();
      await refreshHistory();
      setUndoTarget(null);
    } catch (e) {
      const changed = String((e as { message?: string })?.message ?? "").includes("BANK_UNDO_CHANGED");
      setError(t(changed ? "bankUndoChanged" : "bankApplyError"));
      setUndoTarget(null);
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    if ((!ready.length && !handledRows.length) || busy) return;
    setBusy(true);
    setError("");
    try {
      const applied = await applyBankImport(
        sport,
        [
          ...ready.map((row) => ({
            ...row,
            handled: false,
            payerName: normalizeName(row.sender),
            allocations: previews.get(row.key)?.allocations ?? [],
          })),
          ...handledRows.map((row) => ({
            ...row,
            handled: true,
            payerName: normalizeName(row.sender),
            allocations: [],
          })),
        ],
      );
      setDoneLeftover(
        ready
          .filter((row) => applied.applied.includes(row.key))
          .reduce((sum, row) => sum + (previews.get(row.key)?.leftover ?? 0), 0),
      );
      setResult(applied);
      setStep("done");
      void refreshHistory();
      if (sms && user)
        for (const confirmation of applied.confirmations)
          void sendEventSms({
            userId: user.id,
            playerId: confirmation.playerId,
            paymentId: confirmation.paymentId,
            kind: "payment_paid",
            clubName,
            sportName,
            lang: language,
          });
      await onRefresh();
      try { const fresh = await loadBankImportData(sport, []); setAliases(fresh.aliases); } catch { /* Applied transfers remain committed. */ }
    } catch (e) {
      const message = String((e as { message?: string })?.message ?? "");
      setError(
        t(
          message.includes("BANK_IMPORT_STALE")
            ? "bankStale"
            : message.includes("BANK_IMPORT_FUTURE_DATE")
              ? "bankFutureDate"
              : "bankApplyError",
        ),
      );
      try {
        await onRefresh();
        const [data, freshBalances] = await Promise.all([
          loadBankImportData(sport, rows.map((r) => r.key)), loadBankBalances(sport),
        ]);
        setBalances(freshBalances);
        setRows((old) => old.map((r) => ({ ...r, duplicate: r.duplicate || data.imported.has(r.key) })));
      } catch { /* Preserve the failed review for a retry. */ }
    } finally {
      setBusy(false);
    }
  }
  const visible = rows.filter((r) => filter === "all" || group(r) === filter);
  const columns: [keyof ColumnMapping, TranslationKey][] = [
    ["date", "bankDate"],
    ["amount", "bankImportAmount"],
    ["sender", "bankSender"],
    ["purpose", "bankPurpose"],
    ["id", "bankId"],
    ["debit", "bankDebit"],
    ["direction", "bankDirection"],
  ];
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value);
      }}
    >
      <DialogContent
        className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-3 overflow-hidden rounded-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:inset-0 max-sm:translate-x-0 max-sm:translate-y-0 sm:h-[90dvh] sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-6xl sm:rounded-lg sm:p-6"
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 pr-7">
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="size-5 text-primary" />
            {t("bankImport")}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" ? t("bankFilePrivacy") : filename}
          </DialogDescription>
        </DialogHeader>
        <ol className="flex shrink-0 items-center gap-3 border-b border-border pb-3 text-sm">
          {(["upload", "review", "done"] as const).map((s, i) => (
            <li
              key={s}
              className={step === s ? "font-semibold text-primary" : "text-muted-foreground"}
            >
              {i + 1}.{" "}
              {t(s === "upload" ? "bankUpload" : s === "review" ? "bankReview" : "bankDone")}
            </li>
          ))}
        </ol>
        {error && (
          <p
            role="alert"
            className="shrink-0 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === "upload" && (
            <div className="space-y-5">
              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-6 text-center">
                <FileUp className="size-8 text-primary" />
                <Button type="button" variant="outline" disabled={busy} className="h-auto max-w-full whitespace-normal text-center" onClick={() => fileInput.current?.click()}>{t("bankChooseFile")}</Button>
                <Input
                  aria-label={t("bankChooseFile")}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  disabled={busy}
                    ref={fileInput}
                    className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file);
                  }}
                />
              </label>
              {sheet && (
                <div className="space-y-4">
                  <h3 className="font-semibold">{t("bankMapping")}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      {t("bankSheet")}
                      <Select
                        value={String(sheetIndex)}
                        onValueChange={(v) => selectSheet(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sheets.map((s, i) => (
                            <SelectItem value={String(i)} key={i}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="space-y-1 text-sm">
                      {t("bankHeaderRow")}
                      <Input
                        type="number"
                        min={1}
                        max={sheet.grid.length}
                        value={headerRow + 1}
                        onChange={(e) => {
                          const row = Math.max(0, Number(e.target.value) - 1);
                          setHeaderRow(row);
                          setMapping(detectColumns([sheet.grid[row] ?? []]).mapping);
                        }}
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {columns.map(([field, label]) => (
                      <label key={field} className="space-y-1 text-sm">
                        {t(label)}
                        <Select
                          value={String(mapping[field])}
                          onValueChange={(v) => setMapping((m) => ({ ...m, [field]: Number(v) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="-1">{t("bankNoColumn")}</SelectItem>
                            {Array.from(
                              {
                                length: Math.max(
                                  ...sheet.grid
                                    .slice(headerRow, headerRow + 6)
                                    .map((r) => r.length),
                                ),
                              },
                              (_, i) => (
                                <SelectItem key={i} value={String(i)}>
                                  {i + 1}: {String(sheet.grid[headerRow]?.[i] ?? "").slice(0, 70)}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </label>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {sheet.grid.slice(headerRow, headerRow + 6).map((row, i) => (
                          <tr key={i} className="border-b border-border">
                            {row.map((cell, j) => (
                              <td key={j} className="max-w-52 truncate p-2">
                                {String(cell ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    disabled={
                      busy ||
                      mapping.date < 0 ||
                      mapping.amount < 0 ||
                      mapping.sender < 0 ||
                      new Set([
                        mapping.date,
                        mapping.amount,
                        mapping.sender,
                        ...(mapping.purpose >= 0 ? [mapping.purpose] : []),
                      ]).size !==
                        3 + (mapping.purpose >= 0 ? 1 : 0)
                    }
                    onClick={() => void review(sheet.grid, headerRow, mapping)}
                  >
                    {t("bankReview")}
                  </Button>
                </div>
              )}
            </div>
          )}
          {step === "review" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-3 text-sm">
                <span className="w-full font-medium">
                  {t("bankPeriod")}: <strong>{period}</strong> · {t("bankIncomingCount")}:{" "}
                  <strong>{rows.length}</strong>
                </span>
                <span className="text-success">
                  {t("bankMatched")}: {counts.matched}
                </span>
                <span className="text-warning">
                  {t("bankNeedsCheck")}: {counts.check}
                </span>
                <span>
                  {t("bankUnmatched")}: {counts.unmatched}
                </span>
                <span className="text-muted-foreground">
                  {t("bankAlreadyRecorded")}: {counts.recorded}
                </span>
              </div>
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  <span>
                    {t("bankWillApply")}: <strong>{ready.length}</strong>
                  </span>
                  <span className="font-semibold">
                    {t("bankAppliedAmount")}: {money(total)}
                  </span>
                  {handledRows.length > 0 && (
                    <span>
                      {t("bankHandledCount")}: {handledRows.length}
                    </span>
                  )}
                </div>
                {changes.length > 0 && (
                  <p className="mt-1 text-xs">
                    {t("bankMonthsChanged")}:{" "}
                    {changes
                      .map((c) => `${monthLong(Number(c.month.slice(5)))} ${c.month.slice(0, 4)} — ${c.count}`)
                      .join(" · ")}
                  </p>
                )}
                {futureCount > 0 && (
                  <p className="mt-1 text-xs text-destructive">
                    {t("bankFutureDate")} ({futureCount})
                  </p>
                )}
              </div>
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="flex h-auto flex-wrap justify-start">
                  {[
                    ["all", "bankAll"],
                    ["matched", "bankMatched"],
                    ["check", "bankNeedsCheck"],
                    ["unmatched", "bankUnmatched"],
                    ["recorded", "bankAlreadyRecorded"],
                  ].map(([value, key]) => (
                    <TabsTrigger key={value} value={value}>
                      {t(key as TranslationKey)}
                      {value === "recorded" ? ` (${counts.recorded})` : ""}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              {(ignored > 0 || invalid > 0) && (
                <p className="text-xs text-muted-foreground">
                  {t("bankIgnored", { count: ignored })} ·{" "}
                  {t("bankInvalidRows", { count: invalid })}
                </p>
              )}
              {visible.map((row, index) => {
                const preview = previews.get(row.key);
                const player = players.find((p) => p.id === row.playerId);
                const familyPayments = player
                  ? balances.filter((p) =>
                      players.some(
                        (member) =>
                          (member.id === player.id ||
                            (player.family_id && member.family_id === player.family_id)) &&
                          member.id === p.player_id,
                      ),
                    )
                  : [];
                const months = [
                  ...new Set(
                    familyPayments.map((p) => `${p.year}-${String(p.month).padStart(2, "0")}`),
                  ),
                ].sort();
                return (
                  <article
                    data-bank-row
                    key={`${row.key}-${index}`}
                    className={`rounded-lg border border-border p-3 ${row.duplicate || row.futureDate ? "bg-muted/40 opacity-50" : row.skip || (row.recorded && !row.include) ? "opacity-60" : "bg-card"}`}
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="min-w-0 space-y-1">
                        <div className="flex justify-between gap-3">
                          <time className="text-sm">{row.date}</time>
                          <strong className="text-success">{money(row.amount)}</strong>
                        </div>
                        <p className="break-words text-sm font-semibold">{row.sender || "—"}</p>
                        <p className="break-words text-xs text-muted-foreground">
                          {row.purpose || "—"}
                        </p>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <PlayerPicker
                          players={players}
                          value={row.playerId}
                          disabled={busy || row.duplicate}
                          onChange={(id) => pickPlayer(row, id)}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs ${row.duplicate ? "text-muted-foreground" : row.confirmed ? "text-success" : row.confidence === "medium" ? "text-warning" : "text-muted-foreground"}`}
                          >
                            {t(
                              row.duplicate
                                ? "bankAlreadyImported"
                                : row.confirmed
                                  ? row.confidence === "medium"
                                    ? "bankConfirmed"
                                    : "bankHigh"
                                  : row.confidence === "medium"
                                    ? "bankCheck"
                                    : "bankUnmatched",
                            )}
                          </span>
                          {row.recorded && !row.duplicate && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                              {t("bankAlreadyRecorded")}
                            </span>
                          )}
                          {row.futureDate && (
                            <span className="text-xs text-destructive">{t("bankFutureDate")}</span>
                          )}
                          {row.playerId && !row.confirmed && !row.duplicate && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                changeRow(row.key, {
                                  confirmed: true,
                                  remember:
                                    !!row.sender && !!player && !senderIsPlayer(row.sender, player),
                                })
                              }
                            >
                              <Check className="size-3" />
                              {t("bankConfirmMatch")}
                            </Button>
                          )}
                          <label className="flex items-center gap-1 text-xs">
                            <Checkbox
                              disabled={busy || row.duplicate}
                              checked={row.skip}
                              onCheckedChange={(v) => changeRow(row.key, { skip: !!v })}
                            />
                            {t("skip")}
                          </label>
                        </div>
                        {row.playerId && !!row.sender && !row.duplicate && (
                          <label className="flex items-center gap-2 text-xs">
                            <Checkbox
                              disabled={busy || row.skip}
                              checked={row.remember}
                              onCheckedChange={(v) => changeRow(row.key, { remember: !!v })}
                            />
                            {t("bankRemember")}
                          </label>
                        )}
                        {open_(row) && row.playerId && (row.recorded || preview?.futureMonth) && (
                          <label className="flex items-center gap-2 text-xs">
                            <Checkbox
                              disabled={busy}
                              checked={row.include}
                              onCheckedChange={(v) => changeRow(row.key, { include: !!v })}
                            />
                            {t("bankIncludeAnyway")}
                          </label>
                        )}
                        {open_(row) && row.playerId && row.recorded && !row.include && (
                          <label className="flex items-center gap-2 text-xs">
                            <Checkbox
                              disabled={busy}
                              checked={row.handled}
                              onCheckedChange={(v) => changeRow(row.key, { handled: !!v })}
                            />
                            {t("bankMarkHandled")}
                          </label>
                        )}
                      </div>
                      <div className="min-w-0 space-y-2">
                        {!row.duplicate && (
                          <>
                            <Select
                              disabled={busy || !row.playerId || row.skip}
                              value={row.targetMonth || "oldest"}
                              onValueChange={(v) =>
                                changeRow(row.key, { targetMonth: v === "oldest" ? "" : v })
                              }
                            >
                              <SelectTrigger aria-label={t("bankTargetMonth")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="oldest">{t("bankOldest")}</SelectItem>
                                {months.map((month) => (
                                  <SelectItem key={month} value={month}>
                                    {monthLong(Number(month.slice(5)))} {month.slice(0, 4)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <ul className="space-y-1 text-xs">
                              {preview?.allocations.map((part) => {
                                const member = players.find((p) => p.id === part.playerId);
                                return (
                                  <li key={part.paymentId} className="break-words">
                                    {familyPayments.some((p) => p.player_id !== row.playerId)
                                      ? `${member?.first_name ?? ""} · `
                                      : ""}
                                    {monthLong(part.month)} {part.year}: +{money(part.amount)}{" "}
                                    <span
                                      className={part.fullyPaid ? "text-success" : "text-warning"}
                                    >
                                      {t(part.fullyPaid ? "paid" : "playerPartial")}
                                    </span>
                                    {!part.fullyPaid &&
                                      ` · ${t("bankRemaining")}: ${money(Math.max(0, Number(balances.find((p) => p.id === part.paymentId)?.amount ?? 0) - part.resultingPaid))}`}
                                  </li>
                                );
                              })}
                            </ul>
                            {preview?.futureMonth && (
                              <p className="flex items-center gap-1 text-xs font-medium text-warning">
                                <AlertTriangle className="size-3" />
                                {t("bankFutureMonth")}
                              </p>
                            )}
                            {(preview?.leftover ?? 0) > 0 && (
                              <p className="text-xs text-warning">
                                {t("bankUnallocated")}: {money(preview?.leftover ?? 0)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {step === "done" && result && (
            <div className="space-y-5 py-6">
              <Check className="mx-auto size-14 text-success" />
              <h3 className="text-center text-xl font-semibold">{t("bankResult")}</h3>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ["bankApplied", result.applied.length],
                  ["bankSkipped", rows.length - result.applied.length - result.duplicates.length],
                  [
                    "bankDuplicateCount",
                    result.duplicates.length + rows.filter((r) => r.duplicate).length,
                  ],
                  ["bankUnallocated", money(doneLeftover)],
                ].map(([key, value]) => (
                  <div key={key} className="border-b border-border p-3">
                    <dt className="text-sm text-muted-foreground">{t(key as TranslationKey)}</dt>
                    <dd className="mt-2 text-xl font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="mt-5 border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowHistory((v) => !v)}>
              <History className="size-4" />
              {t("bankHistory")} ({history.length})
            </Button>
            {showHistory && (
              <div className="mb-3 mt-3 space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("bankNoHistory")}</p>
                ) : (
                  history.map((batch) => (
                    <div
                      key={batch.batchId}
                      className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-2 text-sm"
                    >
                      <span>
                        {new Date(batch.createdAt).toLocaleString()} · {t("bankTransactions")}:{" "}
                        {batch.count} · {money(batch.total)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setUndoTarget(batch)}
                      >
                        <Undo2 className="size-4" />
                        {t("bankUndo")}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowPayers((v) => !v)}>
              <Users className="size-4" />
              {t("bankSavedPayers")} ({aliases.length})
            </Button>
            {showPayers && (
              <div className="mt-3 space-y-2">
                {aliases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("bankNoPayers")}</p>
                ) : (
                  aliases.map((alias) => {
                    const player = players.find((p) => p.id === alias.player_id);
                    return (
                      <div
                        key={alias.id}
                        className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm"
                      >
                        <span className="min-w-0 break-words">
                          {alias.payer_name} → {player?.first_name} {player?.last_name}
                        </span>
                        <Button
                          disabled={busy}
                          variant="ghost"
                          size="icon"
                          title={t("delete")}
                          aria-label={t("delete")}
                          onClick={async () => {
                            try {
                              await deletePayerAlias(alias.id);
                              setAliases((old) => old.filter((a) => a.id !== alias.id));
                            } catch {
                              setError(t("bankApplyError"));
                            }
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          {busy && <LoaderCircle className="size-5 animate-spin text-primary" />}
          {step === "review" ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={sms} disabled={busy} onCheckedChange={(v) => setSms(!!v)} />
                {t("bankSendSms")}
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setStep("upload");
                    setError("");
                  }}
                >
                  {t("back")}
                </Button>
                <Button disabled={busy || (!ready.length && !handledRows.length)} onClick={() => void apply()}>
                  {busy ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {t("bankApply")} ({ready.length})
                </Button>
              </div>
            </>
          ) : (
            <Button
              className="ml-auto"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              {t(step === "done" ? "finish" : "cancel")}
            </Button>
          )}
        </div>
      </DialogContent>
      <AlertDialog open={!!undoTarget} onOpenChange={(v) => !v && !busy && setUndoTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bankUndoTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {undoTarget &&
                t("bankUndoConfirm", { count: undoTarget.count, total: money(undoTarget.total) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                if (undoTarget) void undo(undoTarget);
              }}
            >
              {t("bankUndo")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
