"use server";
/** Super Admin үйлдлүүд — байгууллагыг идэвхгүй болгох / сэргээх. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setTenantStatus } from "@/db/admin";
import { recordEvent } from "@/db/users";
import { superAdminOrNull } from "./auth";

export type AdminResult = { ok: true } | { ok: false; message: string };

const Input = z.object({ tenantId: z.string().uuid(), status: z.enum(["active", "suspended"]) });

export async function changeTenantStatus(raw: unknown): Promise<AdminResult> {
  const admin = await superAdminOrNull();
  if (!admin) return { ok: false, message: "Эрх хүрэхгүй байна" };
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };

  const t = await setTenantStatus(parsed.data.tenantId, parsed.data.status);
  if (!t) return { ok: false, message: "Байгууллага олдсонгүй" };
  await recordEvent({
    action: parsed.data.status === "suspended" ? "tenant.suspend" : "tenant.activate",
    entity: "tenant",
    key: t.id,
    tenantId: t.id,
    actorId: admin.id,
  });
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/${t.slug}`);
  return { ok: true };
}
