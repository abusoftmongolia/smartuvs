/**
 * Салбарын preset — байгууллага бүртгүүлэхэд салбараа сонгоход автоматаар бөглөгдөнө.
 * Шинэ салбар нэмэхэд код биш, энэ жагсаалтад нэг мөр нэмнэ.
 * Үнийг санаатайгаар оруулаагүй — байгууллага өөрөө бөглөнө (заавал биш).
 */
import type { TenantSettings } from "@/db/schema";
import type { Industry } from "./industries";

export { INDUSTRY_IDS, type Industry } from "./industries";

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
  nails: {
    id: "nails",
    label: "Хумс арчилгаа",
    bookingMode: "staff",
    terminology: { staff: "Мастер", staffGenitive: "Мастерын" },
    services: [
      { name: "Маникюр", durationMin: 60, bufferMin: 10 },
      { name: "Гель будаг", durationMin: 75, bufferMin: 10 },
      { name: "Педикюр", durationMin: 60, bufferMin: 10 },
      { name: "Хумс суулгах", durationMin: 120, bufferMin: 10 },
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
  dental: {
    id: "dental",
    label: "Шүдний эмнэлэг",
    bookingMode: "staff",
    terminology: { staff: "Эмч", staffGenitive: "Эмчийн" },
    services: [
      { name: "Үзлэг, зөвлөгөө", durationMin: 20, bufferMin: 10 },
      { name: "Шүд цэвэрлэгээ", durationMin: 45, bufferMin: 10 },
      { name: "Ломбо", durationMin: 60, bufferMin: 10 },
      { name: "Шүд авах", durationMin: 30, bufferMin: 10 },
    ],
    // Хамгийн бага мэдээлэл: шинж тэмдгийг заавал асуухгүй
    customFields: [{ key: "reason", label: "Үзүүлэх шалтгаан (заавал биш)", required: false }],
    approval: "manual",
  },
  fitness: {
    id: "fitness",
    label: "Фитнесс",
    bookingMode: "staff",
    terminology: { staff: "Дасгалжуулагч", staffGenitive: "Дасгалжуулагчийн" },
    services: [
      { name: "Хувийн дасгал", durationMin: 60, bufferMin: 0 },
      { name: "Анхны уулзалт, хэмжилт", durationMin: 30, bufferMin: 0 },
      { name: "Иога", durationMin: 60, bufferMin: 0 },
    ],
    customFields: [],
    approval: "auto",
  },
  photo: {
    id: "photo",
    label: "Гэрэл зурагчин",
    bookingMode: "staff",
    terminology: { staff: "Зурагчин", staffGenitive: "Зурагчны" },
    services: [
      { name: "Хөрөг зураг", durationMin: 30, bufferMin: 10 },
      { name: "Гэр бүлийн зураг", durationMin: 60, bufferMin: 15 },
      { name: "Бичиг баримтын зураг", durationMin: 10, bufferMin: 5 },
    ],
    customFields: [],
    approval: "auto",
  },
  education: {
    id: "education",
    label: "Сургалтын төв",
    bookingMode: "staff",
    terminology: { staff: "Багш", staffGenitive: "Багшийн" },
    services: [
      { name: "Ганцаарчилсан хичээл", durationMin: 60, bufferMin: 0 },
      { name: "Түвшин тогтоох шалгалт", durationMin: 30, bufferMin: 0 },
      { name: "Зөвлөгөө", durationMin: 20, bufferMin: 0 },
    ],
    customFields: [],
    approval: "auto",
  },
  consulting: {
    id: "consulting",
    label: "Зөвлөх үйлчилгээ",
    bookingMode: "staff",
    terminology: { staff: "Зөвлөх", staffGenitive: "Зөвлөхийн" },
    services: [
      { name: "Анхны уулзалт", durationMin: 30, bufferMin: 10 },
      { name: "Зөвлөгөө (1 цаг)", durationMin: 60, bufferMin: 10 },
    ],
    customFields: [],
    approval: "manual",
  },
  pet: {
    id: "pet",
    label: "Тэжээвэр амьтан",
    bookingMode: "staff",
    terminology: { staff: "Мастер", staffGenitive: "Мастерын" },
    services: [
      { name: "Угаалга", durationMin: 60, bufferMin: 10 },
      { name: "Үс засалт", durationMin: 90, bufferMin: 10 },
      { name: "Хумс тайрах", durationMin: 20, bufferMin: 5 },
    ],
    customFields: [{ key: "pet", label: "Амьтны төрөл, үүлдэр", required: true }],
    approval: "auto",
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
