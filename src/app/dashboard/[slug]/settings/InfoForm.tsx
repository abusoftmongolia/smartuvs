"use client";
import { useState } from "react";
import { Field, btnPrimary, selectCls } from "@/components/ui";
import { saveTenantInfo } from "@/server/settings-actions";
import { Panel } from "../../PageHeader";
import { NumInput, useSave } from "./shared";
import type { Info } from "./types";

type NumKey = "minLeadMin" | "maxAdvanceDays" | "cancellationHours";
const NUM_LABEL: Record<NumKey, string> = {
  minLeadMin: "Хамгийн эрт (минутын өмнө)",
  maxAdvanceDays: "Хэдэн хоногийн өмнөөс",
  cancellationHours: "Цуцлах боломж (цагийн өмнө)",
};

export function InfoForm({ slug, info, smsEnabled }: { slug: string; info: Info; smsEnabled: boolean }) {
  const [v, setV] = useState(info);
  // Хоосон тоон талбарууд — 0 болгож хадгалахгүй, анхааруулна
  const [blank, setBlank] = useState<Partial<Record<NumKey, true>>>({});
  const set = <K extends keyof Info>(k: K, x: Info[K]) => setV((cur) => ({ ...cur, [k]: x }));
  const setNum = (k: NumKey, x: number | null) => {
    setBlank((b) => {
      const { [k]: _, ...rest } = b;
      return x == null ? { ...rest, [k]: true } : rest;
    });
    if (x != null) set(k, x);
  };
  const { pending, save, fail, status } = useSave();
  return (
    <Panel id="h-info" title="Байгууллага ба бодлого" subtitle="Нэр, холбоо барих мэдээлэл, онлайн захиалгын дүрэм.">
      <form className="flex flex-col gap-4" onSubmit={(e) => {
        e.preventDefault();
        const missing = (Object.keys(blank) as NumKey[])[0];
        if (missing) return fail(`"${NUM_LABEL[missing]}" талбарыг бөглөнө үү`);
        save(() => saveTenantInfo({ slug, ...v }));
      }}>
        <Field id="i-name" label="Нэр" value={v.name} onChange={(x) => set("name", x)} autoComplete="organization" />
        <Field id="i-addr" label="Хаяг" value={v.address} onChange={(x) => set("address", x)} autoComplete="street-address" />
        <Field id="i-phone" label="Холбогдох утас" type="tel" value={v.phone} onChange={(x) => set("phone", x)} autoComplete="tel" />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Цагийн бүс
          <select className={selectCls} value={v.timezone} onChange={(e) => set("timezone", e.target.value as Info["timezone"])}>
            <option value="Asia/Hovd">Баруун аймгууд — UTC+7</option>
            <option value="Asia/Ulaanbaatar">Улаанбаатар — UTC+8</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Онлайн захиалга
          <select className={selectCls} value={v.approval} onChange={(e) => set("approval", e.target.value as Info["approval"])}>
            <option value="auto">Сул цаг байвал шууд баталгаажна</option>
            <option value="manual">Ажилтан батлах хүртэл хүлээнэ</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Цагийн алхам
            <select className={selectCls} value={v.slotStepMin} onChange={(e) => set("slotStepMin", Number(e.target.value))}>
              {[5, 10, 15, 20, 30, 60].map((n) => <option key={n} value={n}>{n} минут</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {NUM_LABEL.minLeadMin}
            <NumInput min={0} value={v.minLeadMin} onChange={(x) => setNum("minLeadMin", x)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {NUM_LABEL.maxAdvanceDays}
            <NumInput min={1} max={365} value={v.maxAdvanceDays} onChange={(x) => setNum("maxAdvanceDays", x)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {NUM_LABEL.cancellationHours}
            <NumInput min={0} max={168} value={v.cancellationHours} onChange={(x) => setNum("cancellationHours", x)} />
          </label>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={v.listed} onChange={(e) => set("listed", e.target.checked)} className="size-5 accent-brand" />
          tsag.smartuvs.mn нүүр хуудасны жагсаалтад харагдах
        </label>
        {smsEnabled && <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={v.notifyNewBookings} onChange={(e) => set("notifyNewBookings", e.target.checked)} className="size-5 accent-brand" />
          <span>Шинэ захиалга орох бүрт SMS авах <span className="block text-xs font-normal text-muted">Дээрх утас руу, мөн захиалсан ажилтан системд бүртгэлтэй бол түүн рүү</span></span>
        </label>}
        {status}
        <button disabled={pending} className={`${btnPrimary} self-start`}>{pending ? "Хадгалж байна…" : "Хадгалах"}</button>
      </form>
    </Panel>
  );
}
