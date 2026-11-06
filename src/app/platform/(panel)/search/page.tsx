import Link from "next/link";
import { listTenantsForAdmin, listUsersForAdmin } from "@/db/admin";
import { matchesQuery } from "@/lib/search";
import { fmtDate, maskPhone } from "../fmt";
import { TenantList } from "../TenantList";

export default async function AdminSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const [tenants, users] = q ? await Promise.all([listTenantsForAdmin(), listUsersForAdmin(q)]) : [[], []];
  const found = tenants.filter((t) => matchesQuery(t, q));
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Хайлт{q ? `: “${q}”` : ""}</h1>
      {!q ? <p className="text-muted">Дээрх хайлтын талбарт бичнэ үү.</p> : (
        <>
          <h2 className="text-xl font-bold">Байгууллага ({found.length})</h2>
          <TenantList rows={found} />
          <h2 className="text-xl font-bold">Хэрэглэгч ({users.length})</h2>
          {users.length === 0 ? <p className="text-muted">Олдсонгүй.</p> : (
            <ul className="flex flex-col gap-2">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-muted">{maskPhone(u.phone)} · {u.tenants ?? "—"} · {fmtDate(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/" className="font-medium underline">← Тойм</Link>
        </>
      )}
    </>
  );
}
