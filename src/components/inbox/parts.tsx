import { Sparkles } from "lucide-react";

export function Avatar({ initials, size = 40, dark = false }: { initials: string; size?: number; dark?: boolean }) {
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.34 }} className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${dark ? "bg-dark text-primary-foreground" : "bg-sel text-dark"}`}>{initials}</span>
  );
}

export function AiTile({ size = 32, radius = 10, icon = 16 }: { size?: number; radius?: number; icon?: number }) {
  return <span style={{ width: size, height: size, borderRadius: radius }} className="ai-tile shrink-0"><Sparkles size={icon} strokeWidth={2} className="text-ai-icon" /></span>;
}

const URL_RE = /(https?:\/\/[^\s]+|summithome\.com\/[^\s]+)/g;
export function RichText({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return <>{parts.map((p, i) => (i % 2 ? <a key={i} href={p.startsWith("http") ? p : `https://${p}`} target="_blank" rel="noreferrer" className="text-brand underline-offset-2 hover:underline">{p.replace(/^https?:\/\//, "")}</a> : p))}</>;
}
