import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-primary pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Subtle tech pattern overlay */}
      <div className="absolute inset-0 opacity-[0.06]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Circuit-like decorative lines */}
      <div className="absolute top-20 right-0 w-96 h-96 opacity-[0.08]">
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 200 H150 V100 H250 V200 H350" stroke="white" strokeWidth="1.5" />
          <path d="M100 50 V150 H200 V250 H300 V350" stroke="white" strokeWidth="1.5" />
          <circle cx="150" cy="100" r="4" fill="white" />
          <circle cx="250" cy="200" r="4" fill="white" />
          <circle cx="200" cy="250" r="4" fill="white" />
          <circle cx="100" cy="150" r="4" fill="white" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium text-primary-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4db8e8] animate-pulse" />
            Увс аймгийн дижитал өөрчлөлт
          </div>

          <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl text-balance">
            “Ухаалаг Увс” чатбот албан ёсоор нэвтэрлээ!
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
           Увс аймгийн 25 агентлагийн нийт 141 төрлийн үйлчилгээг иргэд одоо чатботоор дамжуулан авах бүрэн боломжтой боллоо.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-[#4db8e8] text-[#0b2a4a] font-semibold hover:bg-[#3da8d8] gap-2 px-8"
            >
              <a target="_blank" href="https://m.me/smartuvs">
                Чатботруу шилжих
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2 px-8"
            >
              <a href="#contact">
                Холбоо барих
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Tagline */}
        <p className="mt-16 text-sm font-medium tracking-widest text-primary-foreground/50 uppercase">
          Smart Uvs &mdash; Орон нутгийн дижитал шийдэл
        </p>
      </div>
    </section>
  )
}
