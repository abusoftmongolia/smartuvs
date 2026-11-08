import { getSiteConfig } from "@/db/platform";
import { expandMenu, visibleIndustries } from "@/lib/site-config";
import { Panel } from "../../dash";
import { MenuForm } from "./MenuForm";

export default async function TsagMenu() {
  const cfg = await getSiteConfig();
  const preview = expandMenu(cfg.menu, visibleIndustries(cfg.industries));
  return (
    <>
      <div>
        <p className="text-sm font-medium text-muted">Цаг захиалга</p>
        <h1 className="text-3xl font-bold tracking-tight">Үндсэн цэс</h1>
        <p className="mt-1 text-sm text-muted">tsag.smartuvs.mn нүүр хуудасны толгой дахь цэс</p>
      </div>
      <Panel id="h-preview" title="Одоогийн цэс">
        <ul aria-label="Цэсийн урьдчилсан харагдац" className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-[#f7f7f7] px-2">
          {preview.map((l, i) => (
            <li key={l.key} className={`flex-none ${l.accent && !preview[i - 1]?.accent ? "ml-auto" : ""}`}>
              <span className={`inline-flex min-h-11 items-center whitespace-nowrap px-3 text-sm ${l.accent ? "font-medium text-brand-deep" : l.icon ? "font-medium" : ""}`}>{l.label}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel id="h-menu" title="Цэсийн мөрүүд">
        <MenuForm initial={cfg.menu.items} />
      </Panel>
    </>
  );
}
