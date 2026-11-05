/** Байгууллагын лого — байхгүй бол нэрийн үсгээр өнгөт дүрс. Server, client аль алинд. */
import { avatarColors, initials } from "@/lib/logo";

export function TenantLogo(p: { name: string; slug: string; logoUrl: string | null; size?: number; className?: string }) {
  const size = p.size ?? 56;
  const box = `flex flex-none items-center justify-center overflow-hidden rounded-2xl ${p.className ?? ""}`;
  if (p.logoUrl) {
    return (
      <span className={`${box} border border-line bg-white`} style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- өөрийн API-аас, хэмжээ нь жижиг */}
        <img src={p.logoUrl} alt={`${p.name} лого`} width={size} height={size} loading="lazy" decoding="async" className="h-full w-full object-contain" />
      </span>
    );
  }
  const c = avatarColors(p.slug);
  return (
    <span aria-hidden className={`${box} font-extrabold tracking-tight`}
      style={{ width: size, height: size, background: c.bg, color: c.fg, fontSize: Math.round(size * 0.38) }}>
      {initials(p.name)}
    </span>
  );
}
