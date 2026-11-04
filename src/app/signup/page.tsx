import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { currentUser } from "@/server/auth";
import { SignupWizard } from "./SignupWizard";

export const metadata: Metadata = {
  title: "Байгууллагаа бүртгүүлэх",
  description: "5 минутад бүртгүүлээд tsag.smartuvs.mn/таны-нэр хаягтай онлайн цаг захиалгатай болно.",
};
export const dynamic = "force-dynamic";

/** Байгууллага өөрөө бүртгүүлэх: бүртгэл → байгууллага → үйлчилгээ+цаг → ажилтан → Бэлэн */
export default async function SignupPage() {
  const user = await currentUser();
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <SignupWizard loggedInAs={user ? user.name : null} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "https://tsag.smartuvs.mn"} />
      </main>
    </div>
  );
}
