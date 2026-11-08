/**
 * Өгөгдлийн загвар — tsag.smartuvs.mn
 *
 * Дүрэм:
 *  - Байгууллагын (tenant) өгөгдөлтэй хүснэгт бүр `tenant_id`-тай. Query бүр tenant-аар шүүгдэнэ
 *    (src/db/tenant.ts-ийн туслах функцуудыг ашигла).
 *  - Цагийг UTC-ээр (timestamptz) хадгална, tenant-ын `timezone`-оор харуулна.
 *  - Ажлын цаг (schedules) өдрийн минутаар: 540 = 09:00.
 *  - Төлбөр байхгүй. `services.price` зөвхөн мэдээлэл болгож харуулна.
 *  - Давхар захиалгыг drizzle/custom/booking_constraints.sql дахь exclusion constraint хориглоно.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { INDUSTRY_IDS } from "../lib/industries";

export const industryEnum = pgEnum("industry", INDUSTRY_IDS);
export const roleEnum = pgEnum("member_role", ["owner", "manager", "staff"]);
export const bookingModeEnum = pgEnum("booking_mode", ["staff", "resource"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending", // үүссэн, ажилтны батламж хүлээж буй
  "confirmed", // баталгаажсан
  "checked_in", // үйлчлүүлэгч ирсэн
  "completed", // дууссан
  "cancelled", // цуцлагдсан
  "no_show", // ирээгүй
]);
export const bookingSourceEnum = pgEnum("booking_source", ["online", "manual"]);
export const channelEnum = pgEnum("notification_channel", ["sms", "email", "push"]);
export const notificationStatusEnum = pgEnum("notification_status", ["scheduled", "sent", "failed", "cancelled"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** Байгууллагын бодлого — tenants.settings (jsonb) */
export type TenantSettings = {
  /** "auto" = сул цаг байвал шууд confirmed; "manual" = ажилтан батлах хүртэл pending */
  approval: "auto" | "manual";
  /** Хэдэн цагийн өмнө онлайнаар цуцалж болох */
  cancellationHours: number;
  /** Сул цагийн алхам, минут */
  slotStepMin: number;
  /** Хамгийн эрт: одооноос хэдэн минутын дараах цагийг захиалж болох */
  minLeadMin: number;
  /** Хамгийн хол: хэдэн хоногийн дараах хүртэл */
  maxAdvanceDays: number;
  /** Салбарын нэр томьёо: ажилтныг юу гэж нэрлэх */
  terminology: { staff: string };
  /** Захиалгын формд нэмэх асуулт (машины дугаар гэх мэт) */
  customFields: { key: string; label: string; required: boolean }[];
  /** tsag.smartuvs.mn нүүрний жагсаалтад харагдах эсэх. Байхгүй (хуучин мөр) = харагдана. */
  listed?: boolean;
  /** Шинэ онлайн захиалга орох бүрт байгууллагын утас (+ тухайн ажилтан) руу SMS. Байхгүй = илгээнэ. */
  notifyNewBookings?: boolean;
};

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  industry: industryEnum("industry").notNull(),
  bookingMode: bookingModeEnum("booking_mode").notNull().default("staff"),
  timezone: text("timezone").notNull().default("Asia/Hovd"),
  phone: text("phone"),
  address: text("address"),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").$type<TenantSettings>().notNull(),
  /** "pending" (админ хянаж буй) | "active" | "rejected" | "suspended" — src/lib/tenant-status.ts */
  status: text("status").notNull().default("active"),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("tenants_slug_uq").on(t.slug)]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull(),
  email: text("email"),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("users_phone_uq").on(t.phone)]);

export const memberships = pgTable("memberships", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.userId, t.tenantId] })]);

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  title: text("title"),
  color: text("color"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [index("staff_tenant_idx").on(t.tenantId)]);

/** Нөөц: авто угаалгын бокс, өрөө, аппарат. bookingMode = "resource" үед захиалга үүгээр явна. */
export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "bay" | "room" | ...
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [index("resources_tenant_idx").on(t.tenantId)]);

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  durationMin: integer("duration_min").notNull(),
  bufferMin: integer("buffer_min").notNull().default(0),
  /** Төгрөгөөр, зөвхөн мэдээлэл. null = үнэ харуулахгүй */
  price: integer("price"),
  priceFrom: boolean("price_from").notNull().default(false), // "₮80,000-аас"
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [index("services_tenant_idx").on(t.tenantId)]);

