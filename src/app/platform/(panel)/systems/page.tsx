import { isTsagMaintenance } from "@/db/platform";
import { SystemsCard } from "../Systems";

export default async function AdminSystems() {
  return (
    <>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Дэд системүүд</h1>
        <p className="mt-1 text-[15px] text-muted">SmartUvs платформын системүүд. Шинэ систем холбогдоход энд нэмэгдэнэ.</p>
      </div>
      <div className="max-w-2xl"><SystemsCard tsagMaintenance={await isTsagMaintenance()} /></div>
    </>
  );
}
