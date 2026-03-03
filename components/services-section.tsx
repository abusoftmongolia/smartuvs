import { Button } from "@/components/ui/button"
import {
  FileText,
  Building2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Truck,
} from "lucide-react"
import { ArrowRight } from "lucide-react"

const services = [
  {
    icon: FileText,
    title: "Баримт бичиг боловсруулах",
    description:
      "Иргэдэд үзүүлэх үйлчилгээг хурдасгах зорилготой баримт бичгийг автоматаар боловсруулах, баталгаажуулах системүүд.",
  },
  {
    icon: Building2,
    title: "Төрийн цахим үйлчилгээний нэгдсэн портал",
    description:
      "Иргэдийг орон нутгийн төрийн үйлчилгээ болон мэдээлэлтэй шууд, төвлөрсөн байдлаар холбох нэгдсэн дижитал платформ.",
  },
  {
    icon: GraduationCap,
    title: "Дижитал боловсролын системүүд",
    description:
      "Сургалтын үйл явцыг шинэчлэх зорилготой орон нутгийн сургууль, боловсролын байгууллагуудад зориулсан дижитал платформууд.",
  },
  {
    icon: HeartPulse,
    title: "Эрүүл мэндийн системийн уялдаа холбоо",
    description:
      "Эмнэлэг, клиник болон иргэдийг дижитал орчинд холбосон ухаалаг эрүүл мэндийн үйлчилгээний удирдлагын систем.",
  },
  {
    icon: Landmark,
    title: "Ухаалаг чатбот",
    description:
      "Орон нутгийн төрийн байгууллага, агентлагуудад бүрдүүлэх материалын жагсаалтыг иргэдэд хүргэх систем",
  },
  {
    icon: Truck,
    title: "Ложистик ба ханган нийлүүлэлт",
    description:
      "Орон нутгийн нийлүүлэлтийн сүлжээ болон ложистикийн сүлжээг хянах, удирдах дижитал системүүд.",
  },
]

export function ServicesSection() {
  return (
    <section id="services" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#4db8e8]">
            Манай үйлчилгээ
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Салбар бүрт зориулсан дижитал шийдлүүд
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
           Увс аймгийн төрийн болон хувийн хэвшлийн байгууллагуудад зориулсан, цогц дижитал үйлчилгээний багц.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-[#4db8e8]/40 hover:shadow-lg hover:shadow-[#4db8e8]/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-[#4db8e8] transition-colors group-hover:bg-[#4db8e8]/10">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-card-foreground">
                {service.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
              <Button
                variant="ghost"
                className="mt-4 w-fit p-0 text-sm font-medium text-[#4db8e8] hover:text-primary hover:bg-transparent gap-1"
              >
                Дэлгэрэнгүй
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
