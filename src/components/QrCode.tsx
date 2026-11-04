"use client";
/** QR код (SVG) — хөтөч дээр үүсгэнэ, гадны сервер рүү URL илгээхгүй. */
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrCode({ url, size = 220, label }: { url: string; size?: number; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } })
      .then((s) => live && setSvg(s))
      .catch(() => live && setSvg(null));
    return () => { live = false; };
  }, [url]);
  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      className="bg-white [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
