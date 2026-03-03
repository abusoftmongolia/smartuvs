import { Button } from "@/components/ui/button"
import { ArrowRight, MessageCircle } from "lucide-react"

export function CTASection() {
  return (
    <section id="contact" className="relative overflow-hidden bg-primary py-20 lg:py-28">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl text-balance">
         Дижитал шилжилтээ яг одоо эхлүүл!
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/80">
         Байгууллагадаа ухаалаг дижитал шийдлийг нэвтрүүлэхийн тулд Smart Uvs-тэй хамтран ажиллаарай. Илүү ухаалаг, илүү үр ашигтай ирээдүйг хамтдаа бүтээцгээе.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-[#4db8e8] text-[#0b2a4a] font-semibold hover:bg-[#3da8d8] gap-2 px-8"
          >
            <a href="mailto:info@smartuvs.mn">
              Холбоо барих
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2 px-8"
          >
            <a href="mailto:info@smartuvs.mn">
              <MessageCircle className="h-4 w-4" />
              Манай багтай холбогдох
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
