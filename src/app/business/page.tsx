/**
 * Байгууллагад зориулсан танилцуулга — tsag.smartuvs.mn/business
 * Цаг захиалгын системийн боломж, ажиллах зарчим, үйлчлүүлэгчийн урсгал, салбарууд, үнэ (үнэгүй).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { INDUSTRY_IDS, INDUSTRY_PRESETS } from "@/lib/presets";

export const metadata: Metadata = {
  title: "Байгууллагад",
  description: "Үйлчлүүлэгчид онлайнаар цаг авч, SMS сануулга автоматаар очно. Үсчин, гоо сайхан, эмнэлэг, авто угаалга болон бусад салбарт үнэгүй.",
};

const CONTACT = { email: "info@smartuvs.mn", phone: "+97695866262", phoneLabel: "9586 6262" };
const DEMO = "/hatan-salon";

const STEPS = [
  { t: "Бүртгүүлж тохируулна", d: "Үйлчилгээ, ажлын цаг, ажилтнаа 5 минутад оруулна. Салбараа сонгоход бэлэн загвар бөглөгдөнө." },
  { t: "Холбоосоо хуваалцна", d: "tsag.smartuvs.mn/таны-нэр хаяг болон A4 QR постероо Facebook, хаалган дээрээ байрлуулна." },
  { t: "Үйлчлүүлэгч өөрөө захиална", d: "Сул цагаа харж, утсаа баталгаажуулаад захиална. Та самбараас нэг дор хянана." },
];

const FEATURES: { t: string; d: string; icon: keyof typeof ICONS }[] = [
  { t: "Онлайн захиалга 24/7", d: "Утсаар залгаж, чатаар тохирох шаардлагагүй. Шөнө ч захиалга орно.", icon: "calendar" },
  { t: "Ажилтны хуваарь", d: "Ажилтан, бокс тус бүрийн ажлын цаг, чөлөө. Өдрийн календарь баганаар.", icon: "users" },
  { t: "SMS сануулга", d: "Цагаас 24 ба 2 цагийн өмнө үйлчлүүлэгчид автоматаар сануулна — ирэхгүй байх нь багасна.", icon: "bell" },
  { t: "Шинэ захиалгын мэдэгдэл", d: "Захиалга орох бүрт танд болон тухайн ажилтанд SMS очно.", icon: "message" },
  { t: "Батлах эсвэл автомат", d: "Шууд баталгаажуулах, эсвэл өөрөө хянаж батлах — салбартаа тохируулна.", icon: "check" },
  { t: "Захиалгын код", d: "Үйлчлүүлэгч бүр #X4K9M2 маягийн код авна. Самбараас кодоор шууд олно.", icon: "hash" },
  { t: "Өөрөө цуцлах, шилжүүлэх", d: "Үйлчлүүлэгч SMS-ийн холбоосоор цагаа шилжүүлнэ. Танд залгах шаардлагагүй.", icon: "refresh" },
  { t: "Давхар захиалгагүй", d: "Нэг цагт хоёр хүн хэзээ ч захиалагдахгүй — өгөгдлийн сангийн түвшинд хамгаалсан.", icon: "shield" },
];

export default function BusinessPage() {
  const industries = INDUSTRY_IDS.filter((i) => i !== "other").map((i) => INDUSTRY_PRESETS[i].label);
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-16">
          <div className="flex flex-col items-start gap-5">
            <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-medium text-brand-deep">Цаг захиалгын систем · Үнэгүй</span>
            <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Захиалгаа утсаар биш, <span className="whitespace-nowrap">онлайнаар</span> аваарай
            </h1>
            <p className="max-w-lg text-base text-muted">
              Үйлчлүүлэгч таны хуудаснаас сул цагаа сонгоод захиална. Баталгаажуулалт, сануулга SMS-ээр автоматаар явна — та үйлчилгээндээ анхаарна.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/signup" className="inline-flex min-h-12 items-center rounded-card bg-brand px-6 font-semibold text-ink">Үнэгүй бүртгүүлэх</Link>
              <Link href={DEMO} className="inline-flex min-h-12 items-center rounded-card border border-line bg-white px-6 font-medium">Жишээ хуудас үзэх</Link>
            </div>
            <p className="text-sm text-muted">Бүртгэлтэй юу? <Link href="/admin/login" className="font-semibold text-brand-deep underline">Нэвтрэх</Link></p>
          </div>
          <ScheduleMock />
        </section>

        {/* Хэрхэн ажилладаг */}
        <Section id="how" kicker="Хэрхэн ажилладаг" title="Гурван алхмаар эхэлнэ">
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.t} className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-6">
                <span className="font-mono text-sm font-medium text-brand-deep">0{i + 1}</span>
                <h3 className="text-lg font-semibold">{s.t}</h3>
                <p className="text-sm text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Боломжууд */}
        <Section id="features" kicker="Боломжууд" title="Захиалгын бүх ажлыг нэг дор">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <li key={f.t} className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">{ICONS[f.icon]}</span>
                <h3 className="font-semibold">{f.t}</h3>
                <p className="text-sm text-muted">{f.d}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Үйлчлүүлэгчийн урсгал */}
        <Section id="flow" kicker="Үйлчлүүлэгчийн урсгал" title="Захиалах нь хэдхэн товшилт">
          <ol className="grid gap-4 md:grid-cols-3">
            <FlowCard n={1} title="Цаг сонгоно">
              <div className="flex gap-1.5">
                {["Да", "Мя", "Лх", "Пү", "Ба"].map((d, i) => (
                  <span key={d} className={`flex h-12 flex-1 flex-col items-center justify-center rounded-lg border text-[11px] font-medium ${i === 1 ? "border-brand bg-brand-tint" : "border-line bg-white"}`}>
                    {d}<span className="text-sm">{10 + i}</span>
                  </span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {["09:00", "10:00", "11:00", "13:00", "14:00", "15:30"].map((t) => (
                  <span key={t} className={`rounded-lg border py-1.5 text-center text-xs font-medium ${t === "11:00" ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>{t}</span>
                ))}
              </div>
            </FlowCard>
            <FlowCard n={2} title="Утсаа баталгаажуулна">
              <div className="flex flex-col gap-2">
                <MockField label="Нэр" value="Номин" />
                <MockField label="Утас" value="9911 2233" />
                <span className="rounded-lg bg-brand py-2 text-center text-xs font-medium text-ink">Баталгаажуулах</span>
              </div>
            </FlowCard>
            <FlowCard n={3} title="Код авна">
              <div className="flex flex-col items-center gap-1 rounded-xl bg-ground p-4 text-center">
                <span className="text-xs text-muted">Таны цаг баталгаажлаа</span>
                <span className="font-medium">Мягмар, 11:00</span>
                <span className="mt-1 font-mono text-xl font-semibold tracking-[0.15em]">#X4K9M2</span>
                <span className="text-[11px] text-muted">SMS-ээр сануулга очно</span>
              </div>
            </FlowCard>
          </ol>
        </Section>

        {/* Салбарууд */}
        <Section id="industries" kicker="Хэнд зориулсан бэ" title="Цаг захиалдаг бүх бизнест">
          <ul className="flex flex-wrap gap-2">
            {industries.map((l) => (
              <li key={l} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium">{l}</li>
            ))}
            <li className="rounded-full border border-dashed border-line px-4 py-2 text-sm text-muted">болон бусад</li>
          </ul>
        </Section>

        {/* Үнэ */}
        <Section id="pricing" kicker="Үнэ" title="Үнэгүй">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col gap-5 rounded-[20px] border-2 border-ink bg-white p-6 sm:p-8">
              <div>
                <div className="text-sm font-medium text-muted">Бүх байгууллагад</div>
                <div className="mt-1 flex items-baseline gap-2"><span className="text-5xl font-bold tracking-tight">0₮</span><span className="text-muted">/ сар</span></div>
                <p className="mt-2 text-sm text-muted">Ажилтны тоо хязгааргүй. Үйлчлүүлэгчээс ч төлбөр авахгүй.</p>
              </div>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {["Онлайн захиалгын хуудас", "QR постер (A4)", "Ажилтан, боксын хуваарь", "SMS сануулга", "Шинэ захиалгын мэдэгдэл", "Захиалгын түүх"].map((x) => (
                  <li key={x} className="flex items-center gap-2"><span aria-hidden className="text-brand-deep">{ICONS.check}</span>{x}</li>
                ))}
              </ul>
              <Link href="/signup" className="inline-flex min-h-12 items-center justify-center self-start rounded-card bg-brand px-6 font-semibold text-ink">Үнэгүй эхлэх</Link>
            </div>
            <div className="flex flex-col justify-between gap-5 rounded-[20px] bg-ink p-6 text-white sm:p-8">
              <div>
                <h3 className="text-xl font-semibold">Тусгай хэрэгцээтэй юу?</h3>
                <p className="mt-2 text-sm text-white/75">Олон салбартай сүлжээ, тусгай тайлан, өөр системтэй холболт хэрэгтэй бол бидэнтэй холбогдоорой.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`tel:${CONTACT.phone}`} className="inline-flex min-h-12 items-center rounded-card bg-white px-5 font-medium text-ink">{CONTACT.phoneLabel}</a>
                <a href={`mailto:${CONTACT.email}`} className="inline-flex min-h-12 items-center rounded-card border border-white/30 px-5 font-medium">{CONTACT.email}</a>
              </div>
            </div>
          </div>
        </Section>

        {/* Төгсгөлийн уриа */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="flex flex-col items-start gap-4 rounded-[24px] bg-brand p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div>
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">Өнөөдөр эхлээрэй</h2>
              <p className="mt-1 text-ink/80">5 минутад бүртгүүлнэ. SmartUvs хянаж баталмагц таны хуудас нээгдэнэ.</p>
            </div>
            <Link href="/signup" className="inline-flex min-h-12 flex-none items-center rounded-card bg-ink px-6 font-semibold text-white">Байгууллагаа бүртгүүлэх</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:pb-20">
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-wider text-brand-deep">{kicker}</div>
        <h2 id={`h-${id}`} className="mt-1.5 text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FlowCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-4 rounded-[20px] border border-line bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">{n}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div aria-hidden>{children}</div>
    </li>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <span className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm">{value}</span>
    </span>
  );
}

/** Өдрийн хуваарийн жишээ зураг (чимэглэл) — самбарын харагдацтай ижил */
function ScheduleMock() {
  const staff = ["Сараа", "Номин", "Бат"];
  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];
  // [багана, эхлэх цаг (0 = 09:00), үргэлжлэх цаг, нэр, үйлчилгээ, төлөв]
  const blocks: [number, number, number, string, string, "ok" | "wait"][] = [
    [0, 0, 1, "Оюун", "Үс будах", "ok"],
    [0, 2, 1.5, "Туяа", "Маникюр", "ok"],
    [1, 0.5, 1, "Ганаа", "Нүүр арчилгаа", "wait"],
    [1, 3, 1, "Болор", "Сормуус", "ok"],
    [2, 1, 0.5, "Тэмүүлэн", "Сахал засах", "ok"],
    [2, 2.5, 1, "Бат-Эрдэнэ", "Үс засалт", "ok"],
    [2, 4, 1, "Мөнх", "Үс засалт", "wait"],
  ];
  const ROW = 52;
  return (
    <div aria-hidden className="overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_24px_60px_-30px_rgba(11,11,11,0.35)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="font-medium">Мягмар · Өнөөдөр</span>
        <span className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-ink">7 захиалга</span>
      </div>
      <div className="flex">
        <div className="w-14 flex-none border-r border-line pt-9">
          {hours.map((h) => <div key={h} style={{ height: ROW }} className="pr-2 text-right text-[11px] text-muted">{h}</div>)}
        </div>
        {staff.map((s, col) => (
          <div key={s} className="min-w-0 flex-1 border-r border-line last:border-r-0">
            <div className="flex h-9 items-center justify-center border-b border-line text-xs font-medium">{s}</div>
            <div className="relative" style={{ height: ROW * hours.length }}>
              {hours.map((h, i) => <div key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * ROW }} />)}
              {blocks.filter((b) => b[0] === col).map(([, at, len, name, svc, st]) => (
                <div key={name} className={`absolute inset-x-1 overflow-hidden rounded-lg border-l-[3px] px-2 py-1 ${st === "ok" ? "border-brand bg-brand-tint" : "border-pending bg-blue-50"}`}
                  style={{ top: at * ROW + 2, height: len * ROW - 4 }}>
                  <div className="truncate text-xs font-medium">{name}</div>
                  <div className="truncate text-[11px] text-muted">{svc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ic = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const ICONS = {
  calendar: <svg {...ic}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>,
  users: <svg {...ic}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" /></svg>,
  bell: <svg {...ic}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4" /></svg>,
  message: <svg {...ic}><path d="M21 11.5a8.4 8.4 0 0 1-12.1 7.6L3 21l1.9-5.9A8.4 8.4 0 1 1 21 11.5z" /></svg>,
  check: <svg {...ic}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
  hash: <svg {...ic}><path d="M5 9h15M4 15h15M10 3 8 21M16 3l-2 18" /></svg>,
  refresh: <svg {...ic}><path d="M20 11a8 8 0 0 0-14.7-4.4L3 9M3 4v5h5M4 13a8 8 0 0 0 14.7 4.4L21 15M21 20v-5h-5" /></svg>,
  shield: <svg {...ic}><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>,
};
