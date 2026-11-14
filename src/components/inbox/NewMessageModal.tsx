import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { contacts, FROM_NUMBER, type Channel, type Contact } from "@/data/inbox";
import { inboxStore } from "@/data/inbox-store";
import { Avatar } from "./parts";

export function NewMessageModal({ onClose, onSent }: { onClose: () => void; onSent: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [to, setTo] = useState<Contact | null>(null);
  const [channel, setChannel] = useState<Channel>("sms");
  const [text, setText] = useState("");
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? contacts.filter((c) => [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(s))) : [];
  }, [q]);
  const smsOk = !!to?.phone && !to?.smsOptedOut;
  const pick = (c: Contact) => { setTo(c); setQ(c.name); if (!c.phone || c.smsOptedOut) setChannel("email"); };
  const send = () => { if (!to || !text.trim()) return; onSent(inboxStore.startNew(to.id, channel, text.trim())); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4" onClick={onClose}>
      <div role="dialog" aria-label="New message" onClick={(e) => e.stopPropagation()} className="w-full max-w-[600px] rounded-[24px] bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">New message</h2>
          <button aria-label="Close" onClick={onClose} className="flex size-[34px] items-center justify-center rounded-[10px] bg-page"><X size={18} /></button>
        </div>
        <p className="mt-5 text-[11px] text-ink-2">To:</p>
        <div className="relative mt-1">
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setTo(null); }} placeholder="Search advocates and referred leads" className="h-11 w-full rounded-xl bg-page px-3 text-sm outline-none focus:shadow-[inset_0_0_0_1.5px_var(--brand)]" />
          {!to && matches.length > 0 && (
            <ul className="absolute inset-x-0 top-12 z-10 max-h-64 overflow-auto rounded-xl bg-card p-1 shadow-xl">
              {matches.map((c) => (
                <li key={c.id}><button onClick={() => pick(c)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-sel">
                  <Avatar initials={c.initials} size={32} />
                  <div className="min-w-0"><p className="text-sm font-semibold">{c.name}</p>
                    <p className={`truncate text-xs ${c.smsOptedOut ? "text-danger" : "text-ink-2"}`}>{c.smsOptedOut ? "Opted out of SMS · email only" : `${c.email} · ${c.phone ?? "no phone on file"}`}</p></div>
                </button></li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2">
            {(["sms", "email"] as const).map((ch) => (
              <button key={ch} disabled={ch === "sms" && to !== null && !smsOk} onClick={() => setChannel(ch)} className={`h-8 rounded-full px-4 text-[13px] font-medium disabled:opacity-40 ${channel === ch ? "bg-dark text-primary-foreground" : "bg-page text-ink"}`}>{ch === "sms" ? "SMS" : "Email"}</button>
            ))}
          </div>
          <span className="text-[11px] text-ink-2">From {FROM_NUMBER}</span>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={to ? `Write a message to ${to.name.split(" ")[0]}...` : "Write a message..."} className="mt-3 min-h-[110px] w-full resize-none rounded-[14px] bg-page p-3 text-sm outline-none" />
        <div className="mt-4 flex items-center justify-end gap-2">
          <div className="flex gap-2"><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={send}>Send</button></div>
        </div>
      </div>
    </div>
  );
}
