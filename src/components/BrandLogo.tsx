import Image from "next/image";
import { SYSTEM_NAME } from "@/lib/site";

/* Лого PNG 1200×175 — системийн нэрийг ижил координатаар (логоны өргөнд) голлуулж байрлуулна. */
const LOGO_W = 1200;

/**
 * SmartUvs лого + доор нь системийн нэр ("Цаг захиалгын систем").
 * SmartUvs-ийн систем бүр логоны доор өөрийн нэрийг харуулна. Лого хар-шар тул цагаан дэвсгэр дээр.
 */
export function BrandLogo(p: {
  /** Логоны өндөр (Tailwind), жишээ нь "h-8" */
  logoClass?: string;
  priority?: boolean;
}) {
  return (
    <span className="inline-flex flex-col leading-none">
      <Image src="/smartuvs-logo.png" alt="SmartUvs.mn" width={219} height={32} className={`${p.logoClass ?? "h-8"} w-auto`} priority={p.priority} />
      {/* w-0 min-w-full: бичиг контейнерыг өргөсгөхгүй, логоны өргөнийг дагана */}
      <span className="block w-0 min-w-full">
        <svg
          viewBox={`0 0 ${LOGO_W} 76`}
          className="mt-[3%] block h-auto w-full text-muted"
          role="img"
          aria-label={SYSTEM_NAME}
        >
          <text
            x={LOGO_W / 2}
            y={56}
            textAnchor="middle"
            fontSize={72}
            fontWeight={500}
            fill="currentColor"
          >
            {SYSTEM_NAME}
          </text>
        </svg>
      </span>
    </span>
  );
}
