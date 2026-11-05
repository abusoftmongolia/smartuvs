/** tsag.smartuvs.mn/admin → байгууллагын самбар (нэвтрээгүй бол /admin/login) */
import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function TenantAdminEntry() {
  redirect((await currentUser()) ? "/dashboard" : "/admin/login");
}
