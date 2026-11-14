import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { InboxPage } from "@/components/inbox/Inbox";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox · Summit Home Referrals" },
      { name: "description", content: "Read and reply to SMS and email conversations with your advocates and referred leads." },
      { property: "og:title", content: "Inbox · Summit Home Referrals" },
      { property: "og:description", content: "Read and reply to SMS and email conversations with your advocates and referred leads." },
    ],
  }),
  component: () => <AppShell><InboxPage /></AppShell>,
});
