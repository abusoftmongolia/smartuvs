"use client";
/**
 * Бүртгэлийн 4 алхам + "Бэлэн". Салбар сонгоход preset-ээс үйлчилгээ, нэр томьёо автоматаар бөглөгдөнө.
 * Нэвтэрсэн хэрэглэгч 1-р алхмыг алгасна.
 */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { HoursEditor } from "@/components/HoursEditor";
import { ExpiredNotice, PhoneVerifyPanel, usePhoneVerification } from "@/components/PhoneVerify";
import { ErrorBox, Field, SuccessMark, btnPrimary, btnSecondary, inputCls, selectCls } from "@/components/ui";
import { defaultWeekHours, weekHoursProblem, type DayHours } from "@/lib/hours";
import { PASSWORD_MIN } from "@/lib/password-rules";
import { INDUSTRY_IDS, INDUSTRY_PRESETS, type Industry } from "@/lib/presets";
import { createTenant, registerAccount } from "@/server/signup-actions";

// QR зөвхөн "Бэлэн" алхамд — qrcode санг эхнээс нь ачаалахгүй
const QrCode = dynamic(() => import("@/components/QrCode").then((m) => m.QrCode), {
  ssr: false,
  loading: () => <div aria-hidden className="size-[220px] animate-pulse rounded bg-ground" />,
});

type Svc = { key: string; name: string; durationMin: number; bufferMin: number; price: string };
type OwnerRow = { key: string; name: string };

/** Жагсаалтын мөрд тогтвортой key (index-ээр бол устгахад input-ийн утга солигдоно) */
let seq = 0;
const k = () => `r${++seq}`;

/** Ноорог: refresh хийвэл алга болохгүй. Нууц үг, утас (1-р алхам) хадгалахгүй. */
const DRAFT_KEY = "tsag-signup-draft-v1";
type Draft = {
  step: number;
  orgName: string;
  industry: Industry;
  timezone: "Asia/Hovd" | "Asia/Ulaanbaatar";
  address: string;
  orgPhone: string;
  services: Omit<Svc, "key">[];
  hours: DayHours[];
  owners: string[];
};
function readDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && typeof d === "object" && INDUSTRY_IDS.includes(d.industry) ? d : null;
  } catch {
    return null;
  }
}
function writeDraft(d: Draft | null) {
  try {
    if (d) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // хувийн цонх, хаалттай storage — ноорог хадгалахгүй, бүртгэл хэвийн
  }
}

const STEPS = ["Бүртгэл", "Байгууллага", "Үйлчилгээ ба цаг", "Ажилтан"] as const;

function presetServices(i: Industry): Svc[] {
  return INDUSTRY_PRESETS[i].services.map((s) => ({ ...s, key: k(), price: "" }));
}
function presetOwners(i: Industry): OwnerRow[] {
  const p = INDUSTRY_PRESETS[i];
  const names = p.bookingMode === "resource" ? [`${p.terminology.staff} 1`, `${p.terminology.staff} 2`] : [""];
  return names.map((name) => ({ key: k(), name }));
}

