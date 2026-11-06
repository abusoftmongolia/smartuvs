import { listPendingBookings } from "@/db/tenant";
import { listUserTenants } from "@/db/users";
import { requireMember } from "@/server/auth";
import { DashShell } from "../DashShell";

export default async function TenantDashLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, tenant, role } = await requireMember(slug);
  const [pending, tenants] = await Promise.all([listPendingBookings(tenant.id), listUserTenants(user.id)]);
  return (
    <DashShell
      slug={tenant.slug}
      tenantName={tenant.name}
      userName={user.name}
      staffTerm={tenant.settings.terminology.staff}
      canManage={role === "owner" || role === "manager"}
      pendingCount={pending.length}
      multiTenant={tenants.length > 1}
    >
      {children}
    </DashShell>
  );
}
