"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SlugField } from "@/components/SlugField";
import { btnPrimary } from "@/components/ui";
import { changeTenantSlugAction } from "@/server/slug-actions";
import { Panel } from "../../PageHeader";
import { useSave } from "./shared";

/** Захиалгын хуудасны хаягийг солих. Хуучин хаяг (хэвлэсэн QR, тараасан холбоос) шинэ рүү автоматаар шилжинэ. */
export function SlugForm({ slug, siteUrl }: { slug: string; siteUrl: string }) {
  const router = useRouter();
  const { pending, save, status } = useSave();
  const [value, setValue] = useState(slug);
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <Panel id="h-slug" title="Захиалгын хуудасны хаяг" subtitle={`Одоогийн хаяг: ${host}/${slug}`}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save(
            async () => {
              const r = await changeTenantSlugAction({ slug: value, currentSlug: slug });
              return r.ok ? { ok: true } : r;
            },
            "Хаяг солигдлоо",
            () => router.replace(`/dashboard/${value}/settings`),
          );
        }}
      >
        <SlugField id="tenant-slug" value={value} onChange={setValue} currentSlug={slug} host={host} label="Шинэ хаяг" />
        <p className="rounded-xl bg-ground p-3 text-sm text-muted">
          Хуучин хаяг болон хэвлэсэн QR постер ажилласаар байна — шинэ хаяг руу автоматаар шилжинэ. Хоногт 3 удаа хүртэл солино.
        </p>
        {status}
        <button type="submit" disabled={pending || value === slug} className={`${btnPrimary} self-start`}>
          {pending ? "Түр хүлээнэ үү…" : "Хаягийг солих"}
        </button>
      </form>
    </Panel>
  );
}
