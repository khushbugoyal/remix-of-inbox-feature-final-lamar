export type Channel = "sms" | "email";
export type ConversationStatus = "open" | "solved";

export interface Contact {
  id: string;
  name: string;
  initials: string;
  phone?: string;
  email?: string;
  type: "advocate" | "lead";
  referralStatus?: string;
  referredBy?: { id: string; name: string };
  stats: { referrals?: number; revenue: number; pending?: number; paid?: number; signedUp?: string; source?: string };
  links: { dashboardUrl?: string; referralUrl?: string; qrCodeUrl?: string };
  smsOptedOut?: boolean;
  profileUrl: string;
}

export type ThreadItem =
  | { kind: "message"; from: "contact" | "user" | "ai"; authorName?: string; channel: Channel; text: string; at: string; attachments?: { name: string; url: string }[] | undefined; failed?: { reason: string } | undefined }
  | { kind: "activity"; type: "email" | "sms" | "signup" | "reward" | "customer"; title: string; detail: string; at: string }
  | { kind: "handoff"; reason: string; at: string };

export interface Conversation {
  id: string;
  contactId: string;
  status: ConversationStatus;
  subject: string;
  solvedBy?: { kind: "ai"; at: string } | { kind: "user"; name: string } | undefined;
  aiHandedOff?: { reason: string };
  unread: boolean;
  lastMessageAt: string;
  items: ThreadItem[];
}

export const NOW = new Date("2026-11-10T15:30:00");
export const ME = "Alex M.";
export const FROM_NUMBER = "+1 (555) 201-4410";

const c = (id: string, name: string, rest: { [K in keyof Contact]?: Contact[K] | undefined }): Contact => {
  const [f = "", l = ""] = name.toLowerCase().split(" ");
  const slug = `${f}-${l.charAt(0)}`;
  const out = {
    id, name, initials: name.split(" ").map((p) => p[0]).join(""), type: "advocate",
    email: `${slug.replace("-", ".")}@example.com`, phone: "+1 (555) 318-2207",
    stats: { referrals: 0, revenue: 0, pending: 0, paid: 0 },
    links: { dashboardUrl: `https://summithome.com/a/${slug}`, referralUrl: `https://summithome.com/r/${slug}`, qrCodeUrl: "/favicon.ico" },
    profileUrl: `/subscribers/${id}`, ...rest,
  } as Contact;
  if ("phone" in rest && rest.phone === undefined) delete out.phone;
  return out;
};

export const contacts: Contact[] = [
  c("marcus", "Marcus Bell", { email: "marcus.bell@gmail.com", stats: { referrals: 4, revenue: 6480, pending: 50, paid: 150 } }),
  c("dana", "Dana Whitfield", { type: "lead", phone: "+1 (555) 402-1180", referralStatus: "Active customer", referredBy: { id: "marcus", name: "Marcus Bell" }, stats: { revenue: 2400, signedUp: "Nov 3, 2026", source: "Referral link" }, links: {} }),
  c("priya", "Priya Shah", { phone: "+1 (555) 610-3321", stats: { referrals: 2, revenue: 3100, pending: 25, paid: 50 } }),
  c("kevin", "Kevin Moore", { type: "lead", phone: undefined, referralStatus: "Estimate booked", referredBy: { id: "tom", name: "Tom Alvarez" }, stats: { revenue: 0, signedUp: "Nov 10, 2026", source: "Referral link" }, links: {} }),
  c("rachel", "Rachel Kim", { phone: "+1 (555) 775-0042", smsOptedOut: true, stats: { referrals: 3, revenue: 4200, pending: 0, paid: 75 } }),
  c("luis", "Luis Ortega", { phone: "+1 (555) 233-9087", stats: { referrals: 1, revenue: 1200, pending: 25, paid: 0 } }),
  c("jenna", "Jenna Cole", { phone: "+1 (555) 980-1123", stats: { referrals: 1, revenue: 1950, pending: 0, paid: 25 } }),
  c("tom", "Tom Alvarez", { phone: "+1 (555) 340-7765", stats: { referrals: 5, revenue: 8900, pending: 50, paid: 200 } }),
  c("felix", "Felix Moreau", { phone: "+1 (555) 120-4400", stats: { referrals: 2, revenue: 2750, pending: 0, paid: 50 } }),
];

const msg = (from: "contact" | "user" | "ai", text: string, at: string, channel: Channel = "sms", extra: Partial<Extract<ThreadItem, { kind: "message" }>> = {}): ThreadItem => ({ kind: "message", from, text, at, channel, ...extra });
const act = (type: Extract<ThreadItem, { kind: "activity" }>["type"], title: string, detail: string, at: string): ThreadItem => ({ kind: "activity", type, title, detail, at });

const simple = (id: string, contactId: string, status: ConversationStatus, subject: string, text: string, at: string, extra: Partial<Conversation> = {}, more: ThreadItem[] = []): Conversation => ({
  id, contactId, status, subject, unread: false, lastMessageAt: at,
  items: [act("email", "Welcome email", "Automated · Opened", "2026-11-01T09:00:00"), msg("contact", text, at), ...more],
  ...extra,
});

