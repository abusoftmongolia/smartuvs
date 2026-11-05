"use client";
/** Админы client хэсгүүд: байгууллагын үйлдлийн товч, дэд системийн унтраалга. */
import { useState, useTransition } from "react";
import { availableActions, type AdminTenantAction } from "@/lib/tenant-status";
import { setMaintenance, tenantAction } from "@/server/admin-actions";

const LABEL: Record<AdminTenantAction, string> = { approve: "Батлах", reject: "Татгалзах", suspend: "Хаах", activate: "Нээх" };
const CONFIRM: Partial<Record<AdminTenantAction, (n: string) => string>> = {
  reject: (n) => `"${n}"-ийн бүртгэлээс татгалзах уу? Эзэмшигчид SMS очно.`,
  suspend: (n) => `"${n}"-г хаах уу? Захиалгын хуудас нь нийтэд нээгдэхээ болино.`,
};

export function TenantActions({ id, name, status }: { id: string; name: string; status: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Татгалзах/Хаах эхэнд, Батлах/Нээх (гол үйлдэл) баруун талд
  const actions = availableActions(status).sort((a) => (a === "approve" || a === "activate" ? 1 : -1));
  const run = (a: AdminTenantAction) => {
    const c = CONFIRM[a];
    if (c && !confirm(c(name))) return;
    start(async () => {
      setError(null);
      const r = await tenantAction({ tenantId: id, action: a });
      if (!r.ok) setError(r.message);
    });
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {actions.map((a) => {
          const primary = a === "approve" || a === "activate";
          return (
            <button key={a} disabled={pending} onClick={() => run(a)}
              className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-extrabold disabled:opacity-50 ${primary ? "bg-ink text-white" : "border-[1.5px] border-line bg-white text-ink"}`}>
              {LABEL[a]}
            </button>
          );
        })}
      </div>
      {error && <span role="alert" className="text-xs font-semibold text-red-800">{error}</span>}
    </div>
  );
}

export function SystemToggle({ on, label }: { on: boolean; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={`${label}: ${on ? "идэвхтэй" : "засвартай"}`}
      disabled={pending}
      onClick={() => {
        if (on && !confirm(`${label}-ыг засварын горимд оруулах уу? Захиалгын хуудас "Засвартай" гэж харагдана.`)) return;
        start(async () => { await setMaintenance({ system: "tsag", on }); });
      }}
      className={`relative inline-flex h-11 w-[76px] flex-none items-center rounded-full p-1 transition-colors disabled:opacity-60 ${on ? "bg-ink" : "bg-line"}`}
    >
      <span className={`size-9 rounded-full shadow transition-transform ${on ? "translate-x-8 bg-brand" : "translate-x-0 bg-white"}`} />
    </button>
  );
}

/** Холбогдоогүй/хөгжүүлэлтэд байгаа системийн идэвхгүй унтраалга */
export function DisabledToggle({ label }: { label: string }) {
  return (
    <span role="switch" aria-checked={false} aria-disabled aria-label={`${label}: холбогдоогүй`}
      className="relative inline-flex h-11 w-[76px] flex-none items-center rounded-full bg-line p-1 opacity-70">
      <span className="size-9 rounded-full bg-white shadow" />
    </span>
  );
}
