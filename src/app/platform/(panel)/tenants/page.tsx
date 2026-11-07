import Link from "next/link";
import { listTenantsForAdmin } from "@/db/admin";
import { matchesQuery } from "@/lib/search";
import { TENANT_STATUS_MN, type TenantStatus } from "@/lib/tenant-status";
import { TenantList } from "../TenantList";

const FILTERS: { id: "all" | TenantStatus; label: string }[] = [
  { id: "all", label: "Бүгд" },
  { id: "pending", label: TENANT_STATUS_MN.pending },
  { id: "active", label: TENANT_STATUS_MN.active },
  { id: "suspended", label: TENANT_STATUS_MN.suspended },
  { id: "rejected", label: TENANT_STATUS_MN.rejected },
];

export default async function AdminTenants({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "all", q = "" } = await searchParams;
  const all = await listTenantsForAdmin();
  const rows = all.filter((t) => (status === "all" || t.status === status) && matchesQuery(t, q));
  const count = (s: string) => (s === "all" ? all.length : all.filter((t) => t.status === s).length);

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Байгууллагууд</h1>
        <p className="mt-1 text-sm text-muted">tsag.smartuvs.mn · шинэ бүртгэлийг батлах, хаах</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const on = status === f.id;
          const href = `/tenants?${new URLSearchParams({ ...(f.id !== "all" ? { status: f.id } : {}), ...(q ? { q } : {}) })}`;
          return (
            <Link key={f.id} href={href} aria-current={on ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-semibold ${on ? "border-ink bg-brand text-ink" : "border-line bg-white"}`}>
              {f.label}<span className="tabular-nums text-muted">{count(f.id)}</span>
            </Link>
          );
        })}
        <form className="ml-auto flex min-w-60 flex-1 sm:max-w-sm" action="/tenants">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <label htmlFor="tq" className="sr-only">Байгууллага хайх</label>
          <input id="tq" name="q" type="search" defaultValue={q} placeholder="Нэр, хаяг…"
            className="min-h-11 w-full rounded-xl border-[1.5px] border-line bg-white px-3 text-base" />
        </form>
      </div>
      <TenantList rows={rows} />
    </>
  );
}
