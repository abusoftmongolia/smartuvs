/**
 * A4 QR постер — үүдэнд, тоолуур дээр наана. Хөтчийн "Хэвлэх → PDF болгох"-оор PDF болгоно.
 */
import Image from "next/image";
import { qrSvg } from "@/lib/qr";
import { requireMember } from "@/server/auth";
import { PrintButton } from "./PrintButton";

export default async function PosterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireMember(slug);
  const url = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn").replace(/\/$/, "")}/${tenant.slug}`;
  const pretty = url.replace(/^https?:\/\//, "");
  const svg = await qrSvg(url);

  return (
    <main className="flex flex-col items-center gap-4 px-4 py-6 print:p-0">
      <style>{`@page { size: A4; margin: 0 } @media print { body { background: #fff } }`}</style>
      <div className="flex gap-2 print:hidden">
        <PrintButton />
      </div>
      <article className="flex aspect-[210/297] w-full max-w-[210mm] flex-col items-center justify-between bg-white p-[12mm] text-center shadow-lg print:h-[297mm] print:w-[210mm] print:max-w-none print:shadow-none">
        <Image src="/smartuvs-logo.png" alt="SmartUvs.mn" width={1200} height={175} className="h-10 w-auto" priority />
        <div className="flex flex-col items-center gap-[6mm]">
          <p className="text-[clamp(18px,4vw,30px)] font-medium">{tenant.name}</p>
          <h1 className="text-[clamp(28px,7vw,56px)] font-bold leading-tight">Онлайнаар<br />цаг захиалаарай</h1>
          <div className="rounded-[18px] border-[6px] border-brand p-[4mm]">
            <div role="img" aria-label={`${pretty} хаягийн QR код`} className="size-[min(70vw,95mm)] [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <p className="text-[clamp(14px,3vw,22px)] font-semibold">Утасныхаа камераар уншуулна уу</p>
          <p className="break-all text-[clamp(16px,3.6vw,28px)] font-medium">{pretty}</p>
        </div>
        <p className="text-[clamp(12px,2.4vw,18px)] text-muted">Төлбөргүй · Бүртгэл шаардахгүй · 24/7</p>
      </article>
    </main>
  );
}
