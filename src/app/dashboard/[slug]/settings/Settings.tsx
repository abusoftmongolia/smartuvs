"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { HoursEditor } from "@/components/HoursEditor";
import { QrCode } from "@/components/QrCode";
import { TenantLogo } from "@/components/TenantLogo";
import { ErrorBox, Field, btnPrimary, btnSecondary } from "@/components/ui";
import type { DayHours } from "@/lib/hours";
import { Panel } from "../../PageHeader";
import {
  addTimeOff,
  removeLogo,
  removeTimeOff,
  saveLogo,
  saveHours,
  saveOwner,
  saveService,
  saveTenantInfo,
  type SettingsResult,
} from "@/server/settings-actions";

export type Info = {
  name: string;
  address: string;
  phone: string;
  timezone: "Asia/Hovd" | "Asia/Ulaanbaatar";
  approval: "auto" | "manual";
  cancellationHours: number;
  slotStepMin: number;
  minLeadMin: number;
  maxAdvanceDays: number;
  listed: boolean;
  notifyNewBookings: boolean;
};
export type Svc = { id?: string; name: string; durationMin: number; bufferMin: number; price: number | null; active: boolean };
export type Owner = { id?: string; name: string; title: string; active: boolean };
export type Off = { id: string; from: string; to: string; partial: boolean; owner: string | null; reason: string | null };

const select = "min-h-12 rounded-xl border-[1.5px] border-field bg-white px-3 text-sm font-normal";
const num = "min-h-11 w-full rounded-lg border-[1.5px] border-field px-2.5 text-sm font-normal";

/** Хадгалах товч + алдаа/амжилтын мэдэгдэл */
function useSave() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = (fn: () => Promise<SettingsResult>, okText = "Хадгалагдлаа", after?: () => void) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: okText } : { ok: false, text: r.message });
      if (r.ok) after?.();
    });
  const status = msg && (msg.ok
    ? <p role="status" className="text-sm font-semibold text-green-800">✓ {msg.text}</p>
    : <ErrorBox>{msg.text}</ErrorBox>);
  return { pending, save, status };
}

