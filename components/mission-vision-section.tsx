import { Target, Eye } from "lucide-react"

export function MissionVisionSection() {
  return (
    <section id="mission" className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Mission */}
          <div className="flex flex-col">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Target className="h-7 w-7" />
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#4db8e8]">
             Бидний эрхэм зорилго
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Илүү сайхан ирээдүйн төлөө ухаалаг системүүд
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Бид орон нутгийн төрийн болон хувийн хэвшлийн байгууллагуудад ухаалаг систем нэвтрүүлж, үйлчилгээний процессыг автоматжуулан, иргэдэд цаг хугацаа, зардал хэмнэсэн дижитал шийдлүүдийг хүргэнэ.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-[family-name:var(--font-heading)] text-3xl font-bold text-primary">141+</p>
                <p className="mt-1 text-sm text-muted-foreground">Төрийн үйлчилгээ</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[#4db8e8]">100%</p>
                <p className="mt-1 text-sm text-muted-foreground">Орон нутагт төвлөрсөн</p>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="flex flex-col">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#4db8e8] text-[#0b2a4a]">
              <Eye className="h-7 w-7" />
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#4db8e8]">
              Бидний эрхэм зорилго
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Увс аймагт дижитал шилжилтийг манлайлагч
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Увс аймагт дижитал шилжилтийн тэргүүлэгч платформ болж, орчин үеийн технологиор иргэн бүр, байгууллага бүрийг чадавхжуулсан ухаалаг орон нутгийн экосистемийг бий болгох.
            </p>
            <div className="mt-8 rounded-xl border border-[#4db8e8]/20 bg-[#4db8e8]/5 p-6">
              <div className="flex flex-col gap-4">
                {["Ухаалаг засаглалын дэд бүтэц", "Харилцан холбогдсон орон нутгийн экосистем", "Өргөтгөх боломжтой дижитал платформ"].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4db8e8]/20">
                        <div className="h-2 w-2 rounded-full bg-[#4db8e8]" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
