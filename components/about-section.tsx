import { Cpu, Cog, Globe, Users } from "lucide-react"

const features = [
  {
    icon: Cpu,
    title: "Ухаалаг системүүд",
    description:
      "Төрийн үйлчилгээг орчин үеийн технологитой холбосон ухаалаг платформууд нь иргэдэд саадгүй туршлага өгөх болно.",
  },
  {
    icon: Cog,
    title: "Процессын автоматжуулалт",
    description:
      "Гарын ажиллагааг багасгаж, саатлыг арилган, үйлчилгээний хүргэлтийг хурдасгах автоматжуулсан ажлын урсгалууд.",
  },
  {
    icon: Globe,
    title: "Дижитал үйлчилгээ",
    description:
      "Төрийн үйлчилгээг иргэдэд хаанаас ч, хэзээ ч шууд хүргэх онлайн портал болон дижитал хэрэгслүүд.",
  },
  {
    icon: Users,
    title: "Нийгмийн үр өгөөж",
    description:
      "Орон нутгийн иргэдэд зориулж боловсруулсан шийдлүүд нь цаг хугацаа хэмнэж, зардлыг бууруулж, амьдралын чанарыг сайжруулна.",
  },
]

export function AboutSection() {
  return (
    <section id="about" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#4db8e8]">
            Бид юу хийдэг вэ ?
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Орон нутгийн дижитал өөрчлөлтийг идэвхжүүлэх
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
           Ухаалаг Увс төсөл нь орон нутгийн засаг захиргаа, хувийн хэвшлийн байгууллагуудад ухаалаг системийг нэвтрүүлж, үйлчилгээний үйл явцыг автоматжуулж, иргэдийн цаг, зардлыг хэмнэсэн дижитал шийдлүүдийг хүргэж байна.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-[#4db8e8]/40 hover:shadow-lg hover:shadow-[#4db8e8]/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-[#4db8e8] transition-colors group-hover:bg-[#4db8e8]/10">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