export function SignupWizard({ loggedInAs, siteUrl }: { loggedInAs: string | null; siteUrl: string }) {
  const router = useRouter();
  const [step, setStep] = useState(loggedInAs ? 1 : 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // 1. Бүртгэл
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  // 2. Байгууллага
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState<Industry>("barber");
  const [timezone, setTimezone] = useState<"Asia/Hovd" | "Asia/Ulaanbaatar">("Asia/Hovd");
  const [address, setAddress] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  // 3. Үйлчилгээ ба цаг
  const [services, setServices] = useState<Svc[]>(presetServices("barber"));
  const [hours, setHours] = useState<DayHours[]>(defaultWeekHours());
  // 4. Ажилтан / бокс
  const [owners, setOwners] = useState<OwnerRow[]>(presetOwners("barber"));
  // Бэлэн
  const [slug, setSlug] = useState<string | null>(null);

  // Ноорог сэргээх (зөвхөн нэвтэрсэн — бүртгэл үүссэн бол 1+ алхам)
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const d = loggedInAs ? readDraft() : null;
    if (!d) return;
    setOrgName(d.orgName);
    setIndustry(d.industry);
    setTimezone(d.timezone);
    setAddress(d.address);
    setOrgPhone(d.orgPhone);
    setServices(d.services.map((s) => ({ ...s, key: k() })));
    setHours(d.hours);
    setOwners(d.owners.map((name) => ({ key: k(), name })));
    setStep(Math.min(Math.max(d.step, 1), 3));
  }, [loggedInAs]);
  useEffect(() => {
    if (!restored.current || step < 1 || step > 3) return;
    writeDraft({
      step, orgName, industry, timezone, address, orgPhone, hours,
      services: services.map(({ key: _key, ...s }) => s),
      owners: owners.map((o) => o.name),
    });
  }, [step, orgName, industry, timezone, address, orgPhone, services, hours, owners]);

  // Алхам солигдоход шинэ гарчиг руу фокус — дэлгэц уншигч өөрчлөлтийг мэднэ
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    headingRef.current?.focus();
  }, [step]);

  const preset = INDUSTRY_PRESETS[industry];
  const term = preset.terminology.staff;

  function register(verifyToken: string) {
    start(async () => {
      const r = await registerAccount({ name, phone, password, verifyToken });
      if (!r.ok) return setError(r.message);
      setError(null);
      setStep(1);
      router.refresh();
    });
  }
  const pv = usePhoneVerification((token) => register(token));
  const v = pv.verification;

  function chooseIndustry(i: Industry) {
    setIndustry(i);
    setServices(presetServices(i));
    setOwners(presetOwners(i));
  }

  function next() {
    setError(null);
    if (step === 0) {
      if (!name.trim()) return setError("Нэрээ оруулна уу");
      if (password.length < PASSWORD_MIN) return setError(`Нууц үг хамгийн багадаа ${PASSWORD_MIN} тэмдэгт байна`);
      if (v?.state === "verified" && v.phone === phone) return register(v.token);
      return void pv.start(phone);
    }
    if (step === 1) {
      if (orgName.trim().length < 2) return setError("Байгууллагын нэрээ оруулна уу");
      return setStep(2);
    }
    if (step === 2) {
      const list = services.filter((s) => s.name.trim());
      if (list.length === 0) return setError("Ядаж нэг үйлчилгээ нэмнэ үү");
      if (list.some((s) => !(s.durationMin >= 5))) return setError("Үргэлжлэх хугацаа 5 минутаас дээш байна");
      const hp = weekHoursProblem(hours);
      if (hp) return setError(hp);
      return setStep(3);
    }
    if (step === 3) {
      const names = owners.map((o) => o.name.trim()).filter(Boolean);
      if (names.length === 0) return setError(`Ядаж нэг ${term.toLowerCase()} нэмнэ үү`);
      start(async () => {
        const r = await createTenant({
          name: orgName,
          industry,
          timezone,
          address,
          phone: orgPhone,
          services: services
            .filter((s) => s.name.trim())
            .map((s) => ({ name: s.name, durationMin: s.durationMin, bufferMin: s.bufferMin, price: s.price ? Number(s.price.replace(/\D/g, "")) : null })),
          hours,
          owners: names,
        });
        if (!r.ok) return setError(r.message);
        writeDraft(null);
        setSlug(r.slug);
        setStep(4);
      });
    }
  }

  if (step === 4 && slug) return <Ready slug={slug} name={orgName} siteUrl={siteUrl} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Байгууллагаа бүртгүүлэх</h1>
        <p className="mt-1 text-sm text-muted">Үнэгүй · 5 минут · үйлчлүүлэгчид тань төлбөргүй захиална</p>
      </div>

      <ol className="flex gap-1.5" aria-label="Алхам">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-1" aria-current={i === step ? "step" : undefined}>
            <span className={`h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
            <span className={`text-xs font-medium ${i === step ? "text-ink" : "text-muted"}`}>{i + 1}. {s}</span>
          </li>
        ))}
      </ol>

      <form
        className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5"
        onSubmit={(e) => { e.preventDefault(); next(); }}
      >
        {step === 0 && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold">Таны бүртгэл</h2>
            <Field id="su-name" label="Таны нэр" value={name} onChange={setName} autoComplete="name" />
            <Field id="su-phone" label="Утасны дугаар" type="tel" value={phone} onChange={(x) => { setPhone(x); pv.reset(); }} placeholder="9911 2233" autoComplete="username"
              hint="Самбарт энэ дугаараар нэвтэрнэ" />
            <Field id="su-pw" label="Нууц үг" type="password" value={password} onChange={setPassword} autoComplete="new-password" hint={`${PASSWORD_MIN}+ тэмдэгт`} />
            {v?.state === "pending" && <PhoneVerifyPanel v={v} onCancel={pv.reset} netError={pv.netError} onCheck={() => void pv.checkNow()} />}
            {v?.state === "expired" && <ExpiredNotice onRestart={pv.restart} busy={pv.starting} />}
            {pv.error && <ErrorBox>{pv.error}</ErrorBox>}
            <p className="text-sm text-muted">Бүртгэлтэй юу? <Link href="/admin/login" className="font-semibold text-brand-deep underline">Нэвтрэх</Link></p>
          </>
        )}

        {step === 1 && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold">Байгууллага</h2>
            {loggedInAs && <p className="text-sm text-muted">{loggedInAs} нэрээр бүртгүүлж байна.</p>}
            <Field id="org-name" label="Байгууллагын нэр" value={orgName} onChange={setOrgName} placeholder="Хатан Салон" />
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-semibold">Салбар</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {INDUSTRY_IDS.map((i) => (
                  <button key={i} type="button" onClick={() => chooseIndustry(i)} aria-pressed={industry === i}
                    className={`min-h-12 rounded-card border-[1.5px] px-3 text-sm font-medium ${industry === i ? "border-ink bg-brand-tint" : "border-line bg-white"}`}>
                    {INDUSTRY_PRESETS[i].label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Байршил (цагийн бүс)
              <select value={timezone} onChange={(e) => setTimezone(e.target.value as typeof timezone)}
                className={`${selectCls} text-base`}>
                <option value="Asia/Hovd">Баруун аймгууд (Увс, Ховд, Баян-Өлгий, Завхан, Говь-Алтай) — UTC+7</option>
                <option value="Asia/Ulaanbaatar">Улаанбаатар ба бусад аймаг — UTC+8</option>
              </select>
            </label>
            <Field id="org-addr" label="Хаяг (заавал биш)" value={address} onChange={setAddress} placeholder="Улаангом, 2-р баг" />
            <Field id="org-phone" label="Холбогдох утас (заавал биш)" type="tel" value={orgPhone} onChange={setOrgPhone} hint="Захиалгын хуудсанд 'Залгах' товч болж харагдана" />
          </>
        )}

        {step === 2 && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold">Үйлчилгээ</h2>
            <p className="text-sm text-muted">Үнэ зөвхөн мэдээлэл — үйлчлүүлэгч урьдчилж төлөхгүй.</p>
            <ul className="flex flex-col gap-2">
              {services.map((s) => (
                <li key={s.key} className="flex flex-wrap items-end gap-2 rounded-xl border border-line p-3">
                  <label className="flex min-w-40 flex-[2] flex-col gap-1 text-xs font-medium">
                    Нэр
                    <input value={s.name} onChange={(e) => setServices(services.map((x) => (x.key === s.key ? { ...x, name: e.target.value } : x)))}
                      className={`min-h-11 px-2.5 text-base font-normal ${inputCls}`} />
                  </label>
                  <label className="flex w-24 flex-col gap-1 text-xs font-medium">
                    Минут
                    <input type="number" inputMode="numeric" min={5} step={5} value={s.durationMin}
                      onChange={(e) => setServices(services.map((x) => (x.key === s.key ? { ...x, durationMin: Number(e.target.value) } : x)))}
                      className={`min-h-11 px-2.5 text-base font-normal ${inputCls}`} />
                  </label>
                  <label className="flex w-28 flex-col gap-1 text-xs font-medium">
                    Үнэ ₮
                    <input inputMode="numeric" value={s.price} placeholder="—"
                      onChange={(e) => setServices(services.map((x) => (x.key === s.key ? { ...x, price: e.target.value.replace(/\D/g, "") } : x)))}
                      className={`min-h-11 px-2.5 text-base font-normal ${inputCls}`} />
                  </label>
                  <button type="button" onClick={() => setServices(services.filter((x) => x.key !== s.key))} aria-label={`${s.name || "Үйлчилгээ"} хасах`}
                    className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-lg">×</button>
                </li>
              ))}
            </ul>
            <button type="button" className={`${btnSecondary} self-start`}
              onClick={() => setServices([...services, { key: k(), name: "", durationMin: 30, bufferMin: 5, price: "" }])}>
              + Үйлчилгээ нэмэх
            </button>
            <h2 className="mt-2 text-lg font-semibold">Ажлын цаг</h2>
            <HoursEditor value={hours} onChange={setHours} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold">{term}</h2>
            <p className="text-sm text-muted">
              {preset.bookingMode === "resource"
                ? `Үйлчлүүлэгч сул ${term.toLowerCase()}оор захиална. Хэдэн ${term.toLowerCase()} зэрэг ажиллахыг оруулна уу.`
                : `Үйлчлүүлэгч ${term.toLowerCase()}ээ сонгож болно. Дараа нь тохиргооноос засна.`}
            </p>
            <ul className="flex flex-col gap-2">
              {owners.map((o, i) => (
                <li key={o.key} className="flex gap-2">
                  <label className="sr-only" htmlFor={`own-${o.key}`}>{term} {i + 1}</label>
                  <input id={`own-${o.key}`} value={o.name} placeholder={`${term} ${i + 1}-н нэр`}
                    onChange={(e) => setOwners(owners.map((x) => (x.key === o.key ? { ...x, name: e.target.value } : x)))}
                    className={`min-h-12 flex-1 px-3.5 text-base ${inputCls}`} />
                  <button type="button" onClick={() => setOwners(owners.filter((x) => x.key !== o.key))} aria-label={`${o.name || term} хасах`}
                    className="inline-flex size-12 items-center justify-center rounded-xl border border-line text-lg">×</button>
                </li>
              ))}
            </ul>
            <button type="button" className={`${btnSecondary} self-start`} onClick={() => setOwners([...owners, { key: k(), name: "" }])}>+ {term} нэмэх</button>
          </>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}

        {!(step === 0 && v?.state === "pending") && (
          <div className="flex gap-2">
            {/* Бүртгэл үүссэний дараа 1-р алхам руу буцахгүй */}
            {step >= 2 && (
              <button type="button" className={btnSecondary} onClick={() => { setError(null); setStep(step - 1); }} disabled={pending}>
                Буцах
              </button>
            )}
            <button type="submit" disabled={pending || pv.starting} className={`${btnPrimary} flex-1`}>
              {pending || pv.starting ? "Түр хүлээнэ үү…" : step === 3 ? "Бүртгэлийг дуусгах" : step === 0 ? "Утсаа баталгаажуулах" : "Үргэлжлүүлэх"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function Ready({ slug, name, siteUrl }: { slug: string; name: string; siteUrl: string }) {
  const url = `${siteUrl.replace(/\/$/, "")}/${slug}`;
  const pretty = url.replace(/^https?:\/\//, "");
  const [copied, setCopied] = useState(false);
  return (
    <section className="flex flex-col items-center gap-4 rounded-[18px] border border-line bg-white p-6 text-center">
      <SuccessMark />
      <h1 className="text-2xl font-bold">Бүртгэл илгээгдлээ!</h1>
      <p className="rounded-xl bg-brand-tint p-3 text-sm">
        SmartUvs таны байгууллагыг шалгаад <b>батлах</b> бөгөөд батлагдмагц SMS ирнэ. Тэр хүртэл доорх хаяг нийтэд нээгдэхгүй — энэ хооронд самбартаа үйлчилгээ, ажилтнаа тохируулаарай.
      </p>
      <p className="text-muted">{name}-ийн захиалгын хуудас (батлагдсаны дараа):</p>
      <p className="break-all text-xl font-semibold">{pretty}</p>
      <QrCode url={url} label={`${pretty} хаягийн QR код`} />
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <button className={`${btnSecondary} flex-1`} onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true))}>
          {copied ? "Хуулагдлаа ✓" : "Холбоос хуулах"}
        </button>
        <Link href={`/dashboard/${slug}/poster`} className={`${btnSecondary} flex-1`}>A4 постер хэвлэх</Link>
        <Link href={`/dashboard/${slug}`} className={`${btnPrimary} flex-1`}>Самбар руу</Link>
      </div>
      <p className="text-sm text-muted">Батлагдсаны дараа холбоосыг Facebook хуудас, Instagram bio-доо тавьж, постерыг үүдэндээ наагаарай.</p>
    </section>
  );
}
