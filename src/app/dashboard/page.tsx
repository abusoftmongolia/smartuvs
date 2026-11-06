import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listUserTenants } from "@/db/users";
import { requireUser } from "@/server/auth";
import { logout } from "@/server/auth-actions";

const ROLE_MN = { owner: "Эзэмшигч", manager: "Менежер", staff: "Ажилтан" } as const;

export default async function DashboardHome() {
  const user = await requireUser();
  const list = await listUserTenants(user.id);
  if (list.length === 1) redirect(`/dashboard/${list[0].slug}`);

  return (
    <div className="min-h-dvh bg-[#fcfcfc]">
    <header className="flex h-14 items-center justify-between gap-3 border-b border-line bg-white px-4">
      <Link href="/dashboard" aria-label="Самбар"><Image src="/smartuvs-logo.png" alt="SmartUvs.mn" width={1200} height={175} className="h-6 w-auto" priority /></Link>
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
        <form action={logout}><button className="inline-flex min-h-10 items-center rounded-lg border border-line px-3.5 text-sm font-medium">Гарах</button></form>
      </div>
    </header>
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-bold">Байгууллага сонгох</h1>
      {list.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5">
          <p className="text-muted">Та одоогоор ямар нэг байгууллагын гишүүн биш байна.</p>
          <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-card bg-brand font-semibold text-ink">
            Байгууллага бүртгүүлэх
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((t) => (
            <li key={t.id}>
              <Link href={`/dashboard/${t.slug}`} className="flex min-h-14 items-center justify-between rounded-card border border-line bg-white px-4 hover:border-ink/30">
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-muted">{ROLE_MN[t.role]}{t.status !== "active" ? " · идэвхгүй" : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
    </div>
  );
}
