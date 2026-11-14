import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ArrowLeft, Check, Clock, ExternalLink, Ghost, Info, LayoutDashboard, Link as LinkIcon, QrCode, Search, Sparkles, X } from "lucide-react";
import { buildBlocks, clock, dayLabel, contacts, money, relTime, snippet, type Channel, type Contact, type Conversation, type RenderBlock } from "@/data/inbox";
import { inboxStore, useInbox } from "@/data/inbox-store";
import { AiTile, Avatar, RichText } from "./parts";
import { NewMessageModal } from "./NewMessageModal";

const contactOf = (c: Conversation) => contacts.find((x) => x.id === c.contactId)!;

export function InboxPage() {
  const { conversations, aiEnabled } = useInbox();
  const [tab, setTab] = useState<"open" | "solved">("open");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("c-marcus");
  const [mobileThread, setMobileThread] = useState(false);
  const [modal, setModal] = useState(false);

  const byTab = useMemo(() => conversations.filter((c) => c.status === tab).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)), [conversations, tab]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return byTab;
    return byTab.filter((c) => { const p = contactOf(c); return [p.name, p.email, p.phone].some((v) => v?.toLowerCase().includes(s)); });
  }, [byTab, q]);
  const openCount = conversations.filter((c) => c.status === "open").length;

  const selected = list.find((c) => c.id === selectedId) ?? list[0] ?? null;
  useEffect(() => { if (selected?.unread) inboxStore.markRead(selected.id); }, [selected?.id, selected?.unread]);

  const select = (id: string) => { setSelectedId(id); setMobileThread(true); };
  const searching = q.trim().length > 0;
  const tabEmpty = byTab.length === 0;
  const noMatches = searching && !tabEmpty && list.length === 0;
  const aiSolved = conversations.filter((c) => c.status === "solved" && c.solvedBy?.kind === "ai").length;
  const paneEmpty = noMatches
    ? { title: `No matches for "${q.trim()}"`, sub: "Try a different name, email, or phone number.", cta: "Clear search", action: () => setQ("") }
    : tab === "open"
      ? { title: "You're all caught up", sub: `No open conversations right now. AI solved ${aiSolved} this month.`, cta: "New message", action: () => setModal(true) }
      : { title: "Nothing solved yet", sub: "Conversations you or AI mark solved show up here.", cta: "See open conversations", action: () => setTab("open") };

  return (
    <main className="@container flex flex-1 flex-col px-3 pb-8 pt-3 md:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[28px] font-bold">Inbox</h1>
        <div className="flex items-center gap-6">
          <AiSwitch on={aiEnabled} onChange={inboxStore.setAi} />
          <button className="btn-secondary" onClick={() => setModal(true)}>New message</button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 items-start gap-4 md:grid-cols-[300px_minmax(0,1fr)] @min-[1000px]:grid-cols-[300px_minmax(400px,1fr)_260px]">
        <section className={`pane p-4 md:row-span-2 @min-[1000px]:row-span-1 ${mobileThread ? "hidden md:block" : ""}`}>
          <div className="flex rounded-full bg-page p-[3px]">
            {(["open", "solved"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`h-8 flex-1 rounded-full text-[13px] font-medium ${tab === t ? "bg-dark text-primary-foreground" : "text-ink"}`}>
                {t === "open" ? `Open · ${openCount}` : "Solved"}
              </button>
            ))}
          </div>
          {tabEmpty ? (
            tab === "open" ? (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-ok text-ok-ink"><Check size={28} /></span>
                <p className="mt-4 text-lg font-bold">You're all caught up</p>
                <p className="mt-1 text-[13px] text-ink-2">No open conversations. AI solved {aiSolved} this month.</p>
                <button className="btn-text mt-3" onClick={() => setTab("solved")}>See them in Solved ↗</button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-page text-ink-2"><Ghost size={28} strokeWidth={1.7} /></span>
                <p className="mt-4 text-lg font-bold">Nothing solved yet</p>
                <p className="mt-1 text-[13px] text-ink-2">Conversations you or AI mark solved show up here.</p>
                <button className="btn-text mt-3" onClick={() => setTab("open")}>See open conversations ↗</button>
              </div>
            )
          ) : (<>
            <label className="mt-3 flex h-10 items-center gap-2 rounded-xl bg-page px-3">
              <Search size={16} className="text-ink-2" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone" className="w-full bg-transparent text-sm outline-none placeholder:text-ink-2" />
            </label>
            <ul className="mt-3 flex flex-col gap-1">
              {list.map((c) => <Row key={c.id} c={c} active={selected?.id === c.id} onClick={() => select(c.id)} />)}
              {noMatches && (
                <li className="flex flex-col items-center gap-2 py-8 text-center text-[13px] text-ink-2">
                  <span>No matches for "{q.trim()}"</span>
                  <button className="btn-text" onClick={() => setQ("")}>Clear search</button>
                </li>
              )}
            </ul>
          </>)}
        </section>

        {noMatches || tabEmpty || !selected ? (
          <section className="pane hidden min-h-[560px] flex-col items-center justify-center px-6 text-center md:flex @min-[1000px]:col-span-2">
            <Ghost size={72} strokeWidth={1.5} className="text-outline" />
            <p className="mt-3 text-lg font-bold">{paneEmpty.title}</p>
            <p className="mt-1 max-w-[320px] text-[13px] text-ink-2">{paneEmpty.sub}</p>
            <button className="btn-secondary mt-4" onClick={paneEmpty.action}>{paneEmpty.cta}</button>
          </section>
        ) : (<>
          <Thread key={selected.id} conv={selected} onBack={() => setMobileThread(false)} hiddenOnMobile={!mobileThread} />
          <ContactPanel contact={contactOf(selected)} hiddenOnMobile={!mobileThread} />
        </>)}
      </div>
      {modal && <NewMessageModal onClose={() => setModal(false)} onSent={(id) => { setModal(false); setTab("open"); setSelectedId(id); }} />}
    </main>
  );
}

function AiSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const [tip, setTip] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = () => { clearTimeout(t.current); setTip(true); };
  const hide = () => { t.current = setTimeout(() => setTip(false), 150); };
  return (
    <div className="flex items-center gap-3">
      <button role="switch" aria-checked={on} aria-label="AI replies" onClick={() => onChange(!on)} className={`relative h-6 w-10 rounded-full transition-colors ${on ? "bg-switch-on" : "bg-outline"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-card shadow-sm transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </button>
      <div className="leading-tight">
        <div className="relative flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles size={14} className="text-ai-icon" />AI replies
          <span className="relative" onMouseEnter={show} onMouseLeave={hide}>
            <button aria-label="About AI replies" onFocus={show} onBlur={hide} className="flex size-4 items-center justify-center text-muted-icon"><Info size={13} /></button>
            {tip && (
              <div role="tooltip" onMouseEnter={show} onMouseLeave={hide} className="absolute left-1/2 top-6 z-20 w-[248px] -translate-x-1/2 rounded-xl bg-ink p-3 text-xs font-normal text-primary-foreground">
                <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-ink" />
                Allow our AI agent to answer basic questions about your campaign. See the{" "}
                <a href="https://docs.example.com/ai-replies" target="_blank" rel="noreferrer" onFocus={show} onBlur={hide} className="text-link-soft underline">support doc</a> for more details.
              </div>
            )}
          </span>
        </div>
        <div className="text-xs text-ink-2">36% solved all time</div>
      </div>
    </div>
  );
}

function Row({ c, active, onClick }: { c: Conversation; active: boolean; onClick: () => void }) {
  const p = contactOf(c);
  return (
    <li>
      <button onClick={onClick} className={`flex w-full gap-3 rounded-[14px] p-3 text-left ${active ? "bg-sel" : "hover:bg-sel/60"}`}>
        <Avatar initials={p.initials} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`flex-1 truncate text-sm ${active ? "font-bold" : "font-semibold"}`}>{p.name}</span>
            {c.unread && <span className="size-2 rounded-full bg-brand" />}
            <span className="text-[11px] text-ink-2">{relTime(c.lastMessageAt)}</span>
          </div>
          <p className={`truncate text-xs ${c.unread ? "font-semibold text-ink" : "text-ink-2"}`}>{snippet(c)}</p>
          {c.status === "open" && c.aiHandedOff && <span className="pill-ai mt-1.5"><Sparkles size={10} />AI HANDED OFF</span>}
          {c.status === "solved" && c.solvedBy?.kind === "ai" && <span className="pill-ai mt-1.5"><Sparkles size={10} />AI SOLVED</span>}
          {c.status === "solved" && c.solvedBy?.kind === "user" && <span className="mt-1 block text-[11px] text-ink-2">Solved by {c.solvedBy.name}</span>}
        </div>
      </button>
    </li>
  );
}

function Thread({ conv, onBack, hiddenOnMobile }: { conv: Conversation; onBack: () => void; hiddenOnMobile: boolean }) {
  const p = contactOf(conv);
  const blocks = useMemo(() => buildBlocks(conv.items), [conv.items]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [conv.items.length]);
  const composerRef = useRef<ComposerHandle>(null);
  useEffect(() => { activeComposer.current = composerRef.current; });
  return (
    <section className={`pane flex min-h-[640px] min-w-0 flex-col ${hiddenOnMobile ? "hidden md:flex" : "flex"}`}>
      <header className="flex items-center gap-3 border-b border-hairline px-5 py-4">
        <button className="md:hidden" aria-label="Back" onClick={onBack}><ArrowLeft size={20} /></button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-bold">{p.name}</h2>
          <p className="truncate text-xs text-ink-2">{[p.phone ?? "no phone on file", p.email].filter(Boolean).join(" · ")}</p>
        </div>
        {conv.status === "open" && <button className="btn-secondary" onClick={() => inboxStore.markSolved(conv.id)}><Check size={16} />Mark solved</button>}
        {conv.status === "solved" && conv.solvedBy?.kind !== "ai" && <button className="btn-secondary" onClick={() => inboxStore.reopen(conv.id)}>Reopen</button>}
      </header>
      {conv.status === "solved" && conv.solvedBy?.kind === "ai" && (
        <div className="mx-5 mt-4 flex items-center gap-3 rounded-[18px] bg-ai p-3 text-[13px] text-ai-ink">
          <AiTile size={34} radius={10} />
          <p className="flex-1"><b>AI solved this at {clock(conv.solvedBy.at)}.</b> Answered from your Fall promo rules. If {p.name.split(" ")[0]} writes back, this moves to Open.</p>
          <button className="btn-secondary" onClick={() => inboxStore.reopen(conv.id)}>Reopen</button>
        </div>
      )}
      <div className="flex max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto p-5">
        {blocks.map((b) => <Block key={b.key} b={b} conv={conv} contact={p} />)}
        <div ref={end} />
      </div>
      <Composer ref={composerRef} conv={conv} contact={p} />
    </section>
  );
}

function Block({ b, conv, contact }: { b: RenderBlock; conv: Conversation; contact: Contact }) {
  if (b.kind === "date") return <div className="flex items-center gap-3 text-[11px] font-bold text-ink-2">{b.label}<span className="h-px flex-1 bg-hairline" /></div>;
  if (b.kind === "activities") return <ActivityGroup items={b.items} />;
  if (b.kind === "handoff") return (
    <div className="flex items-center gap-2 rounded-xl bg-ai px-3 py-2.5 text-[13px] text-ai-ink"><AiTile size={24} radius={7} icon={13} /><span><b>AI handed this to you.</b> {b.item.reason}</span></div>
  );
  const m = b.item;
  const isAi = m.from === "ai", isUser = m.from === "user";
  const name = isAi ? "AI reply" : isUser ? m.authorName ?? "You" : contact.name;
  return (
    <div className="flex gap-3">
      {isAi ? <AiTile /> : <Avatar initials={isUser ? "AM" : contact.initials} size={32} dark={isUser} />}
      <div className="min-w-0">
        <div className="mb-1 flex items-baseline gap-2"><span className="text-[13px] font-bold">{name}</span><span className="text-xs text-ink-2">{m.channel === "sms" ? "SMS" : "Email"} · {clock(m.at)}</span></div>
        <div className={`max-w-[560px] whitespace-pre-wrap rounded-[4px_16px_16px_16px] px-3.5 py-[11px] text-sm ${isAi ? "bg-ai" : isUser ? "bg-card shadow-[inset_0_0_0_1px_var(--outline)]" : "bg-page"}`}>
          <RichText text={m.text} />
          {m.attachments?.map((a) => <div key={a.name} className="mt-2 flex items-center gap-2 text-xs font-semibold"><QrCode size={16} className="text-brand" />{a.name}</div>)}
        </div>
        {m.failed && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-danger">
            <AlertCircle size={14} />Not delivered · {m.failed.reason} ·
            <button className="text-brand underline" onClick={() => inboxStore.retry(conv.id, b.index)}>Retry</button> or
            <button className="text-brand underline" onClick={() => inboxStore.retry(conv.id, b.index, "email")}>Send by email</button>
          </div>
        )}
      </div>
    </div>
  );
}

const typeLabel = { email: "EMAIL", sms: "SMS", signup: "SIGNUP", reward: "REWARD", customer: "CUSTOMER" } as const;
function ActivityGroup({ items }: { items: Extract<Conversation["items"][number], { kind: "activity" }>[] }) {
  const [open, setOpen] = useState(false);
  const n = items.length;
  const summary = items.map((i) => (i.type === "signup" ? `${i.detail.split(" ")[0]} signed up` : i.title)).join(", ");
  return (
    <div className="rounded-xl bg-act px-3 py-[9px] text-xs">
      <div className="flex items-center gap-2">
        <Clock size={14} className="shrink-0 text-act-ink" />
        <p className="min-w-0 flex-1 truncate text-ink-2"><b className="text-act-ink">{n} {n === 1 ? "activity" : "activities"}</b> · {summary}</p>
        <button onClick={() => setOpen(!open)} className="font-bold text-act-ink">{open ? "Hide" : "Show"}</button>
      </div>
      {open && (
        <ul className="mt-2 flex flex-col gap-1.5 pl-9">
          {items.map((i, k) => (
            <li key={k} className="flex items-center gap-2">
              <span className="min-w-[52px] rounded-full bg-act-pill px-1.5 py-0.5 text-center text-[9px] font-bold text-act-ink">{typeLabel[i.type]}</span>
              <span className="min-w-0 flex-1 truncate"><b className="font-semibold text-ink">{i.title}</b> <span className="text-ink-2">{i.detail}</span></span>
              <span className="text-[11px] text-ink-2">{dayLabel(i.at) === "Today" ? clock(i.at) : dayLabel(i.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type ComposerHandle = { insert: (text: string) => void; attach: (a: { name: string; url: string }) => void };
const activeComposer: { current: ComposerHandle | null } = { current: null };

const Composer = forwardRef<ComposerHandle, { conv: Conversation; contact: Contact }>(function Composer({ conv, contact }, ref) {
  const [channel, setChannel] = useState<Channel>(contact.phone && !contact.smsOptedOut ? "sms" : "email");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState(`Re: ${conv.subject}`);
  const [att, setAtt] = useState<{ name: string; url: string }[]>([]);
  const ta = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({
    insert: (s) => {
      const el = ta.current; const start = el?.selectionStart ?? text.length; const endp = el?.selectionEnd ?? text.length;
      const next = text.slice(0, start) + s + text.slice(endp); setText(next);
      requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + s.length, start + s.length); });
    },
    attach: (a) => setAtt((x) => (x.some((y) => y.name === a.name) ? x : [...x, a])),
  }), [text]);
  useEffect(() => { const el = ta.current; if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }, [text]);
  const send = () => { if (!text.trim() && !att.length) return; inboxStore.send(conv.id, channel, text.trim(), att.length ? att : undefined); setText(""); setAtt([]); };
  const first = contact.name.split(" ")[0];
  return (
    <div className="m-5 mt-0 flex flex-col gap-2.5 rounded-[18px] bg-page p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {(["sms", "email"] as const).map((ch) => {
            const disabled = ch === "sms" && (!contact.phone || contact.smsOptedOut);
            return <button key={ch} disabled={disabled} onClick={() => setChannel(ch)} title={disabled ? (contact.smsOptedOut ? "Opted out of SMS" : "No phone on file") : undefined} className={`h-8 rounded-full px-4 text-[13px] font-medium disabled:opacity-40 ${channel === ch ? "bg-dark text-primary-foreground" : "bg-card text-ink"}`}>{ch === "sms" ? "SMS" : "Email"}</button>;
          })}
        </div>
        <span className="truncate text-[11px] text-ink-2">{channel === "sms" ? `Texting ${contact.phone}` : `Emailing ${contact.email}`}</span>
      </div>
      {contact.smsOptedOut && <p className="text-[11px] text-danger">Opted out of SMS · email only</p>}
      <div className="rounded-xl bg-card px-3.5 py-3">
        {channel === "email" && (
          <div className="mb-2 flex items-center gap-2 border-b border-hairline pb-2 text-[13px] font-semibold">
            <span className="text-ink-2">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 bg-transparent outline-none" />
          </div>
        )}
        <textarea ref={ta} rows={2} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }} placeholder={`Write a message to ${first}...`} className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-ink-2" />
        {att.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {att.map((a) => (
              <span key={a.name} className="flex items-center gap-2 rounded-[10px] bg-page p-1 pr-2 text-xs font-semibold">
                <span className="flex size-[30px] items-center justify-center rounded-md bg-card"><QrCode size={18} /></span>{a.name}
                <button aria-label={`Remove ${a.name}`} onClick={() => setAtt((x) => x.filter((y) => y !== a))} className="text-ink-2"><X size={14} /></button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end"><button className="btn-primary" onClick={send}>Send</button></div>
    </div>
  );
});

function ContactPanel({ contact: p, hiddenOnMobile }: { contact: Contact; hiddenOnMobile: boolean }) {
  const tiles: { label: string; value: ReactNode; green?: boolean }[] = p.type === "advocate"
    ? [{ label: "Referrals", value: p.stats.referrals ?? 0 }, { label: "Revenue", value: money(p.stats.revenue), green: true }, { label: "Pending", value: money(p.stats.pending ?? 0) }, { label: "Paid", value: money(p.stats.paid ?? 0) }]
    : [{ label: "Referred by", value: <a href={`/subscribers/${p.referredBy?.id}`} target="_blank" rel="noreferrer" className="text-brand">{p.referredBy?.name.split(" ")[0]} ↗</a> }, { label: "Revenue", value: money(p.stats.revenue), green: true }, { label: "Signed up", value: <span className="text-sm">{p.stats.signedUp}</span> }, { label: "Source", value: <span className="text-sm">{p.stats.source}</span> }];
  const strip = (u: string) => u.replace(/^https?:\/\//, "");
  return (
    <aside className={`pane min-w-0 flex-col gap-3.5 self-start p-5 md:col-start-2 @min-[1000px]:col-start-3 ${hiddenOnMobile ? "hidden md:flex" : "flex"}`}>
      <div className="flex items-center gap-3">
        <Avatar initials={p.initials} size={44} />
        <div>
          <p className="text-[15px] font-bold">{p.name}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="rounded-full bg-ref px-2 py-0.5 text-[10px] font-bold text-ref-ink">REFERRAL</span>
            {p.referralStatus && <span className="rounded-full bg-ok px-2 py-0.5 text-[10px] font-bold uppercase text-ok-ink">{p.referralStatus}</span>}
          </div>
        </div>
      </div>
      {p.smsOptedOut && <p className="text-xs font-medium text-danger">Opted out of SMS · email only</p>}
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className={`rounded-[14px] px-3 py-2.5 ${t.green ? "bg-ok text-ok-ink" : "bg-page"}`}>
            <p className={`text-[11px] ${t.green ? "" : "text-ink-2"}`}>{t.label}</p>
            <p className="truncate text-lg font-bold">{t.value}</p>
          </div>
        ))}
      </div>
      {p.type === "advocate" && (<>
        <div className="h-px bg-hairline" />
        <ul>
          {p.links.dashboardUrl && <ShareRow icon={LayoutDashboard} label="Advocate dashboard" href={p.links.dashboardUrl} action="Add" onAction={() => activeComposer.current?.insert(strip(p.links.dashboardUrl!))} />}
          {p.links.referralUrl && <ShareRow icon={LinkIcon} label="Referral link" href={p.links.referralUrl} action="Add" onAction={() => activeComposer.current?.insert(strip(p.links.referralUrl!))} />}
          {p.links.qrCodeUrl && <ShareRow icon={QrCode} label="QR code" action="Attach" onAction={() => activeComposer.current?.attach({ name: `${(p.name.split(" ")[0] ?? "").toLowerCase()}-qr.png`, url: p.links.qrCodeUrl! })} />}
        </ul>
      </>)}
      <a href={p.profileUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full"><ExternalLink size={16} />View full profile</a>
    </aside>
  );
}

function ShareRow({ icon: Icon, label, href, action, onAction }: { icon: typeof QrCode; label: string; href?: string; action: string; onAction: () => void }) {
  return (
    <li className="flex items-center gap-2 py-[7px]">
      <Icon size={16} className="text-brand" />
      {href ? <a href={href} target="_blank" rel="noreferrer" className="flex-1 text-[13px] font-semibold hover:underline">{label}</a> : <span className="flex-1 text-[13px] font-semibold">{label}</span>}
      <button className="btn-text" onClick={onAction}>{action}</button>
    </li>
  );
}
