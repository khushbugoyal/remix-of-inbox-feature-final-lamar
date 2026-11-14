import { Link } from "@tanstack/react-router";
import { Inbox, Users, Megaphone, Gift, Settings, Bell } from "lucide-react";
import { type ReactNode } from "react";
import { useInbox, unreadOpenCount } from "@/data/inbox-store";

const nav = [
  { to: "/inbox", label: "Inbox", icon: Inbox, count: true },
] as const;
const rest = [{ label: "Subscribers", icon: Users }, { label: "Campaigns", icon: Megaphone }, { label: "Rewards", icon: Gift }, { label: "Settings", icon: Settings }];

export function AppShell({ children }: { children: ReactNode }) {
  const s = useInbox();
  const unread = unreadOpenCount(s);
  return (
    <div className="flex min-h-screen bg-page text-ink">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 px-4 py-6 md:flex">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="group flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm text-ink-2 data-[status=active]:font-bold data-[status=active]:text-ink">
            {({ isActive }) => (<>
              <span className={`relative flex size-8 shrink-0 items-center justify-center rounded-[10px] ${isActive ? "bg-brand text-primary-foreground" : "text-ink-2"}`}><n.icon size={18} strokeWidth={1.8} /></span>
              <span className="flex-1">{n.label}</span>
              {"count" in n && unread > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{unread}</span>}
            </>)}
          </Link>
        ))}
        {rest.map((n) => (
          <span key={n.label} className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm text-ink-2"><span className="flex size-8 shrink-0 items-center justify-center"><n.icon size={18} strokeWidth={1.8} /></span><span>{n.label}</span></span>
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3"><Bell size={18} className="text-ink-2" /><span className="flex size-9 items-center justify-center rounded-full bg-dark text-xs font-semibold text-primary-foreground">AM</span></div>
        </header>
        {children}
      </div>
    </div>
  );
}
