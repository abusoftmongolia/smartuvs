/**
 * Салбарын preset — байгууллага бүртгүүлэхэд салбараа сонгоход автоматаар бөглөгдөнө.
 * Шинэ салбар нэмэхэд код биш, энэ жагсаалтад нэг мөр нэмнэ.
 * Үнийг санаатайгаар оруулаагүй — байгууллага өөрөө бөглөнө (заавал биш).
 */
import type { TenantSettings } from "@/db/schema";

export type Industry = "barber" | "beauty" | "carwash" | "clinic" | "other";

export type IndustryPreset = {
  id: Industry;
  label: string;
  bookingMode: "staff" | "resource";
  terminology: { staff: string; staffGenitive: string };
  services: { name: string; durationMin: number; bufferMin: number }[];
  customFields: TenantSettings["customFields"];
  approval: TenantSettings["approval"];
};

export const INDUSTRY_PRESETS: Record<Industry, IndustryPreset> = {
  barber: {
    id: "barber",
    label: "Үсчин",
    bookingMode: "staff",
    terminology: { staff: "Үсчин", staffGenitive: "Үсчний" },
    services: [
      { name: "Эрэгтэй үс засалт", durationMin: 30, bufferMin: 5 },
      { name: "Эмэгтэй үс засалт", durationMin: 45, bufferMin: 5 },
      { name: "Үс будах", durationMin: 90, bufferMin: 10 },
      { name: "Сахал засах", durationMin: 20, bufferMin: 5 },
    ],
    customFields: [],
    approval: "auto",
  },
  beauty: {
    id: "beauty",
    label: "Гоо сайхан",
    bookingMode: "staff",
    terminology: { staff: "Мастер", staffGenitive: "Мастерын" },
    services: [
      { name: "Нүүр арчилгаа", durationMin: 60, bufferMin: 10 },
      { name: "Маникюр", durationMin: 60, bufferMin: 10 },
      { name: "Сормуус суулгах", durationMin: 90, bufferMin: 10 },
      { name: "Хөмсөг засах", durationMin: 30, bufferMin: 5 },
    ],
    customFields: [],
    approval: "auto",
  },
  carwash: {
    id: "carwash",
    label: "Авто угаалга",
    bookingMode: "resource", // үйлчлүүлэгч ажилтан биш, сул боксоор захиална
    terminology: { staff: "Бокс", staffGenitive: "Боксын" },
    services: [
      { name: "Гадна угаалга", durationMin: 30, bufferMin: 5 },
      { name: "Бүтэн угаалга", durationMin: 60, bufferMin: 10 },
      { name: "Салон цэвэрлэгээ", durationMin: 90, bufferMin: 10 },
      { name: "Хөдөлгүүр угаах", durationMin: 40, bufferMin: 5 },
    ],
    customFields: [
      { key: "plate", label: "Машины дугаар", required: true },
      { key: "carType", label: "Машины төрөл (суудлын, жийп, микро)", required: false },
    ],
    approval: "auto",
  },
  clinic: {
    id: "clinic",
    label: "Эмнэлэг",
    bookingMode: "staff",
    terminology: { staff: "Эмч", staffGenitive: "Эмчийн" },
    services: [
      { name: "Анхан үзлэг", durationMin: 20, bufferMin: 5 },
      { name: "Давтан үзлэг", durationMin: 15, bufferMin: 5 },
      { name: "Зөвлөгөө", durationMin: 30, bufferMin: 5 },
    ],
    // Хамгийн бага мэдээлэл: шинж тэмдгийг заавал асуухгүй
    customFields: [{ key: "reason", label: "Үзүүлэх шалтгаан (заавал биш)", required: false }],
    approval: "manual", // эмч гараар батална
  },
  other: {
    id: "other",
    label: "Бусад",
    bookingMode: "staff",
    terminology: { staff: "Ажилтан", staffGenitive: "Ажилтны" },
    services: [],
    customFields: [],
    approval: "auto",
  },
};

export function defaultSettings(industry: Industry): TenantSettings {
  const p = INDUSTRY_PRESETS[industry];
  return {
    approval: p.approval,
    cancellationHours: 3,
    slotStepMin: 15,
    minLeadMin: 60,
    maxAdvanceDays: 60,
    terminology: { staff: p.terminology.staff },
    customFields: p.customFields,
    listed: true,
  };
}
