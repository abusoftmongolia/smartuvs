import { getSiteConfig } from "@/db/platform";
import { Panel } from "../../dash";
import { IndustriesForm, TilesForm } from "./forms";

export default async function TsagCategories() {
  const cfg = await getSiteConfig();
  return (
    <>
      <div>
        <p className="text-sm font-medium text-muted">Цаг захиалга</p>
        <h1 className="text-3xl font-bold tracking-tight">Ангилал</h1>
        <p className="mt-1 text-sm text-muted">Нүүр хуудасны салбарын нэр, дараалал, харагдах эсэх ба том ангиллын хавтангууд</p>
      </div>
      <Panel id="h-industries" title="Салбарууд">
        <IndustriesForm initial={cfg.industries} />
      </Panel>
      <Panel id="h-tiles" title="Нүүрний ангиллын хавтан">
        <TilesForm initial={cfg.tiles} industries={cfg.industries.map((i) => ({ id: i.id, label: i.label }))} />
      </Panel>
    </>
  );
}
