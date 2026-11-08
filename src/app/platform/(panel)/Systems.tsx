/** Дэд системүүдийн карт — Тойм болон /admin/systems хуудсанд */
import Link from "next/link";
import { DisabledToggle, SystemToggle } from "./parts";

export function SystemsCard({ tsagMaintenance }: { tsagMaintenance: boolean }) {
  const rows = [
    { key: "tsag", name: "Цаг захиалга", host: "tsag.smartuvs.mn", state: tsagMaintenance ? "Засвартай" : "Идэвхтэй", live: !tsagMaintenance, control: <SystemToggle on={!tsagMaintenance} label="Цаг захиалга" /> },
    { key: "chat", name: "Ухаалаг туслах", host: "chat.smartuvs.mn", state: "Холбогдоогүй", live: false, control: <DisabledToggle label="Ухаалаг туслах" /> },
    { key: "ajil", name: "Цагийн ажил", host: "ajil.smartuvs.mn", state: "Хөгжүүлэлтэд", live: false, control: <DisabledToggle label="Цагийн ажил" /> },
  ];
  return (
    <section aria-labelledby="h-systems" className="flex flex-col gap-4 rounded-[22px] border border-line bg-white p-6">
      <h2 id="h-systems" className="text-xl font-bold">Дэд системүүд</h2>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3 rounded-2xl bg-ground p-4">
            <span aria-hidden className={`size-2.5 flex-none rounded-full ${r.live ? "bg-green-600" : "bg-muted/60"}`} />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{r.name}</div>
              <div className="truncate text-sm text-muted">{r.host} · {r.state}</div>
            </div>
            {r.key === "tsag" && (
              <Link href="/tsag" className="inline-flex min-h-11 flex-none items-center rounded-xl bg-ink px-3 text-sm font-semibold text-white">Удирдах →</Link>
            )}
            {r.control}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">Системийг унтраавал порталд «Засвартай» гэж харагдана.</p>
    </section>
  );
}
