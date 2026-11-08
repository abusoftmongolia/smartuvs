/** "3 алхмаар цаг захиална" баннер — uvsmarket.mn-ийн баннерын загвар. Чимэглэл (утас, QR) aria-hidden. */
import Link from "next/link";

const STEPS = [
  { n: 1, t: "Байгууллагаа сонго", dark: false },
  { n: 2, t: "Цагаа сонго", dark: false },
  { n: 3, t: "Утсаараа батал", dark: true },
];

export function Hero() {
  return (
    <section aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-[24px] bg-gradient-to-b from-[#fdfaf2] to-[#dedbd3] px-4 py-6 sm:rounded-[28px] sm:px-10 sm:py-14">
      <PhoneArt />
      <QrArt />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 text-center sm:gap-6">
        <span className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-brand sm:px-5 sm:py-2 sm:text-sm">Амархан захиалга</span>
        <h1 id="hero-title" className="flex flex-col items-center text-[34px] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          <span>3 алхмаар</span>
          <span className="mt-1 rounded-2xl bg-brand px-4 pb-1.5 text-ink sm:px-6">цаг захиална</span>
        </h1>
        <ol className="grid w-full grid-cols-3 gap-1.5 sm:gap-4">
          {STEPS.map((s) => (
            <li key={s.n}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1.5 py-3 sm:gap-3 sm:px-2 sm:py-6 ${s.dark ? "border-ink bg-ink text-white" : "border-ink bg-white/70"}`}>
              <span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-ink sm:size-12 sm:text-xl">{s.n}</span>
              <span className="text-[13px] font-bold leading-tight sm:text-lg">{s.t}</span>
            </li>
          ))}
        </ol>
        <Link href="#list" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-card bg-ink px-6 font-semibold text-white sm:w-auto">
          Цаг захиалах <span aria-hidden>→</span>
        </Link>
        <p className="-mt-1 text-xs text-muted sm:text-sm">Төлбөргүй · Бүртгэл шаардахгүй · 24/7</p>
      </div>
    </section>
  );
}

function PhoneArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute -left-6 top-10 hidden h-[78%] w-56 -rotate-6 lg:block">
      <div className="absolute inset-0 translate-x-3 rounded-[40px] bg-brand" />
      <div className="absolute inset-3 rounded-[32px] border-[10px] border-ink bg-white p-4">
        <div className="mx-auto mt-6 h-3 w-24 rounded-full bg-line" />
        <div className="mt-5 grid grid-cols-3 gap-1.5">
          {["09:00", "10:30", "11:00", "13:00", "14:30", "16:00"].map((t, i) => (
            <span key={t} className={`rounded-md py-1 text-center text-[10px] font-semibold ${i === 3 ? "bg-brand text-ink" : "bg-ground text-muted"}`}>{t}</span>
          ))}
        </div>
        <div className="mt-5 h-7 rounded-lg bg-brand" />
      </div>
    </div>
  );
}

function QrArt() {
  // Тогтмол хээ — бодит QR биш, чимэглэл
  const cells = "1110111010100111011101001010001110110100101110100".split("");
  return (
    <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 hidden h-full w-64 lg:block">
      <div className="absolute -right-10 -top-6 size-72 rounded-full bg-ink" />
      <div className="absolute bottom-16 right-14 rotate-6 rounded-3xl border-[6px] border-ink bg-white p-4 shadow-lg">
        <span className="absolute -left-6 -top-5 rounded-full border-2 border-ink bg-brand px-3 py-1 text-sm font-extrabold text-ink">QR</span>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((c, i) => <span key={i} className={`size-3 rounded-[2px] ${c === "1" ? (i === 24 ? "bg-brand" : "bg-ink") : "bg-transparent"}`} />)}
        </div>
      </div>
    </div>
  );
}
