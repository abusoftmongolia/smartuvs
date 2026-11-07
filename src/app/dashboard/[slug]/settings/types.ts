/** Удирдах хуудсуудын (тохиргоо, үйлчилгээ, ажилтан, цаг) өгөгдлийн төрлүүд — server (data.ts) ба client аль алинд */
export type Info = {
  name: string;
  address: string;
  phone: string;
  timezone: "Asia/Hovd" | "Asia/Ulaanbaatar";
  approval: "auto" | "manual";
  cancellationHours: number;
  slotStepMin: number;
  minLeadMin: number;
  maxAdvanceDays: number;
  listed: boolean;
  notifyNewBookings: boolean;
};
export type Svc = { id?: string; name: string; durationMin: number; bufferMin: number; price: number | null; active: boolean };
export type Owner = { id?: string; name: string; title: string; active: boolean };
export type Off = { id: string; from: string; to: string; partial: boolean; owner: string | null; reason: string | null };