export const initialConversations: Conversation[] = [
  {
    id: "c-marcus", contactId: "marcus", status: "open", subject: "My $50 gift card", unread: true,
    aiHandedOff: { reason: "Marcus asked about a custom bonus, which needs a person." },
    lastMessageAt: "2026-11-10T12:05:00",
    items: [
      act("email", "Welcome email", "Automated · Opened · Clicked", "2026-11-02T09:00:00"),
      act("signup", "Referral signed up", "Dana Whitfield", "2026-11-03T14:20:00"),
      act("sms", "Thanks-for-referring SMS", "Automated · Delivered", "2026-11-03T14:21:00"),
      act("reward", "Reward unlocked", "$50", "2026-11-10T09:15:00"),
      msg("contact", "Hey! My neighbor Dana signed up with my link last week. When does my $50 gift card come?", "2026-11-10T10:42:00"),
      msg("ai", "Hi Marcus! Your $50 reward was approved today. The gift card will arrive by email within 24 hours.", "2026-11-10T10:42:30"),
      act("reward", "Reward sent", "$50.00 Amazon gift card · email opened", "2026-11-10T10:43:00"),
      msg("contact", "Got it, thanks! My other neighbor wants a quote too. Can I talk to someone about a bigger bonus if I keep sending people?", "2026-11-10T10:51:00"),
      { kind: "handoff", reason: "Marcus asked about a custom bonus, which needs a person.", at: "2026-11-10T10:51:30" },
      act("signup", "Referral signed up", "Kevin Moore", "2026-11-10T11:30:00"),
      act("email", "\u201cYou're in the top 5 this month\u201d email", "Automated · Opened", "2026-11-10T12:05:00"),
    ],
  },
  simple("c-dana", "dana", "open", "Referred customer discount", "Do I get a discount as a referred customer?", "2026-11-10T11:58:00", { unread: true }),
  simple("c-priya", "priya", "open", "My referral link isn't working", "Re: My referral link isn't working", "2026-11-10T09:30:00", { unread: true }, [
    msg("user", "Sorry about that, Priya! Here's a fresh link: https://summithome.com/r/priya-s", "2026-11-10T09:40:00", "sms", { authorName: ME, failed: { reason: "Carrier rejected" } }),
  ]),
  simple("c-kevin", "kevin", "open", "Estimate tomorrow", "What time is my estimate tomorrow?", "2026-11-10T08:15:00", { unread: true }),
  simple("c-rachel", "rachel", "open", "Referring a business", "Can I refer a business instead?", "2026-11-09T16:20:00", {}, []),
  simple("c-luis", "luis", "open", "Who to ask for", "Who should my friend ask for?", "2026-11-08T13:05:00"),
  simple("c-jenna", "jenna", "solved", "Double-reward week", "Does double-reward week stack with my bonus?", "2026-11-09T15:10:00", { solvedBy: { kind: "ai", at: "2026-11-09T15:12:00" } }, [
    msg("ai", "Great question, Jenna! Yes — during double-reward week your referral bonus doubles, and it stacks with any bonus you've already unlocked.", "2026-11-09T15:12:00"),
  ]),
  simple("c-tom", "tom", "solved", "Gift card timing", "When will my gift card arrive?", "2026-11-07T10:00:00", { solvedBy: { kind: "ai", at: "2026-11-07T10:01:00" } }, [
    msg("ai", "Hi Tom! Gift cards are emailed within 24 hours of approval. Yours was sent this morning.", "2026-11-07T10:01:00"),
  ]),
  simple("c-felix", "felix", "solved", "Reward email", "I never got my reward email.", "2026-11-05T11:00:00", { solvedBy: { kind: "user", name: "Alex M." } }, [
    msg("user", "Resent the reward email — check your inbox!", "2026-11-05T11:20:00", "email", { authorName: ME }),
  ]),
];

export function snippet(conv: Conversation): string {
  const m = [...conv.items].reverse().find((i) => i.kind === "message");
  return m && m.kind === "message" ? m.text : "";
}

export function relTime(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((NOW.getTime() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  if (mins < 60 * 24 && d.getDate() === NOW.getDate()) return `${Math.round(mins / 60)}h`;
  const days = Math.round(mins / 1440);
  if (days <= 1) return "Yesterday";
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (d.toDateString() === NOW.toDateString()) return "Today";
  const y = new Date(NOW); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export type RenderBlock =
  | { kind: "date"; label: string; key: string }
  | { kind: "activities"; items: Extract<ThreadItem, { kind: "activity" }>[]; key: string }
  | { kind: "message"; item: Extract<ThreadItem, { kind: "message" }>; index: number; key: string }
  | { kind: "handoff"; item: Extract<ThreadItem, { kind: "handoff" }>; key: string };

/** Groups consecutive activities into one block; adds a date line when the day changes (only before messages). */
export function buildBlocks(items: ThreadItem[]): RenderBlock[] {
  const out: RenderBlock[] = [];
  let lastDay = "";
  items.forEach((it, i) => {
    if (it.kind === "activity") {
      const prev = out[out.length - 1];
      if (prev && prev.kind === "activities") prev.items.push(it);
      else out.push({ kind: "activities", items: [it], key: `a${i}` });
      return;
    }
    const day = new Date(it.at).toDateString();
    if (day !== lastDay) { out.push({ kind: "date", label: dayLabel(it.at), key: `d${i}` }); lastDay = day; }
    if (it.kind === "message") out.push({ kind: "message", item: it, index: i, key: `m${i}` });
    else out.push({ kind: "handoff", item: it, key: `h${i}` });
  });
  return out;
}

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
