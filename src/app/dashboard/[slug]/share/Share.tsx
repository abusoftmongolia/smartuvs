"use client";
import Link from "next/link";
import { useState } from "react";
import { btnSecondary } from "@/components/ui";
import { Panel } from "../../PageHeader";

/** QR-ийг сервер дээр зурж (svg) дамжуулна — qrcode сан client bundle-д орохгүй */
export function Share({ slug, url, qrSvg }: { slug: string; url: string; qrSvg: string }) {
  const [copied, setCopied] = useState(false);
  const pretty = url.replace(/^https?:\/\//, "");
  return (
    <Panel id="h-share" title="Захиалгын холбоос" subtitle="Энэ холбоос, QR кодыг үйлчлүүлэгчиддээ хуваалцана.">
      <div className="flex flex-wrap items-center gap-4">
        <div role="img" aria-label={`${pretty} хаягийн QR код`} className="size-32 bg-white [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <a href={url} target="_blank" className="break-all text-lg font-semibold underline">{pretty}</a>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true))}>
              {copied ? "Хуулагдлаа ✓" : "Хуулах"}
            </button>
            <Link href={`/dashboard/${slug}/poster`} className={btnSecondary}>A4 постер</Link>
          </div>
        </div>
      </div>
    </Panel>
  );
}