export const staffServices = pgTable("staff_services", {
  staffId: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.staffId, t.serviceId] })]);

/** Долоо хоногийн ердийн ажлын цаг. Ажилтан ЭСВЭЛ нөөцөд хамаарна. weekday: 0 = Ням ... 6 = Бямба */
export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").references(() => staff.id, { onDelete: "cascade" }),
  resourceId: uuid("resource_id").references(() => resources.id, { onDelete: "cascade" }),
  weekday: smallint("weekday").notNull(),
  startMin: smallint("start_min").notNull(),
  endMin: smallint("end_min").notNull(),
}, (t) => [index("schedules_staff_idx").on(t.staffId), index("schedules_resource_idx").on(t.resourceId)]);

/** Чөлөө, амралт, баяр, завсарлага */
export const timeOff = pgTable("time_off", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  staffId: uuid("staff_id").references(() => staff.id, { onDelete: "cascade" }),
  resourceId: uuid("resource_id").references(() => resources.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  reason: text("reason"),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  notes: text("notes"),
  noShowCount: integer("no_show_count").notNull().default(0),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("customers_tenant_phone_uq").on(t.tenantId, t.phone)]);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  serviceId: uuid("service_id").notNull().references(() => services.id),
  staffId: uuid("staff_id").references(() => staff.id),
  resourceId: uuid("resource_id").references(() => resources.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  /** Үйлчилгээ + buffer дуусах цаг. Давхардлыг үүгээр шалгана. */
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: bookingStatusEnum("status").notNull(),
  source: bookingSourceEnum("source").notNull().default("online"),
  /** Захиалгын формын нэмэлт хариулт (машины дугаар гэх мэт) */
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default(sql`'{}'::jsonb`),
  notes: text("notes"),
  cancelledBy: text("cancelled_by"), // "customer" | "staff"
  /** Цуцлах/шилжүүлэх холбоосны нууц токен (SMS-ээр явна) */
  manageToken: text("manage_token").notNull(),
  /** Богино код (X4K9M2) — үйлчлүүлэгчид харуулж, самбарт кодоор хайна. src/lib/booking-code.ts */
  code: text("code").notNull(),
  createdAt: createdAt(),
}, (t) => [
  index("bookings_tenant_start_idx").on(t.tenantId, t.startsAt),
  uniqueIndex("bookings_manage_token_uq").on(t.manageToken),
  uniqueIndex("bookings_tenant_code_uq").on(t.tenantId, t.code),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  channel: channelEnum("channel").notNull(),
  type: text("type").notNull(), // "created" | "confirmed" | "reminder_24h" | "reminder_2h" | "cancelled" | "rescheduled"
  sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
  status: notificationStatusEnum("status").notNull().default("scheduled"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  error: text("error"),
}, (t) => [index("notifications_due_idx").on(t.status, t.sendAt)]);

/** Нэвтэрсэн session. Cookie-д түүхий токен, санд зөвхөн sha256 hash-ийг хадгална. */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

/** OTP кодууд — кодыг hash хэлбэрээр хадгална */
export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  purpose: text("purpose").notNull(), // "booking" | "signup" | "login"
  attempts: smallint("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("otp_phone_idx").on(t.phone, t.createdAt)]);

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

/** Байгууллагын лого — жижигрүүлсэн зураг (≤ 300KB). /api/logo/<slug>-аар өгнө; tenants.logo_url = тэр хаяг. */
export const tenantLogos = pgTable("tenant_logos", {
  tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Байгууллага хаягаа (slug) сольсон үед хуучин хаяг → байгууллага.
 * Хэвлэсэн QR, тараасан холбоос ажилласаар байна: /<хуучин> → /<шинэ> руу шилжинэ.
 * Хуучин хаягийг өөр байгууллага авах боломжгүй (isSlugTaken хоёр хүснэгтийг шалгана).
 */
export const tenantSlugRedirects = pgTable("tenant_slug_redirects", {
  slug: text("slug").primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
}, (t) => [index("tenant_slug_redirects_tenant_idx").on(t.tenantId)]);

/** Платформын тохиргоо (key → JSON). Жишээ: "maintenance.tsag" = true → захиалгын хуудас "Засвартай". */
export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  diff: jsonb("diff"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("audit_action_entity_idx").on(t.action, t.entityId, t.at)]);
