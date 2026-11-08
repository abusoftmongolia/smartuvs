/** Салбарын том хавтангууд (uvsmarket-ийн ангиллын карт шиг). Зураггүй тул брэнд өнгөөр. */
import Link from "next/link";

const TILES = [
  { href: "/?industry=barber,beauty,nails#list", kicker: "Үсчин, гоо сайхан, хумс", title: "Гоо сайхан", tone: "bg-brand text-ink", btn: "bg-ink text-white", glyph: "✂" },
  { href: "/?industry=clinic,dental#list", kicker: "Эмнэлэг, шүдний эмнэлэг", title: "Эрүүл мэнд", tone: "bg-ink text-white", btn: "bg-brand text-ink", glyph: "✚" },
  { href: "/?industry=carwash#list", kicker: "Угаалга, засвар", title: "Авто үйлчилгээ", tone: "bg-[#ece9e1] text-ink", btn: "bg-white text-ink", glyph: "◉" },
];

export function CategoryTiles() {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-5">
      {TILES.map((t) => (
        <li key={t.title}>
          <Link href={t.href} className={`group relative flex h-24 flex-col justify-end overflow-hidden rounded-2xl p-3 sm:h-44 sm:rounded-[22px] sm:p-6 ${t.tone}`}>
            <span aria-hidden className="absolute -right-1 -top-3 select-none text-[64px] leading-none opacity-15 transition group-hover:scale-105 sm:-right-2 sm:-top-6 sm:text-[120px] sm:opacity-10">{t.glyph}</span>
            <span className="relative hidden text-sm font-medium opacity-80 sm:block">{t.kicker}</span>
            <span className="relative text-sm font-bold leading-tight sm:mt-1 sm:text-3xl">{t.title}</span>
            <span aria-hidden className={`absolute bottom-6 right-6 hidden size-11 items-center justify-center rounded-full transition group-hover:translate-x-0.5 sm:flex ${t.btn}`}>→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
