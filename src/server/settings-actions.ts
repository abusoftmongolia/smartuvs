"use server";
/**
 * Байгууллагын тохиргоо — зөвхөн эзэмшигч/менежер. Бүх query tenant-аар шүүгдэнэ.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import {
  deleteTimeOff,
  insertTimeOff,
  listAllOwners,
  replaceAllSchedules,
  updateTenantInfo,
  upsertOwner,
  upsertService,
  listTenantSchedules,
} from "@/db/tenant";
import { weekHoursProblem, weekHoursToWindows, windowsToWeekHours } from "@/lib/hours";
import { normalizePhone } from "@/lib/sms";
import { addDays, localToUtc } from "@/lib/time";
import { memberOrNull } from "./auth";

export type SettingsResult = { ok: true } | { ok: false; message: string };

const NO_ACCESS: SettingsResult = { ok: false, message: "Эрх хүрэхгүй байна" };
const Slug = z.string().min(1).max(64);
const Id = z.string().uuid();
const DateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function manager(slug: string) {
  return memberOrNull(slug, "manager");
}

async function audit(tenantId: string, actorId: string, action: string, entity: string, entityId: string | null, diff?: unknown) {
  await db().insert(schema.auditLogs).values({ tenantId, actorId, action, entity, entityId, diff: diff ?? null });
}

function done(slug: string): SettingsResult {
  revalidatePath(`/dashboard/${slug}`, "layout");
  revalidatePath(`/${slug}`);
  revalidatePath("/");
  return { ok: true };
}

// ── Байгууллагын мэдээлэл ба бодлого ──────────────────────────────────────

const InfoInput = z.object({
  slug: Slug,
  name: z.string().trim().min(2, "Нэр хэт богино").max(80),
  address: z.string().trim().max(160),
  phone: z.string().max(32),
  timezone: z.enum(["Asia/Hovd", "Asia/Ulaanbaatar"]),
  approval: z.enum(["auto", "manual"]),
  cancellationHours: z.number().int().min(0).max(168),
  slotStepMin: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30), z.literal(60)]),
  minLeadMin: z.number().int().min(0).max(7 * 24 * 60),
  maxAdvanceDays: z.number().int().min(1).max(365),
  listed: z.boolean(),
});

export async function saveTenantInfo(raw: unknown): Promise<SettingsResult> {
  const parsed = InfoInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу" };
  const i = parsed.data;
  const m = await manager(i.slug);
  if (!m) return NO_ACCESS;
  const phone = i.phone.trim() ? normalizePhone(i.phone) : null;
  if (i.phone.trim() && !phone) return { ok: false, message: "Утасны дугаар 8 оронтой байх ёстой" };

  await updateTenantInfo(m.tenant.id, {
    name: i.name,
    address: i.address || null,
    phone,
    timezone: i.timezone,
    settings: {
      ...m.tenant.settings,
      approval: i.approval,
      cancellationHours: i.cancellationHours,
      slotStepMin: i.slotStepMin,
      minLeadMin: i.minLeadMin,
      maxAdvanceDays: i.maxAdvanceDays,
      listed: i.listed,
    },
  });
  await audit(m.tenant.id, m.user.id, "tenant.update", "tenant", m.tenant.id);
  return done(i.slug);
}

// ── Үйлчилгээ ─────────────────────────────────────────────────────────────

const ServiceInput = z.object({
  slug: Slug,
  id: Id.optional(),
  name: z.string().trim().min(1, "Нэр оруулна уу").max(80),
  durationMin: z.number().int().min(5, "5 минутаас дээш").max(600),
  bufferMin: z.number().int().min(0).max(120),
  price: z.number().int().min(0).max(100_000_000).nullable(),
  active: z.boolean(),
});

export async function saveService(raw: unknown): Promise<SettingsResult> {
  const parsed = ServiceInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу" };
  const { slug, ...svc } = parsed.data;
  const m = await manager(slug);
  if (!m) return NO_ACCESS;
  const s = await upsertService(m.tenant.id, svc);
  if (!s) return { ok: false, message: "Үйлчилгээ олдсонгүй" };
  await audit(m.tenant.id, m.user.id, svc.id ? "service.update" : "service.create", "service", s.id);
  return done(slug);
}

// ── Ажилтан / бокс ────────────────────────────────────────────────────────

const OwnerInput = z.object({
  slug: Slug,
  id: Id.optional(),
  name: z.string().trim().min(1, "Нэр оруулна уу").max(60),
  title: z.string().trim().max(60).optional(),
  active: z.boolean(),
});

export async function saveOwner(raw: unknown): Promise<SettingsResult> {
  const parsed = OwnerInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу" };
  const { slug, ...o } = parsed.data;
  const m = await manager(slug);
  if (!m) return NO_ACCESS;
  const kind = m.tenant.bookingMode === "resource" ? "resource" : "staff";

  // Шинэ ажилтанд байгууллагын одоогийн ердийн цагийг онооно
  let defaultSchedule: { weekday: number; startMin: number; endMin: number }[] = [];
  if (!o.id) {
    const all = await listTenantSchedules(m.tenant.id);
    const owners = await listAllOwners(m.tenant.id, kind);
    const first = owners.find((x) => all.some((r) => (kind === "staff" ? r.staffId : r.resourceId) === x.id));
    defaultSchedule = first
      ? weekHoursToWindows(windowsToWeekHours(all.filter((r) => (kind === "staff" ? r.staffId : r.resourceId) === first.id)))
      : [];
  }
  const r = await upsertOwner(m.tenant.id, kind, { ...o, title: o.title || null }, defaultSchedule);
  if (!r) return { ok: false, message: "Олдсонгүй" };
  await audit(m.tenant.id, m.user.id, o.id ? "owner.update" : "owner.create", kind, r.id);
  return done(slug);
}

// ── Ажлын цаг ─────────────────────────────────────────────────────────────

const DaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  open: z.boolean(),
  start: z.number().int().min(0).max(1440),
  end: z.number().int().min(0).max(1440),
  breakStart: z.number().int().min(0).max(1440).nullable(),
  breakEnd: z.number().int().min(0).max(1440).nullable(),
});

export async function saveHours(raw: unknown): Promise<SettingsResult> {
  const parsed = z.object({ slug: Slug, hours: z.array(DaySchema).length(7) }).safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };
  const m = await manager(parsed.data.slug);
  if (!m) return NO_ACCESS;
  const problem = weekHoursProblem(parsed.data.hours);
  if (problem) return { ok: false, message: problem };
  const kind = m.tenant.bookingMode === "resource" ? "resource" : "staff";
  await replaceAllSchedules(m.tenant.id, kind, weekHoursToWindows(parsed.data.hours));
  await audit(m.tenant.id, m.user.id, "hours.update", "tenant", m.tenant.id);
  return done(parsed.data.slug);
}

// ── Чөлөө, баяр ───────────────────────────────────────────────────────────

const TimeOffInput = z.object({
  slug: Slug,
  ownerId: Id.nullable(), // null = бүх байгууллага амарна
  from: DateStr,
  to: DateStr,
  reason: z.string().trim().max(120).optional(),
});

export async function addTimeOff(raw: unknown): Promise<SettingsResult> {
  const parsed = TimeOffInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };
  const i = parsed.data;
  if (i.to < i.from) return { ok: false, message: "Дуусах өдөр эхлэхээсээ өмнө байна" };
  const m = await manager(i.slug);
  if (!m) return NO_ACCESS;
  const kind = m.tenant.bookingMode === "resource" ? "resource" : "staff";
  if (i.ownerId) {
    const owners = await listAllOwners(m.tenant.id, kind);
    if (!owners.some((o) => o.id === i.ownerId)) return { ok: false, message: "Олдсонгүй" };
  }
  const tz = m.tenant.timezone;
  const r = await insertTimeOff({
    tenantId: m.tenant.id,
    staffId: kind === "staff" ? i.ownerId : null,
    resourceId: kind === "resource" ? i.ownerId : null,
    startsAt: localToUtc(i.from, 0, tz),
    endsAt: localToUtc(addDays(i.to, 1), 0, tz),
    reason: i.reason || null,
  });
  await audit(m.tenant.id, m.user.id, "timeoff.create", "time_off", r.id);
  return done(i.slug);
}

export async function removeTimeOff(raw: unknown): Promise<SettingsResult> {
  const parsed = z.object({ slug: Slug, id: Id }).safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Мэдээлэл буруу" };
  const m = await manager(parsed.data.slug);
  if (!m) return NO_ACCESS;
  await deleteTimeOff(m.tenant.id, parsed.data.id);
  await audit(m.tenant.id, m.user.id, "timeoff.delete", "time_off", parsed.data.id);
  return done(parsed.data.slug);
}
