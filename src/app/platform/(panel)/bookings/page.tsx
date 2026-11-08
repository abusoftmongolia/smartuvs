import { redirect } from "next/navigation";

/** Хуучин хаяг (/bookings) → /tsag/bookings. Хадгалсан холбоос, мэдэгдлийн линк ажилласаар байна. */
export default async function Moved({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const q = new URLSearchParams(await searchParams).toString();
  redirect(`/tsag/bookings${q ? `?${q}` : ""}`);
}
