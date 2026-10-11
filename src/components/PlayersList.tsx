import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, User, Archive, ArchiveRestore, ListChecks, Search, Filter, ChevronDown, Link as LinkIcon, ExternalLink, Check, Eye, FileText, FileUp, MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";
import type { SportConfig } from "@/lib/sports";
import { useI18n } from "@/hooks/use-i18n";
import { useSounds } from "@/hooks/use-sounds";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useAuth } from "@/hooks/use-auth";
import { usePlayerRegistrationLink } from "@/hooks/use-player-registration-link";
import { usePlayerRegistrationRequests, type PlayerRegistrationRequest } from "@/hooks/use-player-registration-requests";
import { sendEventSms } from "@/lib/notifications";
import { formatArrivalDateTime } from "@/lib/arrival-date";
import { getDialCodeForLanguage, prefillPhone } from "@/lib/phone-codes";
import { getRemainingSeasonMonths, getSeasonRegistrationDefaults, getSeasonYearForMonth } from "@/lib/season";
import { PhoneInput } from "@/components/PhoneInput";
import { summarizePlayerPayments, PLAYER_PAYMENT_FILTERS, type PlayerPaymentFilter } from "@/lib/dashboard-summary";
import { downloadAllDebtsPdf, downloadPlayerPaymentsPdf, downloadPlayersListPdf } from "@/lib/payment-pdf";

