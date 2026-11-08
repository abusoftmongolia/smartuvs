/** Салбарын том хавтангууд (uvsmarket-ийн ангиллын карт шиг). Зураггүй тул брэнд өнгөөр. */
import Link from "next/link";
import { tileHref, type Tile } from "@/lib/site-config";

/** Өнгө, дүрс нь байрлалаар тогтмол; гарчиг, тайлбар, салбаруудыг Super Admin → Ангилал-аас засна */
const LOOK = [
  { tone: "bg-brand text-ink", btn: "bg-ink text-white", glyph: "✂" },
  { tone: "bg-ink text-white", btn: "bg-brand text-ink", glyph: "✚" },
  { tone: "bg-[#ece9e1] text-ink", btn: "bg-white text-ink", glyph: "◉" },
];

export function CategoryTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-5">
      {tiles.map((tile, i) => ({ ...tile, ...LOOK[i % LOOK.length], href: tileHref(tile) })).map((t, i) => (
        <li key={i}>
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
