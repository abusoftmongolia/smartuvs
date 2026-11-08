import { redirect } from "next/navigation";

/** Хуучин хаяг (/tenants) → /tsag/tenants. Хадгалсан холбоос, мэдэгдлийн линк ажилласаар байна. */
export default async function Moved({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const q = new URLSearchParams(await searchParams).toString();
  redirect(`/tsag/tenants${q ? `?${q}` : ""}`);
}