type Player = Database["public"]["Tables"]["players"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"] & { firstMonthPaid?: boolean; siblings?: { firstName: string; tNumber: number; birthDate: string }[]; family_id?: string | null };

type PlayerSort = "newest" | "lastName" | "age" | "debt";

function calcAge(birthDate: string): number {
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return Math.max(0, age);
}

interface PlayersListProps {
  players: Player[];
  payments?: Payment[];
  loading: boolean;
  sport: SportConfig;
  onAdd: (player: PlayerInsert) => Promise<{ error: unknown; created?: Player }>;
  onUpdate: (id: string, updates: Partial<Player>) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
  onSelect: (player: Player) => void;
  onApprovedRegistration?: () => void;
  selectedId?: string;
  paymentFilter: PlayerPaymentFilter;
  onPaymentFilterChange: (filter: PlayerPaymentFilter) => void;
  onImportBank: () => void;
}

function PlayerForm({ initial, sport, onSubmit, onCancel }: {
  initial?: Partial<Player>;
  sport: SportConfig;
  onSubmit: (data: PlayerInsert) => void;
  onCancel: () => void;
}) {
  const { t, monthShort, language } = useI18n();
  const dial = getDialCodeForLanguage(language);
  const isEdit = !!initial?.id;
  const now = new Date();
  const seasonDefaults = getSeasonRegistrationDefaults(now);
  const [firstName, setFirstName] = useState(initial?.first_name || "");
  const [lastName, setLastName] = useState(initial?.last_name || "");
  const [tNumber, setTNumber] = useState(initial?.t_number?.toString() || "");
  const initialBirth = initial?.birth_date || "";
  const [birthYear, setBirthYear] = useState(initialBirth ? initialBirth.slice(0, 4) : "");
  const [birthMonth, setBirthMonth] = useState(initialBirth ? String(Number(initialBirth.slice(5, 7))) : "");
  const [birthDay, setBirthDay] = useState(initialBirth ? String(Number(initialBirth.slice(8, 10))) : "");
  const birthDate = birthYear && birthMonth && birthDay
    ? `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
    : "";
  const birthYears = useMemo(() => {
    const yr = new Date().getFullYear();
    return Array.from({ length: 81 }, (_, i) => yr - i);
  }, []);
  const daysInBirthMonth = useMemo(() => {
    const m = Number(birthMonth);
    const y = Number(birthYear);
    if (!m) return 31;
    if (!y) return m === 2 ? 29 : [4, 6, 9, 11].includes(m) ? 30 : 31;
    return new Date(y, m, 0).getDate();
  }, [birthMonth, birthYear]);
  const selectClass = "flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:bg-background [&>option]:text-foreground";
  const [phone, setPhone] = useState(() => prefillPhone(initial?.phone, language));
  const [parentPhone, setParentPhone] = useState(() => prefillPhone(initial?.parent_phone, language));
  const [email, setEmail] = useState(initial?.email || "");
  const [primaryContact, setPrimaryContact] = useState<"player" | "parent">(
    (initial?.primary_contact as "player" | "parent") || "player"
  );
  const [emailPickerOpen, setEmailPickerOpen] = useState(false);

  // Subscription fields
  const [monthlyFee, setMonthlyFee] = useState(initial?.monthly_fee?.toString() || "170");
  const [months, setMonths] = useState((initial?.subscription_months || seasonDefaults.subscriptionMonths).toString());
  const [startMonth, setStartMonth] = useState((initial?.start_month || seasonDefaults.startMonth).toString());
  const [startDay, setStartDay] = useState("1");
  const [firstMonthPaid, setFirstMonthPaid] = useState(false);
  const [siblings, setSiblings] = useState<{ firstName: string; tNumber: string; birthYear: string; birthMonth: string; birthDay: string }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !tNumber.trim() || !birthDate) return;
    // If the user kept just the dial-code prefix, treat the field as empty.
    const cleanPhone = phone.trim();
    const cleanParent = parentPhone.trim();
    const isJustDial = (v: string) => v === dial.code || v.replace(/[\s-]/g, "") === dial.code;
    const base: PlayerInsert = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      t_number: parseInt(tNumber),
      birth_date: birthDate,
      phone: cleanPhone && !isJustDial(cleanPhone) ? cleanPhone : null,
      parent_phone: cleanParent && !isJustDial(cleanParent) ? cleanParent : null,
      email: email.trim() || null,
      primary_contact: primaryContact,
    };
    base.monthly_fee = parseFloat(monthlyFee) || 0;
    if (!isEdit) {
      base.subscription_months = parseInt(months);
      base.start_month = parseInt(startMonth);
      base.start_year = getSeasonYearForMonth(parseInt(startMonth), now);
      base.start_day = Math.min(Math.max(parseInt(startDay) || 1, 1), 28);
      base.firstMonthPaid = firstMonthPaid;
      const validSiblings = siblings.filter((s) => s.firstName.trim() && s.birthYear && s.birthMonth && s.birthDay);
      if (validSiblings.length) {
        base.siblings = validSiblings.map((s) => ({
          firstName: s.firstName.trim(),
          tNumber: parseInt(s.tNumber) || 0,
          birthDate: `${s.birthYear}-${s.birthMonth.padStart(2, "0")}-${s.birthDay.padStart(2, "0")}`,
        }));
      }
    }
    onSubmit(base);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t("firstName")} *</label>
          <div className="flex gap-2">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="flex-1" />
            {!isEdit && (
              <Button type="button" variant="outline" size="icon" className="shrink-0" title="+"
                onClick={() => setSiblings((s) => [...s, { firstName: "", tNumber: "", birthYear: "", birthMonth: "", birthDay: "" }])}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t("lastName")} *</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>
      {siblings.map((s, i) => (
        <div key={i} className="rounded-xl border border-primary/30 bg-primary/5 p-3 grid grid-cols-[1fr_90px_auto] gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("firstName")} ({i + 2})</label>
            <Input value={s.firstName} onChange={(e) => setSiblings((arr) => arr.map((x, j) => j === i ? { ...x, firstName: e.target.value } : x))} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{sport.numberLabel}</label>
            <Input type="number" min={0} max={999} value={s.tNumber} onChange={(e) => setSiblings((arr) => arr.map((x, j) => j === i ? { ...x, tNumber: e.target.value } : x))} />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setSiblings((arr) => arr.filter((_, j) => j !== i))}>
            <X className="w-4 h-4" />
          </Button>
          <div className="col-span-3">
            <label className="text-xs text-muted-foreground mb-1 block">{t("birthDate")} *</label>
            <div className="grid grid-cols-3 gap-2">
              <select value={s.birthDay} onChange={(e) => setSiblings((arr) => arr.map((x, j) => j === i ? { ...x, birthDay: e.target.value } : x))} required className={selectClass} aria-label={t("regDay")}>
                <option value="">{t("regDay")}</option>
                {Array.from({ length: (() => { const m = Number(s.birthMonth); const y = Number(s.birthYear); return m ? (y ? new Date(y, m, 0).getDate() : m === 2 ? 29 : [4, 6, 9, 11].includes(m) ? 30 : 31) : 31; })() }, (_, day) => day + 1).map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
              <select value={s.birthMonth} onChange={(e) => setSiblings((arr) => arr.map((x, j) => j === i ? { ...x, birthMonth: e.target.value } : x))} required className={selectClass} aria-label={t("regMonth")}>
                <option value="">{t("regMonth")}</option>
                {Array.from({ length: 12 }, (_, month) => month + 1).map((month) => <option key={month} value={month}>{monthShort(month)}</option>)}
              </select>
              <select value={s.birthYear} onChange={(e) => setSiblings((arr) => arr.map((x, j) => j === i ? { ...x, birthYear: e.target.value } : x))} required className={selectClass} aria-label={t("regYear")}>
                <option value="">{t("regYear")}</option>
                {birthYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{sport.numberLabel} *</label>
        <Input type="number" value={tNumber} onChange={(e) => setTNumber(e.target.value)} required min={0} max={999} />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("birthDate")} *</label>
        <div className="grid grid-cols-3 gap-2">
          <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} required className={selectClass} aria-label={t("regDay")}>
            <option value="">{t("regDay")}</option>
            {Array.from({ length: daysInBirthMonth }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} required className={selectClass} aria-label={t("regMonth")}>
            <option value="">{t("regMonth")}</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{monthShort(m)}</option>
            ))}
          </select>
          <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} required className={selectClass} aria-label={t("regYear")}>
            <option value="">{t("regYear")}</option>
            {birthYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("phone")}</label>
        <PhoneInput
          value={phone}
          onChange={setPhone}
          placeholder={dial.sample}
        />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("parentPhone")}</label>
        <PhoneInput
          value={parentPhone}
          onChange={setParentPhone}
          placeholder={dial.sample}
        />
      </div>
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">{t("email")}</label>
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="flex-1"
          />
          <Popover open={emailPickerOpen} onOpenChange={setEmailPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-1.5"
                title={t("chooseContactEmail")}
              >
                {primaryContact === "parent" ? t("contactParent") : t("contactPlayer")}
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <p className="text-xs text-muted-foreground px-2 py-1.5">{t("chooseContactEmailDesc")}</p>
              <button
                type="button"
                onClick={() => { setPrimaryContact("player"); setEmailPickerOpen(false); }}
                className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-muted ${primaryContact === "player" ? "bg-muted font-medium" : ""}`}
              >
                {t("contactPlayer")} <span className="text-xs text-muted-foreground">({t("primaryContact")})</span>
              </button>
              <button
                type="button"
                onClick={() => { setPrimaryContact("parent"); setEmailPickerOpen(false); }}
                className={`w-full text-left px-2 py-2 rounded-md text-sm hover:bg-muted ${primaryContact === "parent" ? "bg-muted font-medium" : ""}`}
              >
                {t("contactParent")}
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="text-sm font-semibold text-foreground">{t("subscription")}</div>
          <div className={isEdit ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("monthlyFee")} *</label>
              <Input type="number" step="0.01" min={0} value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder="50.00" required />
            </div>
            {!isEdit && (
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("durationMonths")} *</label>
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: seasonDefaults.subscriptionMonths }, (_, i) => {
                    const n = i + 1;
                    return (
                      <SelectItem key={n} value={n.toString()}>
                        {t(n === 1 ? "monthLabel" : "monthsLabel", { count: n })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            )}
          </div>
          {!isEdit && (
            <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("startMonth")}</label>
              <Select value={startMonth} onValueChange={(value) => setStartMonth(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{monthShort(i + 1)} {getSeasonYearForMonth(i + 1, now)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("startDay")}</label>
              <Select value={startDay} onValueChange={setStartDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <Checkbox checked={firstMonthPaid} onCheckedChange={(v) => setFirstMonthPaid(!!v)} />
            <span className="text-sm text-foreground">{t("firstMonthPaid")}</span>
          </label>
            </>
          )}
        </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">{isEdit ? t("saveChanges") : t("addMember", { member: sport.member })}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  );
}

export function PlayersList({ players, payments = [], loading, sport, onAdd, onUpdate, onDelete, onSelect, onApprovedRegistration, selectedId, paymentFilter, onPaymentFilterChange, onImportBank }: PlayersListProps) {
  const { t, language, monthShort, monthLong, formatMoney } = useI18n();
  const { play } = useSounds();
  const { schoolName } = useAppSettings();
  const { user } = useAuth();
  const registrationLink = usePlayerRegistrationLink(sport.id);
  const registrationRequests = usePlayerRegistrationRequests(sport.id, onApprovedRegistration);
  const [addOpen, setAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [viewRequest, setViewRequest] = useState<PlayerRegistrationRequest | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PlayerSort>("newest");
  const [birthYear, setBirthYear] = useState("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const paymentSummaries = useMemo(() => summarizePlayerPayments(players, payments, now), [players, payments, currentMonth, currentYear]);
  const birthYears = useMemo(() => [...new Set(players.map((p) => p.birth_date?.slice(0, 4)).filter((year): year is string => Boolean(year)))].sort().reverse(), [players]);
  const filteredPlayers = useMemo(() => {
    let result = players.filter((p) => paymentFilter === "archived" ? !p.is_active : p.is_active);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const digits = q.replace(/\D/g, "");
      result = result.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        p.t_number.toString().includes(q) ||
        [p.phone, p.parent_phone].some((phone) => phone && (phone.toLowerCase().includes(q) || (digits.length > 0 && phone.replace(/\D/g, "").includes(digits))))
      );
    }
    if (birthYear !== "all") result = result.filter((p) => p.birth_date?.slice(0, 4) === birthYear);
    if (paymentFilter !== "all" && paymentFilter !== "archived") result = result.filter((p) => {
      const summary = paymentSummaries.get(p.id);
      return paymentFilter === "overdue" ? (summary?.overdueMonths ?? 0) > 0 : summary?.state === paymentFilter;
    });
    return [...result].sort((a, b) => {
      if (sort === "lastName") return a.last_name.localeCompare(b.last_name, language) || a.first_name.localeCompare(b.first_name, language);
      if (sort === "age") {
        if (!a.birth_date) return b.birth_date ? 1 : 0;
        if (!b.birth_date) return -1;
        return b.birth_date.localeCompare(a.birth_date);
      }
      if (sort === "debt") return (paymentSummaries.get(b.id)?.debt ?? 0) - (paymentSummaries.get(a.id)?.debt ?? 0) || b.created_at.localeCompare(a.created_at);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [players, search, paymentFilter, birthYear, sort, language, paymentSummaries]);

  const archivePlayer = async (player: Player) => {
    setArchivingId(player.id);
    try {
      const { error } = await onUpdate(player.id, { is_active: !player.is_active });
      if (error) toast.error(t("archiveFailed"));
      else { toast.success(t(player.is_active ? "archiveSuccess" : "restoreSuccess")); setSelectedIds((ids) => { const next = new Set(ids); next.delete(player.id); return next; }); }
    } catch { toast.error(t("archiveFailed")); }
    finally { setArchivingId(null); }
  };

  const isNewPlayer = (createdAt: string) =>
    Date.now() - new Date(createdAt).getTime() < 2 * 24 * 60 * 60 * 1000;


  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleSelectedCount = filteredPlayers.filter((p) => selectedIds.has(p.id)).length;
  const allVisibleSelected = filteredPlayers.length > 0 && visibleSelectedCount === filteredPlayers.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredPlayers.forEach((p) => next.delete(p.id));
      } else {
        filteredPlayers.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    play("success");
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => onDelete(id)));
    setSelectedIds(new Set());
    setBulkDeleting(false);
  };

  const copyRegistrationLink = () => {
    if (!registrationLink.registrationUrl) return;
    navigator.clipboard.writeText(registrationLink.registrationUrl);
    toast.success(t("toastLinkCopied"));
  };

  const approveRegistrationRequest = async (request: PlayerRegistrationRequest) => {
    play("success");
    const { error } = await registrationRequests.approveRequest(request);
    if (error) toast.error(t("toastApproveFailed"));
    else {
      toast.success(t("toastPlayerAdded"));
      setViewRequest(null);
    }
  };

  const rejectRegistrationRequest = async (request: PlayerRegistrationRequest) => {
    play("click");
    const { error } = await registrationRequests.rejectRequest(request);
    if (error) toast.error(t("toastDeleteFailed"));
    else {
      toast.success(t("toastRegistrationDeleted"));
      setViewRequest(null);
    }
  };

  const handlePlayerPdf = async (player: Player) => {
    play("success");
    await downloadPlayerPaymentsPdf({ player, payments, clubName: schoolName, sportName: sport.name, monthShort, formatMoney, language });
  };

  const handleAllDebtsPdf = async () => {
    play("success");
    await downloadAllDebtsPdf({ players, payments, clubName: schoolName, sportName: sport.name, formatMoney, language });
  };

  const handlePlayersListPdf = async () => {
    play("success");
    await downloadPlayersListPdf({ players, payments, clubName: schoolName, sportName: sport.name, formatMoney, language });
  };

  return (
    <div className="space-y-4" data-players-list>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl tracking-wider text-foreground">{sport.members}</h2>
        <div className="flex items-center gap-2 flex-wrap">
         <DropdownMenu>
           <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label={t("sectionMore")} title={t("sectionMore")}><MoreHorizontal /></Button></DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuItem onSelect={onImportBank} disabled={loading}><FileUp />{t("bankImport")}</DropdownMenuItem>
             <DropdownMenuItem onSelect={() => void handlePlayersListPdf()}><FileText />{t("playersListPdf")}</DropdownMenuItem>
             <DropdownMenuItem onSelect={() => void handleAllDebtsPdf()}><FileText />{t("debtsPdf")}</DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
        <Dialog open={addOpen} onOpenChange={(o) => { if (o) play("click"); setAddOpen(o); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md">
              <Plus className="w-4 h-4" /> {t("addMember", { member: sport.member })}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl tracking-wider">{t("newMember", { member: sport.member })}</DialogTitle>
            </DialogHeader>
            <PlayerForm
              sport={sport}
              onSubmit={async (formData) => {
                play("success");
                const { siblings: sibs, ...main } = formData;
                const familyId = sibs?.length ? crypto.randomUUID() : null;
                const entries: PlayerInsert[] = [
                  { ...main, family_id: familyId },
                  ...(sibs ?? []).map((s) => ({ ...main, first_name: s.firstName, t_number: s.tNumber, birth_date: s.birthDate, family_id: familyId })),
                ];
                for (const data of entries) {
                const { created } = await onAdd(data);
                if (created && user) {
                  // Fire-and-forget: registration + payment schedule SMS
                  void sendEventSms({
                    userId: user.id,
                    playerId: created.id,
                    kind: "registration",
                    clubName: schoolName,
                    sportName: sport.name,
                    lang: language,
                  });
                  void sendEventSms({
                    userId: user.id,
                    playerId: created.id,
                    kind: "schedule",
                    clubName: schoolName,
                    sportName: sport.name,
                    lang: language,
                  });
                }
                }
                setAddOpen(false);
              }}
              onCancel={() => setAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>
      {registrationLink.registrationUrl && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t("playerRegLinkLabel")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={copyRegistrationLink}>
              <LinkIcon className="w-3.5 h-3.5 mr-1" /> {t("copyBtn")}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={registrationLink.registrationUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> {t("viewBtn")}
              </a>
            </Button>
          </div>
        </div>
      )}

      {registrationRequests.requests.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{t("newRegistrationsLabel")}</p>
            <span className="text-xs text-muted-foreground">{registrationRequests.requests.length}</span>
          </div>
          <div className="space-y-2">
            {registrationRequests.requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-2">
                <button type="button" onClick={() => setViewRequest(request)} className="min-w-0 text-left flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{request.first_name} {request.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{request.primary_contact === "parent" ? request.parent_phone : request.phone}</p>
                  <p className="text-xs text-muted-foreground">{formatArrivalDateTime(request.created_at, monthLong)}</p>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewRequest(request)} title={t("viewFull")}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" className="h-8 w-8" onClick={() => approveRegistrationRequest(request)} title={t("approve")}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => rejectRegistrationRequest(request)} title={t("removeAction")}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!viewRequest} onOpenChange={(open) => !open && setViewRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-wider">{t("regDetailsTitle")}</DialogTitle>
          </DialogHeader>
          {viewRequest && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">{t("firstName")}</p><p className="font-medium">{viewRequest.first_name}</p></div>
                <div><p className="text-muted-foreground">{t("lastName")}</p><p className="font-medium">{viewRequest.last_name}</p></div>
                <div><p className="text-muted-foreground">{t("birthDate")}</p><p className="font-medium">{viewRequest.birth_date}</p></div>
                <div><p className="text-muted-foreground">{t("arrivalTime")}</p><p className="font-medium">{formatArrivalDateTime(viewRequest.created_at, monthLong)}</p></div>
                <div><p className="text-muted-foreground">{t("contactLabel")}</p><p className="font-medium">{viewRequest.primary_contact === "parent" ? t("parentLabel") : t("playerLabel")}</p></div>
                <div><p className="text-muted-foreground">{t("personalPhoneLabel")}</p><p className="font-medium">{viewRequest.phone ?? "—"}</p></div>
                <div><p className="text-muted-foreground">{t("parentPhoneLabel")}</p><p className="font-medium">{viewRequest.parent_phone ?? "—"}</p></div>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="font-semibold">{t("experienceLabel")}: {viewRequest.experience_level === "inexperienced" ? t("expInexperienced") : t("expExperienced")}</p>
                {viewRequest.experience_level === "experienced" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><p className="text-muted-foreground">{t("previousClubLabel")}</p><p>{viewRequest.previous_club}</p></div>
                    <div><p className="text-muted-foreground">{t("previousTeamLabel")}</p><p>{viewRequest.previous_team}</p></div>
                    <div><p className="text-muted-foreground">{t("leagueLabel")}</p><p>{viewRequest.league}</p></div>
                    <div><p className="text-muted-foreground">{t("lastCoachLabel")}</p><p>{viewRequest.last_coach}</p></div>
                  </div>
                )}
              </div>
              {viewRequest.notes && <div><p className="text-muted-foreground">{t("noteLabel")}</p><p className="whitespace-pre-wrap">{viewRequest.notes}</p></div>}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => rejectRegistrationRequest(viewRequest)}>
                  <X className="w-4 h-4 mr-2" /> {t("removeAction")}
                </Button>
                <Button className="flex-1" onClick={() => approveRegistrationRequest(viewRequest)}>
                  <Check className="w-4 h-4 mr-2" /> {t("addAsPlayerBtn")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("playerSearch")} aria-label={t("playerSearch")} className="h-9 pl-9 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Select value={paymentFilter} onValueChange={(value) => { const choice = PLAYER_PAYMENT_FILTERS.find((f) => f === value); if (choice) onPaymentFilterChange(choice); }}>
            <SelectTrigger className="h-9 min-w-0 text-xs" aria-label={t("playerPaymentFilter")}><Filter className="mr-1 size-3.5 shrink-0" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem><SelectItem value="paid">{t("paid")}</SelectItem><SelectItem value="partial">{t("partiallyPaid")}</SelectItem><SelectItem value="pending">{t("pending")}</SelectItem><SelectItem value="overdue">{t("overdue")}</SelectItem><SelectItem value="archived">{t("archivedPlayers")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={birthYear} onValueChange={setBirthYear}>
            <SelectTrigger className="h-9 min-w-0 text-xs" aria-label={t("birthYearFilter")}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("allBirthYears")}</SelectItem>{birthYears.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => { if (value === "newest" || value === "lastName" || value === "age" || value === "debt") setSort(value); }}>
            <SelectTrigger className="h-9 min-w-0 text-xs" aria-label={t("playerSort")}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="newest">{t("sortNewest")}</SelectItem><SelectItem value="lastName">{t("sortLastName")}</SelectItem><SelectItem value="age">{t("sortAge")}</SelectItem><SelectItem value="debt">{t("sortDebt")}</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <p className="text-xs text-muted-foreground">{t("playerResults", { count: filteredPlayers.length, total: players.length })}</p>
          <Button size="sm" variant={selectionMode ? "secondary" : "ghost"} aria-pressed={selectionMode} onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}><ListChecks className="size-4" />{t("selectionMode")}</Button>
        </div>
      </div>

      {selectionMode && filteredPlayers.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <Checkbox
              checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
              onCheckedChange={toggleAllVisible}
            />
            <span>
              {selectedIds.size > 0
                ? t("selected", { count: selectedIds.size })
                : t("selectAll", { count: filteredPlayers.length })}
            </span>
          </label>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
                {t("clear")}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={bulkDeleting}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {t("deleteCount", { count: selectedIds.size })}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("deleteMembersTitle", { count: selectedIds.size, label: selectedIds.size === 1 ? sport.member.toLowerCase() : sport.members.toLowerCase() })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteMembersDesc", { label: sport.members.toLowerCase() })} {t("archiveRecommend")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{players.length === 0
            ? t("noMembersYet", { members: sport.members.toLowerCase(), member: sport.member.toLowerCase() })
            : t("noMembersMatch", { members: sport.members.toLowerCase() })}</p>
        </motion.div>
      ) : (
                <div className="max-h-[62vh] overflow-y-auto pr-1">
          <AnimatePresence>
            {filteredPlayers.map((player) => (
              <motion.div
                key={player.id}
                data-player-row
                data-player-id={player.id}
                 data-selected={selectedId === player.id}
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                        onClick={() => { play("click"); onSelect(player); }}
                        className={`px-3 py-2.5 rounded-xl border cursor-pointer ${
                  selectedId === player.id
                    ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                    {selectionMode && <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(player.id)}
                        onCheckedChange={() => toggleOne(player.id)}
                        aria-label={t("selectPlayer", { name: `${player.first_name} ${player.last_name}` })}
                      />
                    </div>}
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-display text-lg text-primary shrink-0">
                      #{player.t_number}
                    </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-card-foreground flex min-w-0 flex-wrap items-center gap-1.5">
                                <span className="w-full truncate">{player.first_name} {player.last_name}</span>
                        {isNewPlayer(player.created_at) && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30 shrink-0">
                            {t("newPlayer")}
                          </span>
                        )}
                        {player.birth_date ? (

                                  <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                            {t("yearsOld", { count: calcAge(player.birth_date) })}
                          </span>
                        ) : (
                          <span className="text-xs font-normal text-muted-foreground/60">—</span>
                        )}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5"><span className={`size-1.5 shrink-0 rounded-full ${paymentSummaries.get(player.id)?.state === "paid" ? "bg-success" : paymentSummaries.get(player.id)?.state === "exempt" ? "bg-muted-foreground" : "bg-warning"}`} />
                          {t(paymentSummaries.get(player.id)?.state === "exempt" ? "playerExempt" : paymentSummaries.get(player.id)?.state === "paid" ? "paid" : paymentSummaries.get(player.id)?.state === "partial" ? "playerPartial" : "pending")}
                        </span>
                        {(paymentSummaries.get(player.id)?.overdueMonths ?? 0) > 0 && <span className="rounded border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-destructive">{formatMoney(paymentSummaries.get(player.id)?.debt ?? 0)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-0.5 sm:flex sm:items-center">
                    <Dialog open={editPlayer?.id === player.id} onOpenChange={(open) => !open && setEditPlayer(null)}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title={t("paymentsPdf")}
                       
                        onClick={(e) => { e.stopPropagation(); void handlePlayerPdf(player); }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                       
                        onClick={(e) => { e.stopPropagation(); play("click"); setEditPlayer(player); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle className="text-2xl tracking-wider">{t("editMember", { member: sport.member })}</DialogTitle>
                        </DialogHeader>
                        {editPlayer && (
                          <PlayerForm
                            initial={editPlayer}
                            sport={sport}
                            onSubmit={async (data) => {
                              play("success");
                              await onUpdate(editPlayer.id, data);
                              setEditPlayer(null);
                            }}
                            onCancel={() => setEditPlayer(null)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" disabled={archivingId === player.id} aria-label={t(player.is_active ? "archivePlayer" : "restorePlayer")} title={t(player.is_active ? "archivePlayer" : "restorePlayer")} onClick={(e) => { e.stopPropagation(); void archivePlayer(player); }}>
                      {player.is_active ? <Archive className="size-3.5" /> : <ArchiveRestore className="size-3.5" />}
                    </Button>
                    <AlertDialog open={deleteConfirm === player.id} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={t("delete")} title={t("delete")} onClick={(e) => { e.stopPropagation(); setDeleteConfirm(player.id); }}><Trash2 className="size-3.5" /></Button>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader><AlertDialogTitle>{t("deleteMembersTitle", { count: 1, label: sport.member.toLowerCase() })}</AlertDialogTitle><AlertDialogDescription>{t("archiveRecommend")}</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>{t("cancel")}</AlertDialogCancel>{player.is_active && <Button variant="outline" onClick={() => { void archivePlayer(player); setDeleteConfirm(null); }}><Archive className="size-4" />{t("archivePlayer")}</Button>}<AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { void onDelete(player.id); setDeleteConfirm(null); }}>{t("delete")}</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
