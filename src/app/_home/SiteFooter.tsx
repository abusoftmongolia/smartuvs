/** Footer — uvsmarket.mn-тэй ижил 4 багана */
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const CONTACT = { email: "info@smartuvs.mn", phone: "+97695866262", phoneLabel: "9586 6262" };

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="self-start"><BrandLogo logoClass="h-7" /></span>
          <p className="text-sm text-muted">Увс аймгийн онлайн цаг захиалгын төв. Үсчин, эмнэлэг, авто угаалга — сул цагаа хараад утаснаасаа захиална.</p>
        </div>
        <FooterCol title="Хаяг">
          <li className="text-muted">Улаангом сум, Увс аймаг, Монгол улс</li>
        </FooterCol>
        <FooterCol title="Холбоо барих">
          <li><a href={`tel:${CONTACT.phone}`} className="inline-flex min-h-11 items-center hover:underline">{CONTACT.phoneLabel}</a></li>
          <li><a href={`mailto:${CONTACT.email}`} className="inline-flex min-h-11 items-center hover:underline">{CONTACT.email}</a></li>
        </FooterCol>
        <FooterCol title="Байгууллагад">
          <li><Link href="/business" className="inline-flex min-h-11 items-center hover:underline">Танилцуулга</Link></li>
          <li><Link href="/signup" className="inline-flex min-h-11 items-center hover:underline">Байгууллагаа бүртгүүлэх</Link></li>
          <li><Link href="/admin/login" className="inline-flex min-h-11 items-center hover:underline">Байгууллага нэвтрэх</Link></li>
        </FooterCol>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">{new Date().getFullYear()} SmartUvs.mn. Бүх эрх хамгаалагдсан.</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="flex flex-col text-sm">{children}</ul>
    </div>
  );
}
