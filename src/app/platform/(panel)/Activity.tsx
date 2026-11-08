/** Сүүлийн үйл ажиллагаа (audit_logs) — платформ болон системийн самбарт */
import { ago } from "./fmt";
import { Panel } from "./dash";

const TEXT: Record<string, (a: { tenantName: string | null; actorName: string | null }) => string> = {
  "tenant.create": (a) => `Шинэ байгууллага бүртгэл илгээв — ${a.tenantName ?? "?"}`,
  signup: (a) => `Шинэ хэрэглэгч бүртгүүлэв — ${a.actorName ?? "?"}`,
  "tenant.approve": (a) => `${a.tenantName ?? "?"} батлагдав`,
  "tenant.reject": (a) => `${a.tenantName ?? "?"}-ийн бүртгэлээс татгалзав`,
  "tenant.suspend": (a) => `${a.tenantName ?? "?"} хаагдав`,
  "tenant.activate": (a) => `${a.tenantName ?? "?"} дахин нээгдэв`,
  "maintenance.on": () => "Цаг захиалга засварын горимд орлоо",
  "maintenance.off": () => "Цаг захиалга засвараас гарлаа",
  "content.industries": (a) => `Ангилал (салбарууд) шинэчлэгдэв — ${a.actorName ?? "?"}`,
  "content.tiles": (a) => `Нүүрний ангиллын хавтан шинэчлэгдэв — ${a.actorName ?? "?"}`,
  "content.menu": (a) => `Үндсэн цэс шинэчлэгдэв — ${a.actorName ?? "?"}`,
};

export function ActivityPanel({ items }: { items: { action: string; at: Date; tenantName: string | null; actorName: string | null }[] }) {
  return (
    <Panel id="h-activity" title="Сүүлийн үйл ажиллагаа">
      {items.length === 0 ? (
        <p className="text-muted">Одоогоор үйл ажиллагаа алга.</p>
      ) : (
        <ul>
          {items.map((a, i) => (
            <li key={i} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
              <span aria-hidden className="size-2 flex-none rounded-full bg-ink" />
              <span className="min-w-0 flex-1 text-sm sm:text-base">{TEXT[a.action]?.(a) ?? a.action}</span>
              <span className="whitespace-nowrap text-xs text-muted sm:text-sm">{ago(a.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
