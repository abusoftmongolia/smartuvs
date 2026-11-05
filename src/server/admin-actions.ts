"use server";
/** Super Admin үйлдлүүд — байгууллага батлах/татгалзах/хаах/нээх, засварын горим. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTenantById, setTenantStatus } from "@/db/admin";
import { setSetting } from "@/db/platform";
import { recordEvent } from "@/db/users";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { sms, smsText } from "@/lib/sms";
import { nextTenantStatus } from "@/lib/tenant-status";
import { superAdminOrNull } from "./auth";

export type AdminResult = { ok: true } | { ok: false; message: string };

const NO_ACCESS: AdminResult = { ok: false, message: "Эрх хүрэхгүй байна" };

const Input = z.object({ tenantId: z.string().uuid(), action: z.enum(["approve", "reject", "suspend", "activate"]) });

async function ownerPhone(tenantId: string) {
  const [r] = await db()
    .select({ phone: schema.users.phone })
    .from(schema.memberships)
    .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
    .where(and(eq(schema.memberships.tenantId, tenantId), eq(schema.memberships.role, "owner")))
    .limit(1);
  return r?.phone ?? null;
}

export async function tenantAction(raw: unknown): Promise<AdminResult> {
  const admin = await superAdminOrNull();
  if (!admin) return NO_ACCESS;
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };
  const { tenantId, action } = parsed.data;

  const before = await getTenantById(tenantId);
  if (!before) return { ok: false, message: "Байгууллага олдсонгүй" };
  const to = nextTenantStatus(before.status, action);
  if (!to) return { ok: false, message: "Энэ төлөвт тухайн үйлдэл хийх боломжгүй. Хуудсаа шинэчилнэ үү." };

  const t = await setTenantStatus(tenantId, to);
  if (!t) return { ok: false, message: "Байгууллага олдсонгүй" };
  await recordEvent({ action: `tenant.${action}`, entity: "tenant", key: t.id, tenantId: t.id, actorId: admin.id });

  // Эзэмшигчид мэдэгдэнэ (батлах/татгалзах үед)
  if (action === "approve" || action === "reject") {
    const phone = await ownerPhone(t.id);
    if (phone) {
      const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn").replace(/\/$/, "");
      const text = action === "approve"
        ? smsText.tenantApproved({ tenant: t.name, link: `${site}/${t.slug}` })
        : smsText.tenantRejected({ tenant: t.name });
      await sms().send(phone, text).catch((e) => console.error("[sms] tenant", e));
    }
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath(`/${t.slug}`);
  return { ok: true };
}

const MaintInput = z.object({ system: z.literal("tsag"), on: z.boolean() });

/** Дэд системийг "Засвартай" болгох / сэргээх */
export async function setMaintenance(raw: unknown): Promise<AdminResult> {
  const admin = await superAdminOrNull();
  if (!admin) return NO_ACCESS;
  const parsed = MaintInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };
  await setSetting(`maintenance.${parsed.data.system}`, parsed.data.on);
  await recordEvent({ action: parsed.data.on ? "maintenance.on" : "maintenance.off", entity: "system", key: parsed.data.system, actorId: admin.id });
  revalidatePath("/", "layout");
  return { ok: true };
}