function Card({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return <Panel id={id} title={title} subtitle={subtitle}>{children}</Panel>;
}

export function Share({ slug, url }: { slug: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const pretty = url.replace(/^https?:\/\//, "");
  return (
    <Card id="h-share" title="Захиалгын холбоос" subtitle="Энэ холбоос, QR кодыг үйлчлүүлэгчиддээ хуваалцана.">
      <div className="flex flex-wrap items-center gap-4">
        <QrCode url={url} size={128} label={`${pretty} хаягийн QR код`} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <a href={url} target="_blank" className="break-all text-lg font-semibold underline">{pretty}</a>
          <div className="flex flex-wrap gap-2">
            <button className={btnSecondary} onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true))}>
              {copied ? "Хуулагдлаа ✓" : "Хуулах"}
            </button>
            <Link href={`/dashboard/${slug}/poster`} className={btnSecondary}>A4 постер</Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function InfoForm({ slug, info }: { slug: string; info: Info }) {
  const [v, setV] = useState(info);
  const set = <K extends keyof Info>(k: K, x: Info[K]) => setV({ ...v, [k]: x });
  const { pending, save, status } = useSave();
  return (
    <Card id="h-info" title="Байгууллага ба бодлого" subtitle="Нэр, холбоо барих мэдээлэл, онлайн захиалгын дүрэм.">
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save(() => saveTenantInfo({ slug, ...v })); }}>
        <Field id="i-name" label="Нэр" value={v.name} onChange={(x) => set("name", x)} />
        <Field id="i-addr" label="Хаяг" value={v.address} onChange={(x) => set("address", x)} />
        <Field id="i-phone" label="Холбогдох утас" type="tel" value={v.phone} onChange={(x) => set("phone", x)} />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Цагийн бүс
          <select className={select} value={v.timezone} onChange={(e) => set("timezone", e.target.value as Info["timezone"])}>
            <option value="Asia/Hovd">Баруун аймгууд — UTC+7</option>
            <option value="Asia/Ulaanbaatar">Улаанбаатар — UTC+8</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Онлайн захиалга
          <select className={select} value={v.approval} onChange={(e) => set("approval", e.target.value as Info["approval"])}>
            <option value="auto">Сул цаг байвал шууд баталгаажна</option>
            <option value="manual">Ажилтан батлах хүртэл хүлээнэ</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Цагийн алхам
            <select className={select} value={v.slotStepMin} onChange={(e) => set("slotStepMin", Number(e.target.value))}>
              {[5, 10, 15, 20, 30, 60].map((n) => <option key={n} value={n}>{n} минут</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Хамгийн эрт (минутын өмнө)
            <input type="number" inputMode="numeric" min={0} className={num} value={v.minLeadMin} onChange={(e) => set("minLeadMin", Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Хэдэн хоногийн өмнөөс
            <input type="number" inputMode="numeric" min={1} max={365} className={num} value={v.maxAdvanceDays} onChange={(e) => set("maxAdvanceDays", Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Цуцлах боломж (цагийн өмнө)
            <input type="number" inputMode="numeric" min={0} max={168} className={num} value={v.cancellationHours} onChange={(e) => set("cancellationHours", Number(e.target.value))} />
          </label>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={v.listed} onChange={(e) => set("listed", e.target.checked)} className="size-5 accent-[#f5a800]" />
          tsag.smartuvs.mn нүүр хуудасны жагсаалтад харагдах
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={v.notifyNewBookings} onChange={(e) => set("notifyNewBookings", e.target.checked)} className="size-5 accent-[#f5a800]" />
          <span>Шинэ захиалга орох бүрт SMS авах <span className="block text-xs font-normal text-muted">Дээрх утас руу, мөн захиалсан ажилтан системд бүртгэлтэй бол түүн рүү</span></span>
        </label>
        {status}
        <button disabled={pending} className={`${btnPrimary} self-start`}>{pending ? "Хадгалж байна…" : "Хадгалах"}</button>
      </form>
    </Card>
  );
}

export function Services({ slug, initial }: { slug: string; initial: Svc[] }) {
  const [list, setList] = useState<Svc[]>(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const { pending, save, status } = useSave();
  const upd = (i: number, patch: Partial<Svc>) => setList(list.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <Card id="h-svc" title="Үйлчилгээ">
      <ul className="flex flex-col gap-2">
        {list.map((s, i) => (
          <li key={s.id ?? `new-${i}`} className={`flex flex-col gap-2 rounded-xl border border-line p-3 ${s.active ? "" : "opacity-60"}`}>
            {editing === i ? (
              <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
                e.preventDefault();
                save(() => saveService({ slug, ...s }), "Хадгалагдлаа", () => setEditing(null));
              }}>
                <label className="flex min-w-40 flex-[2] flex-col gap-1 text-xs font-medium">Нэр
                  <input className={num} value={s.name} onChange={(e) => upd(i, { name: e.target.value })} />
                </label>
                <label className="flex w-20 flex-col gap-1 text-xs font-medium">Минут
                  <input type="number" inputMode="numeric" className={num} value={s.durationMin} onChange={(e) => upd(i, { durationMin: Number(e.target.value) })} />
                </label>
                <label className="flex w-20 flex-col gap-1 text-xs font-medium">Завсар
                  <input type="number" inputMode="numeric" className={num} value={s.bufferMin} onChange={(e) => upd(i, { bufferMin: Number(e.target.value) })} />
                </label>
                <label className="flex w-28 flex-col gap-1 text-xs font-medium">Үнэ ₮
                  <input inputMode="numeric" className={num} value={s.price ?? ""} placeholder="—"
                    onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); upd(i, { price: d ? Number(d) : null }); }} />
                </label>
                <button disabled={pending} className={btnPrimary}>Хадгалах</button>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex-1 font-medium">{s.name} <span className="font-normal text-muted">· {s.durationMin} мин{s.price != null ? ` · ₮${s.price.toLocaleString("en-US")}` : ""}</span></span>
                <button className={btnSecondary} onClick={() => setEditing(i)}>Засах</button>
                {s.id && (
                  <button className={btnSecondary} disabled={pending}
                    onClick={() => { const next = { ...s, active: !s.active }; upd(i, next); save(() => saveService({ slug, ...next })); }}>
                    {s.active ? "Нуух" : "Идэвхжүүлэх"}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {status}
      <button className={`${btnSecondary} self-start`} onClick={() => { setList([...list, { name: "", durationMin: 30, bufferMin: 5, price: null, active: true }]); setEditing(list.length); }}>
        + Үйлчилгээ нэмэх
      </button>
    </Card>
  );
}

export function Owners({ slug, term, initial }: { slug: string; term: string; initial: Owner[] }) {
  const [list, setList] = useState<Owner[]>(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const { pending, save, status } = useSave();
  const upd = (i: number, patch: Partial<Owner>) => setList(list.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <Card id="h-own" title={term}>
      <ul className="flex flex-col gap-2">
        {list.map((o, i) => (
          <li key={o.id ?? `new-${i}`} className={`flex flex-wrap items-center gap-2 rounded-xl border border-line p-3 ${o.active ? "" : "opacity-60"}`}>
            {editing === i ? (
              <form className="flex flex-1 flex-wrap items-end gap-2" onSubmit={(e) => {
                e.preventDefault();
                save(() => saveOwner({ slug, ...o }), "Хадгалагдлаа", () => setEditing(null));
              }}>
                <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium">Нэр
                  <input className={num} value={o.name} onChange={(e) => upd(i, { name: e.target.value })} />
                </label>
                <button disabled={pending} className={btnPrimary}>Хадгалах</button>
              </form>
            ) : (
              <>
                <span className="flex-1 font-medium">{o.name}{!o.active && <span className="font-normal text-muted"> · идэвхгүй</span>}</span>
                <button className={btnSecondary} onClick={() => setEditing(i)}>Засах</button>
                {o.id && (
                  <button className={btnSecondary} disabled={pending}
                    onClick={() => { const next = { ...o, active: !o.active }; upd(i, next); save(() => saveOwner({ slug, ...next })); }}>
                    {o.active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      {status}
      <button className={`${btnSecondary} self-start`} onClick={() => { setList([...list, { name: "", title: "", active: true }]); setEditing(list.length); }}>
        + {term} нэмэх
      </button>
    </Card>
  );
}

export function Hours({ slug, initial }: { slug: string; initial: DayHours[] }) {
  const [hours, setHours] = useState(initial);
  const { pending, save, status } = useSave();
  return (
    <Card id="h-hours" title="Ажлын цаг">
      <p className="text-sm text-muted">Бүх ажилтан/бокст ижил хэрэглэгдэнэ. Аль хэдийн орсон захиалгад нөлөөлөхгүй.</p>
      <HoursEditor value={hours} onChange={setHours} />
      {status}
      <button disabled={pending} onClick={() => save(() => saveHours({ slug, hours }))} className={`${btnPrimary} self-start`}>
        {pending ? "Хадгалж байна…" : "Ажлын цаг хадгалах"}
      </button>
    </Card>
  );
}

export function TimeOff({ slug, owners, list }: { slug: string; owners: Owner[]; list: Off[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [reason, setReason] = useState("");
  const { pending, save, status } = useSave();
  return (
    <Card id="h-off" title="Чөлөө, баяр">
      <p className="text-sm text-muted">Энэ хугацаанд онлайн захиалга авахгүй. Аль хэдийн орсон захиалгыг календараас шилжүүлнэ үү.</p>
      {list.length > 0 && (
        <ul className="flex flex-col gap-2">
          {list.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
              <span className="flex-1 text-sm">
                <b>{t.from === t.to ? t.from : `${t.from} – ${t.to}`}</b>{t.partial ? " (цагаар)" : ""} · {t.owner ?? "Бүх байгууллага"}{t.reason ? ` · ${t.reason}` : ""}
              </span>
              <button disabled={pending} className={btnSecondary} onClick={() => save(() => removeTimeOff({ slug, id: t.id }), "Устгагдлаа")}>Устгах</button>
            </li>
          ))}
        </ul>
      )}
      <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
        e.preventDefault();
        save(() => addTimeOff({ slug, from, to: to || from, ownerId: ownerId || null, reason }), "Нэмэгдлээ", () => { setFrom(""); setTo(""); setReason(""); });
      }}>
        <label className="flex flex-col gap-1 text-xs font-medium">Эхлэх
          <input type="date" required className={num} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">Дуусах
          <input type="date" className={num} value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">Хэн
          <select className={select} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Бүх байгууллага</option>
            {owners.filter((o) => o.id).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-32 flex-1 flex-col gap-1 text-xs font-medium">Шалтгаан
          <input className={num} value={reason} placeholder="Цагаан сар" onChange={(e) => setReason(e.target.value)} />
        </label>
        <button disabled={pending || !from} className={btnPrimary}>Нэмэх</button>
      </form>
      {status}
    </Card>
  );
}

/** Зургийг хөтөч дээр 256px дөрвөлжин (WebP, дэмжихгүй бол PNG) болгоно — файл жижиг, сервер ачаалалгүй */
async function resizeToSquare(file: File, size = 256): Promise<string> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  // Харьцааг хадгалж төвд нь багтаана (тайрахгүй)
  const scale = Math.min(size / bmp.width, size / bmp.height);
  const w = bmp.width * scale;
  const h = bmp.height * scale;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, (size - w) / 2, (size - h) / 2, w, h);
  let url = canvas.toDataURL("image/webp", 0.9);
  if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/png");
  return url.slice(url.indexOf(",") + 1);
}

export function Logo({ slug, name, logoUrl }: { slug: string; name: string; logoUrl: string | null }) {
  const { pending, save, status } = useSave();
  const [busy, setBusy] = useState(false);
  return (
    <Card id="h-logo" title="Байгууллагын лого" subtitle="Нүүр хуудас болон захиалгын хуудсанд харагдана.">
      <div className="flex flex-wrap items-center gap-4">
        <TenantLogo name={name} slug={slug} logoUrl={logoUrl} size={96} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm text-muted">PNG, JPG эсвэл WebP. Дөрвөлжин зураг хамгийн гоё харагдана.</p>
          <div className="flex flex-wrap gap-2">
            <label className={`${btnSecondary} cursor-pointer ${pending || busy ? "pointer-events-none opacity-50" : ""}`}>
              {logoUrl ? "Солих" : "Лого оруулах"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setBusy(true);
                  try {
                    const data = await resizeToSquare(f);
                    save(() => saveLogo({ slug, data }), "Лого хадгалагдлаа");
                  } catch {
                    save(async () => ({ ok: false, message: "Зургийг уншиж чадсангүй" }));
                  } finally {
                    setBusy(false);
                  }
                }} />
            </label>
            {logoUrl && (
              <button className={btnSecondary} disabled={pending} onClick={() => save(() => removeLogo({ slug }), "Лого устгагдлаа")}>Устгах</button>
            )}
          </div>
        </div>
      </div>
      {status}
    </Card>
  );
}
