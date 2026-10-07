import { useEffect, useMemo, useState } from 'react';
import { Check, FileUp, LoaderCircle, Trash2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/hooks/use-i18n';
import { useAuth } from '@/hooks/use-auth';
import { sendEventSms } from '@/lib/notifications';
import { detectColumns, EMPTY_MAPPING, matchTransaction, normalizeName, previewBatch, senderIsPlayer, type BankPlayer, type BankPayment, type ColumnMapping, type PayerAlias, type ReviewTransaction } from '@/lib/bank-import';
import { applyBankImport, deletePayerAlias, loadBankImportData, type ImportResult } from '@/lib/bank-import-client';
import { readBankFile, transactionsFromGrid } from '@/lib/bank-import-file';
import type { TranslationKey } from '@/lib/i18n/translations';

function PlayerPicker({ players, value, onChange, disabled }: { players: BankPlayer[]; value: string; onChange: (id:string)=>void; disabled:boolean }) {
 const { t } = useI18n(); const [open,setOpen] = useState(false);
 const player = players.find(p=>p.id===value);
 return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button disabled={disabled} variant="outline" className="w-full justify-start whitespace-normal text-left h-auto min-h-9">{player ? `${player.first_name} ${player.last_name}` : t('bankUnmatched')}</Button></PopoverTrigger><PopoverContent className="w-72 p-0"><Command><CommandInput placeholder={t('playerSearch')} /><CommandList><CommandEmpty>{t('bankUnmatched')}</CommandEmpty>{players.filter(p=>p.is_active).map(p=><CommandItem key={p.id} value={`${p.first_name} ${p.last_name} ${normalizeName(`${p.first_name} ${p.last_name}`)} ${p.id}`} onSelect={()=>{onChange(p.id);setOpen(false);}}><Check className={`mr-2 size-4 ${value===p.id?'opacity-100':'opacity-0'}`} />{p.first_name} {p.last_name}</CommandItem>)}</CommandList></Command></PopoverContent></Popover>;
}

export function BankImportDialog({ open, onOpenChange, sport, sportName, clubName, players, payments, onRefresh }: { open:boolean; onOpenChange:(open:boolean)=>void; sport:string; sportName:string; clubName:string; players:BankPlayer[]; payments:BankPayment[]; onRefresh:()=>Promise<void> }) {
 const { t, monthLong, language } = useI18n(); const { user } = useAuth();
 const [step,setStep] = useState<'upload'|'review'|'done'>('upload');
 const [sheets,setSheets] = useState<Awaited<ReturnType<typeof readBankFile>>>([]);
 const [sheetIndex,setSheetIndex] = useState(0); const [headerRow,setHeaderRow] = useState(0); const [mapping,setMapping] = useState<ColumnMapping>({...EMPTY_MAPPING});
 const [rows,setRows] = useState<ReviewTransaction[]>([]); const [aliases,setAliases] = useState<PayerAlias[]>([]);
 const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [filename,setFilename] = useState('');
 const [filter,setFilter] = useState('all'); const [showPayers,setShowPayers] = useState(false); const [sms,setSms] = useState(false);
 const [ignored,setIgnored] = useState(0); const [invalid,setInvalid] = useState(0); const [result,setResult] = useState<ImportResult|null>(null);
 const [doneLeftover,setDoneLeftover] = useState(0);
 const previews = useMemo(()=>previewBatch(rows,players,payments),[rows,players,payments]);
 const counts = { matched:rows.filter(r=>!r.skip&&!r.duplicate&&r.playerId&&r.confirmed).length, check:rows.filter(r=>!r.skip&&!r.duplicate&&r.playerId&&!r.confirmed).length, unmatched:rows.filter(r=>!r.skip&&!r.duplicate&&!r.playerId).length };
 const ready = rows.filter(r=>!r.skip&&!r.duplicate&&r.playerId&&r.confirmed&&(previews.get(r.key)?.allocations.length??0)>0);
 const total = ready.reduce((sum,row)=>sum+(previews.get(row.key)?.allocations.reduce((n,p)=>n+p.amount,0)??0),0);
 const sheet = sheets[sheetIndex];
 const money = (amount:number)=>`${amount.toFixed(2)} GEL`;
 useEffect(()=>{ if (!open) return; setStep('upload');setSheets([]);setRows([]);setFilename('');setError('');setResult(null);setSms(false);setFilter('all');setBusy(false);setShowPayers(false);
  let active=true; loadBankImportData(sport,[]).then(data=>{if(active)setAliases(data.aliases);}).catch(()=>{if(active)setError(t('bankApplyError'));}); return ()=>{active=false;};
 },[open,sport]);
 function selectSheet(index:number) { setSheetIndex(index); const detection = sheets[index]?.detection; if(detection){setHeaderRow(detection.headerRow);setMapping(detection.mapping);} }
 async function review(grid:unknown[][],header:number,columns:ColumnMapping) {
  setBusy(true);setError('');
  try {
   const parsed=await transactionsFromGrid(grid,header,columns);setIgnored(parsed.ignored);setInvalid(parsed.invalid);
   if(!parsed.transactions.length){setError(t('bankNoIncoming'));return;}
   if(parsed.transactions.length>2000){setError(t('bankFileError'));return;}
   const data=await loadBankImportData(sport,parsed.transactions.map(tx=>tx.key));setAliases(data.aliases);
   const seen=new Set<string>();
   setRows(parsed.transactions.sort((a,b)=>a.date.localeCompare(b.date)).map(tx=>{
    const match=matchTransaction(tx,players,data.aliases);const duplicate=data.imported.has(tx.key)||seen.has(tx.key);seen.add(tx.key);
    return {...tx,...match,confirmed:match.confidence==='high',remember:false,skip:false,duplicate,targetMonth:''};
   }));setStep('review');
  }catch{setError(t('bankFileError'));}finally{setBusy(false);}
 }
 async function upload(file:File) {
  setBusy(true);setError('');setFilename(file.name);
  try { const read=await readBankFile(file);setSheets(read); const index=Math.max(0,read.findIndex(s=>s.detection?.confident));setSheetIndex(index);
   const selected=read[index]; if(!selected){setError(t('bankFileError'));return;}
   const detection=selected.detection??detectColumns(selected.grid);setHeaderRow(detection.headerRow);setMapping(detection.mapping);
   // Multiple sheets require an explicit choice; ambiguous files always use mapping.
   if(detection.confident&&read.length===1)await review(selected.grid,detection.headerRow,detection.mapping);
  }catch(e){setError(t(e instanceof Error&&e.message==='BANK_FILE_TOO_LARGE'?'bankTooLarge':'bankFileError'));}finally{setBusy(false);}
 }
 function changeRow(key:string,changes:Partial<ReviewTransaction>) {setRows(old=>old.map(r=>r.key===key?{...r,...changes}:r));}
 function pickPlayer(row:ReviewTransaction,id:string) {const player=players.find(p=>p.id===id);changeRow(row.key,{playerId:id,confidence:'high',confirmed:true,skip:false,remember:!!row.sender&&!!player&&!senderIsPlayer(row.sender,player)});}
 async function apply() {
  if(!ready.length||busy)return;setBusy(true);setError('');
  try {
   const applied=await applyBankImport(sport,ready.map(row=>({...row,payerName:normalizeName(row.sender),allocations:previews.get(row.key)?.allocations??[]})));
   setDoneLeftover(ready.filter(row=>applied.applied.includes(row.key)).reduce((sum,row)=>sum+(previews.get(row.key)?.leftover??0),0));
   setResult(applied);setStep('done');
   if(sms&&user)for(const confirmation of applied.confirmations)void sendEventSms({userId:user.id,playerId:confirmation.playerId,paymentId:confirmation.paymentId,kind:'payment_paid',clubName,sportName,lang:language});
   await onRefresh();
  }catch(e){const stale=String((e as {message?:string})?.message??'').includes('BANK_IMPORT_STALE');setError(t(stale?'bankStale':'bankApplyError'));await onRefresh();
   const data=await loadBankImportData(sport,rows.map(r=>r.key));setRows(old=>old.map(r=>({...r,duplicate:r.duplicate||data.imported.has(r.key)})));
  }finally{setBusy(false);}
 }
 const visible=rows.filter(r=>filter==='all'||(filter==='matched'&&!r.skip&&!r.duplicate&&r.playerId&&r.confirmed)||(filter==='check'&&!r.skip&&!r.duplicate&&r.playerId&&!r.confirmed)||(filter==='unmatched'&&!r.skip&&!r.duplicate&&!r.playerId));
 const columns: [keyof ColumnMapping,TranslationKey][]=[['date','bankDate'],['amount','bankAmount'],['sender','bankSender'],['purpose','bankPurpose'],['id','bankId'],['debit','bankDebit'],['direction','bankDirection']];
 return <Dialog open={open} onOpenChange={value=>{if(!busy)onOpenChange(value);}}><DialogContent className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-3 overflow-hidden rounded-none p-4 sm:h-[90dvh] sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:max-w-6xl sm:rounded-lg sm:p-6" onEscapeKeyDown={e=>{if(busy)e.preventDefault();}} onPointerDownOutside={e=>{if(busy)e.preventDefault();}}>
  <DialogHeader className="shrink-0 pr-7"><DialogTitle className="flex items-center gap-2"><FileUp className="size-5 text-primary" />{t('bankImport')}</DialogTitle><DialogDescription>{step==='upload'?t('bankFilePrivacy'):filename}</DialogDescription></DialogHeader>
  <ol className="flex shrink-0 items-center gap-3 border-b border-border pb-3 text-sm">{(['upload','review','done'] as const).map((s,i)=><li key={s} className={step===s?'font-semibold text-primary':'text-muted-foreground'}>{i+1}. {t(s==='upload'?'bankUpload':s==='review'?'bankReview':'bankDone')}</li>)}</ol>
  {error&&<p role="alert" className="shrink-0 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
  <div className="min-h-0 flex-1 overflow-y-auto">
   {step==='upload'&&<div className="space-y-5"><label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-6 text-center"><FileUp className="size-8 text-primary" /><span className="font-semibold">{t('bankChooseFile')}</span><Input aria-label={t('bankChooseFile')} type="file" accept=".xlsx,.xls,.csv" disabled={busy} className="max-w-md" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);}} /></label>
   {sheet&&<div className="space-y-4"><h3 className="font-semibold">{t('bankMapping')}</h3><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm">{t('bankSheet')}<Select value={String(sheetIndex)} onValueChange={v=>selectSheet(Number(v))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{sheets.map((s,i)=><SelectItem value={String(i)} key={i}>{s.name}</SelectItem>)}</SelectContent></Select></label><label className="space-y-1 text-sm">{t('bankHeaderRow')}<Input type="number" min={1} max={sheet.grid.length} value={headerRow+1} onChange={e=>{const row=Math.max(0,Number(e.target.value)-1);setHeaderRow(row);setMapping(detectColumns([sheet.grid[row]??[]]).mapping);}} /></label></div>
   <div className="grid gap-3 sm:grid-cols-3">{columns.map(([field,label])=><label key={field} className="space-y-1 text-sm">{t(label)}<Select value={String(mapping[field])} onValueChange={v=>setMapping(m=>({...m,[field]:Number(v)}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="-1">{t('bankNoColumn')}</SelectItem>{Array.from({length:Math.max(...sheet.grid.slice(headerRow,headerRow+6).map(r=>r.length))},(_,i)=><SelectItem key={i} value={String(i)}>{i+1}: {String(sheet.grid[headerRow]?.[i]??'').slice(0,70)}</SelectItem>)}</SelectContent></Select></label>)}</div>
   <div className="overflow-x-auto"><table className="w-full text-left text-xs"><tbody>{sheet.grid.slice(headerRow,headerRow+6).map((row,i)=><tr key={i} className="border-b border-border">{row.map((cell,j)=><td key={j} className="max-w-52 truncate p-2">{String(cell??'')}</td>)}</tr>)}</tbody></table></div>
   <Button disabled={busy||mapping.date<0||mapping.amount<0||mapping.sender<0||new Set([mapping.date,mapping.amount,mapping.sender,...(mapping.purpose>=0?[mapping.purpose]:[])]).size!==3+(mapping.purpose>=0?1:0)} onClick={()=>void review(sheet.grid,headerRow,mapping)}>{t('bankReview')}</Button></div>}
   </div>}
   {step==='review'&&<div className="space-y-4"><div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border pb-3 text-sm"><span>{t('bankTransactions')}: <strong>{rows.length}</strong></span><span className="text-success">{t('bankMatched')}: {counts.matched}</span><span className="text-warning">{t('bankNeedsCheck')}: {counts.check}</span><span>{t('bankUnmatched')}: {counts.unmatched}</span><span className="font-semibold">{t('bankAppliedAmount')}: {money(total)}</span></div>
   <Tabs value={filter} onValueChange={setFilter}><TabsList className="flex h-auto flex-wrap justify-start">{[['all','bankAll'],['matched','bankMatched'],['check','bankNeedsCheck'],['unmatched','bankUnmatched']].map(([value,key])=><TabsTrigger key={value} value={value}>{t(key as TranslationKey)}</TabsTrigger>)}</TabsList></Tabs>
   {(ignored>0||invalid>0)&&<p className="text-xs text-muted-foreground">{t('bankIgnored',{count:ignored})} · {t('bankInvalidRows',{count:invalid})}</p>}
   {visible.map((row,index)=>{const preview=previews.get(row.key);const player=players.find(p=>p.id===row.playerId);const familyPayments=player?payments.filter(p=>players.some(member=>(member.id===player.id||(player.family_id&&member.family_id===player.family_id))&&member.id===p.player_id)):[];const months=[...new Set(familyPayments.map(p=>`${p.year}-${String(p.month).padStart(2,'0')}`))].sort();
    return <article data-bank-row key={`${row.key}-${index}`} className={`rounded-lg border border-border p-3 ${row.duplicate?'bg-muted/40 opacity-50':row.skip?'opacity-50':'bg-card'}`}><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"><div className="min-w-0 space-y-1"><div className="flex justify-between gap-3"><time className="text-sm">{row.date}</time><strong className="text-success">{money(row.amount)}</strong></div><p className="break-words text-sm font-semibold">{row.sender||'—'}</p><p className="break-words text-xs text-muted-foreground">{row.purpose||'—'}</p></div><div className="min-w-0 space-y-2"><PlayerPicker players={players} value={row.playerId} disabled={busy||row.duplicate} onChange={id=>pickPlayer(row,id)}/><div className="flex flex-wrap items-center gap-2"><span className={`text-xs ${row.duplicate?'text-muted-foreground':row.confirmed?'text-success':row.confidence==='medium'?'text-warning':'text-muted-foreground'}`}>{t(row.duplicate?'bankAlreadyImported':row.confirmed?(row.confidence==='medium'?'bankConfirmed':'bankHigh'):row.confidence==='medium'?'bankCheck':'bankUnmatched')}</span>{row.playerId&&!row.confirmed&&!row.duplicate&&<Button size="sm" variant="outline" disabled={busy} onClick={()=>changeRow(row.key,{confirmed:true,remember:!!row.sender&&!!player&&!senderIsPlayer(row.sender,player)})}><Check className="size-3"/>{t('bankConfirmMatch')}</Button>}<label className="flex items-center gap-1 text-xs"><Checkbox disabled={busy||row.duplicate} checked={row.skip} onCheckedChange={v=>changeRow(row.key,{skip:!!v})}/>{t('skip')}</label></div>{row.playerId&&!!row.sender&&!row.duplicate&&<label className="flex items-center gap-2 text-xs"><Checkbox disabled={busy||row.skip} checked={row.remember} onCheckedChange={v=>changeRow(row.key,{remember:!!v})}/>{t('bankRemember')}</label>}</div><div className="min-w-0 space-y-2">{!row.duplicate&&<><Select disabled={busy||!row.playerId||row.skip} value={row.targetMonth||'oldest'} onValueChange={v=>changeRow(row.key,{targetMonth:v==='oldest'?'':v})}><SelectTrigger aria-label={t('bankTargetMonth')}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="oldest">{t('bankOldest')}</SelectItem>{months.map(month=><SelectItem key={month} value={month}>{monthLong(Number(month.slice(5)))} {month.slice(0,4)}</SelectItem>)}</SelectContent></Select>
    <ul className="space-y-1 text-xs">{preview?.allocations.map(part=>{const member=players.find(p=>p.id===part.playerId);return <li key={part.paymentId} className="break-words">{familyPayments.some(p=>p.player_id!==row.playerId)?`${member?.first_name??''} · `:''}{monthLong(part.month)} {part.year}: +{money(part.amount)} <span className={part.fullyPaid?'text-success':'text-warning'}>{t(part.fullyPaid?'paid':'playerPartial')}</span>{!part.fullyPaid&&` · ${t('bankRemaining')}: ${money(Math.max(0,Number(payments.find(p=>p.id===part.paymentId)?.amount??0)-part.resultingPaid))}`}</li>;})}</ul>{(preview?.leftover??0)>0&&<p className="text-xs text-warning">{t('bankUnallocated')}: {money(preview?.leftover??0)}</p>}</>}</div></div></article>;
   })}</div>}
   {step==='done'&&result&&<div className="space-y-5 py-6"><Check className="mx-auto size-14 text-success"/><h3 className="text-center text-xl font-semibold">{t('bankResult')}</h3><dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[['bankApplied',result.applied.length],['bankSkipped',rows.length-result.applied.length-result.duplicates.length],['bankDuplicateCount',result.duplicates.length+rows.filter(r=>r.duplicate).length],['bankUnallocated',money(rows.filter(r=>result.applied.includes(r.key)).reduce((sum,r)=>sum+(previews.get(r.key)?.leftover??0),0))]].map(([key,value])=><div key={key} className="border-b border-border p-3"><dt className="text-sm text-muted-foreground">{t(key as TranslationKey)}</dt><dd className="mt-2 text-xl font-semibold">{value}</dd></div>)}</dl></div>}
   <div className="mt-5 border-t border-border pt-4"><Button variant="ghost" size="sm" onClick={()=>setShowPayers(v=>!v)}><Users className="size-4"/>{t('bankSavedPayers')} ({aliases.length})</Button>{showPayers&&<div className="mt-3 space-y-2">{aliases.length===0?<p className="text-sm text-muted-foreground">{t('bankNoPayers')}</p>:aliases.map(alias=>{const player=players.find(p=>p.id===alias.player_id);return <div key={alias.id} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm"><span className="min-w-0 break-words">{alias.payer_name} → {player?.first_name} {player?.last_name}</span><Button disabled={busy} variant="ghost" size="icon" title={t('delete')} aria-label={t('delete')} onClick={async()=>{try{await deletePayerAlias(alias.id);setAliases(old=>old.filter(a=>a.id!==alias.id));}catch{setError(t('bankApplyError'));}}><Trash2 className="size-4 text-destructive"/></Button></div>;})}</div>}</div>
  </div>
  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-3">{busy&&<LoaderCircle className="size-5 animate-spin text-primary"/>}{step==='review'?<><label className="flex items-center gap-2 text-sm"><Checkbox checked={sms} disabled={busy} onCheckedChange={v=>setSms(!!v)}/>{t('bankSendSms')}</label><div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={()=>{setStep('upload');setError('');}}>{t('back')}</Button><Button disabled={busy||!ready.length} onClick={()=>void apply()}>{busy?<LoaderCircle className="size-4 animate-spin"/>:<Check className="size-4"/>}{t('bankApply')} ({ready.length})</Button></div></>:<Button className="ml-auto" variant="outline" disabled={busy} onClick={()=>onOpenChange(false)}>{t(step==='done'?'finish':'cancel')}</Button>}</div>
 </DialogContent></Dialog>;
}
