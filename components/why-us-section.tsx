import { MapPin, Handshake, TrendingUp, Network } from "lucide-react"

const reasons = [
  {
    icon: MapPin,
    title: "Орон нутгийн мэргэжлийн туршлага",
    description:
      "Увс аймгийн хэрэгцээ, соёл, дэд бүтцийн онцлогийг гүнзгий ойлгосноор тухайн нөхцөлд тохирсон шийдлүүдийг хэрэгжүүлнэ.",
  },
  {
    icon: Handshake,
    title: "Төрийн байгууллагатай хамтран ажиллах чадавхтай",
    description:
      "Орон нутгийн төрийн байгууллагын ажлын урсгал, бодлого, аюулгүй байдлын стандартад саадгүй уялдахаар бүтээгдсэн.",
  },
  {
    icon: TrendingUp,
    title: "Өргөтгөх боломжтой дижитал системүүд",
    description:
      "Туршилтын төслөөс бүрэн нэвтрүүлэлт хүртэл байгууллагынхаа өсөлттэй уялдан хөгжих, ирээдүйд нийцсэн архитектур.",
  },
  {
    icon: Network,
    title: "Урт хугацааны экосистемийн алсын хараа",
    description:
      "Олон жилийн турш нийт орон нутагт үр өгөөжөө өгөх, харилцан холбогдсон ухаалаг экосистемийг бий болгоход тууштайгаар зорьж ажиллана.",
  },
]

export function WhyUsSection() {
  return (
    <section id="why-us" className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#4db8e8]">
            Яагаад Smart Uvs-ийг сонгох вэ?
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Орон нутгийн байгууллагуудын итгэлийг хүлээсэн
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Бид орон нутгийн бодит ойлголт, туршлагыг дэвшилтэт технологитой хослуулан, бодит үр дүн авчрах шийдлүүдийг хэрэгжүүлдэг.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border text-primary shadow-sm">
                <reason.icon className="h-7 w-7" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
