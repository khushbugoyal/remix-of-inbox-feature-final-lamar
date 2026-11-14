import { useSyncExternalStore } from "react";
import { initialConversations, ME, type Conversation, type ThreadItem, type Channel } from "./inbox";

type State = { conversations: Conversation[]; aiEnabled: boolean };
let state: State = { conversations: initialConversations, aiEnabled: true };
const subs = new Set<() => void>();
const set = (fn: (s: State) => State) => { state = fn(state); subs.forEach((f) => f()); };
const patch = (id: string, fn: (c: Conversation) => Conversation) =>
  set((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)) }));

export const inboxStore = {
  subscribe: (f: () => void) => { subs.add(f); return () => subs.delete(f); },
  get: () => state,
  setAi: (on: boolean) => set((s) => ({ ...s, aiEnabled: on })),
  markRead: (id: string) => patch(id, (c) => (c.unread ? { ...c, unread: false } : c)),
  markSolved: (id: string) => patch(id, (c) => ({ ...c, status: "solved", unread: false, solvedBy: { kind: "user", name: ME } })),
  reopen: (id: string) => patch(id, (c) => ({ ...c, status: "open", solvedBy: undefined })),
  send: (id: string, channel: Channel, text: string, attachments?: { name: string; url: string }[]) => {
    const at = new Date().toISOString();
    const item: ThreadItem = { kind: "message", from: "user", authorName: ME, channel, text, at, attachments };
    patch(id, (c) => ({ ...c, status: "open", solvedBy: undefined, lastMessageAt: at, items: [...c.items, item] }));
  },
  retry: (id: string, index: number, channel?: Channel) =>
    patch(id, (c) => ({ ...c, items: c.items.map((it, i) => (i === index && it.kind === "message" ? { ...it, failed: undefined, channel: channel ?? it.channel } : it)) })),
  /** A new message from the contact: solved conversations reopen as unread. */
  receive: (id: string, text: string, channel: Channel = "sms") => {
    const at = new Date().toISOString();
    patch(id, (c) => ({ ...c, status: "open", unread: true, solvedBy: undefined, lastMessageAt: at, items: [...c.items, { kind: "message", from: "contact", channel, text, at }] }));
  },
  startNew: (contactId: string, channel: Channel, text: string) => {
    const existing = state.conversations.find((c) => c.contactId === contactId);
    if (existing) { inboxStore.send(existing.id, channel, text); return existing.id; }
    const id = `c-${contactId}-${Date.now()}`;
    const at = new Date().toISOString();
    set((s) => ({ ...s, conversations: [{ id, contactId, status: "open", subject: "New message", unread: false, lastMessageAt: at, items: [{ kind: "message", from: "user", authorName: ME, channel, text, at }] }, ...s.conversations] }));
    return id;
  },
  reset: () => set(() => ({ conversations: initialConversations, aiEnabled: true })),
};

export const useInbox = () => useSyncExternalStore(inboxStore.subscribe, inboxStore.get, inboxStore.get);
export const unreadOpenCount = (s: State) => s.conversations.filter((c) => c.status === "open" && c.unread).length;
