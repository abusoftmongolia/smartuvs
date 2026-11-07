"use client";
import { useState } from "react";
import { TenantLogo } from "@/components/TenantLogo";
import { btnSecondary } from "@/components/ui";
import { removeLogo, saveLogo } from "@/server/settings-actions";
import { Panel } from "../../PageHeader";
import { useSave } from "./shared";

/** Зургийг хөтөч дээр 256px дөрвөлжин (WebP, дэмжихгүй бол PNG) болгоно — файл жижиг, сервер ачаалалгүй */
async function resizeToSquare(file: File, size = 256): Promise<string> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d дэмжихгүй");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  // Харьцааг хадгалж төвд нь багтаана (тайрахгүй)
  const scale = Math.min(size / bmp.width, size / bmp.height);
  const w = bmp.width * scale;
  const h = bmp.height * scale;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, (size - w) / 2, (size - h) / 2, w, h);
  let url = canvas.toDataURL("image/webp", 0.9);
  if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/png");
  return url.slice(url.indexOf(",") + 1);
}

export function Logo({ slug, name, logoUrl }: { slug: string; name: string; logoUrl: string | null }) {
  const { pending, save, fail, status } = useSave();
  const [busy, setBusy] = useState(false);
  return (
    <Panel id="h-logo" title="Байгууллагын лого" subtitle="Нүүр хуудас болон захиалгын хуудсанд харагдана.">
      <div className="flex flex-wrap items-center gap-4">
        <TenantLogo name={name} slug={slug} logoUrl={logoUrl} size={96} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-sm text-muted">PNG, JPG эсвэл WebP. Дөрвөлжин зураг хамгийн гоё харагдана.</p>
          <div className="flex flex-wrap gap-2">
            <label className={`${btnSecondary} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink ${pending || busy ? "pointer-events-none opacity-50" : ""}`}>
              {logoUrl ? "Солих" : "Лого оруулах"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  setBusy(true);
                  try {
                    const data = await resizeToSquare(f);
                    save(() => saveLogo({ slug, data }), "Лого хадгалагдлаа");
                  } catch {
                    fail("Зургийг уншиж чадсангүй");
                  } finally {
                    setBusy(false);
                  }
                }} />
            </label>
            {logoUrl && (
              <button type="button" className={btnSecondary} disabled={pending} onClick={() => save(() => removeLogo({ slug }), "Лого устгагдлаа")}>Устгах</button>
            )}
          </div>
        </div>
      </div>
      {status}
    </Panel>
  );
}
