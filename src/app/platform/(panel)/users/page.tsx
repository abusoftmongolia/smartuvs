import { listUsersForAdmin } from "@/db/admin";
import { fmtDate, maskPhone } from "../fmt";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const users = await listUsersForAdmin(q);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Хэрэглэгчид</h1>
          <p className="mt-1 text-[15px] text-muted">Байгууллагын эзэмшигч, ажилтнууд · {users.length}</p>
        </div>
        <form action="/users" className="flex min-w-60 flex-1 sm:max-w-sm">
          <label htmlFor="uq" className="sr-only">Хэрэглэгч хайх</label>
          <input id="uq" name="q" type="search" defaultValue={q} placeholder="Нэр эсвэл утас…"
            className="min-h-11 w-full rounded-xl border-[1.5px] border-line bg-white px-3 text-[15px]" />
        </form>
      </div>
      <div className="overflow-x-auto rounded-[22px] border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-[15px]">
          <thead className="border-b border-line text-xs font-bold uppercase tracking-wider text-muted">
            <tr><th className="px-5 py-3">Нэр</th><th className="px-3 py-3">Утас</th><th className="px-3 py-3">Байгууллага</th><th className="px-5 py-3">Бүртгүүлсэн</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-b-0">
                <td className="px-5 py-4 font-bold">
                  {u.name}
                  {u.isSuperAdmin && <span className="ml-2 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-bold text-brand">АДМИН</span>}
                </td>
                <td className="px-3 py-4 tabular-nums">{maskPhone(u.phone)}</td>
                <td className="px-3 py-4 text-muted">{u.tenants ?? "—"}</td>
                <td className="px-5 py-4 tabular-nums">{fmtDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-muted">Хэрэглэгч олдсонгүй.</p>}
      </div>
    </>
  );
}
