"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronRight, MessageCircle } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

export function HeroSection() {
  const reduce = useReducedMotion()

  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  }

  const container = {
    hidden: {},
    show: {
      transition: reduce ? {} : { staggerChildren: 0.12, delayChildren: 0.05 },
    },
  }

  return (
    <section className="relative overflow-hidden bg-primary pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Soft radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-48 left-10 h-[520px] w-[520px] rounded-full bg-[#4db8e8]/15 blur-3xl" />
      </div>

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

      {/* Circuit-like decorative lines (floating) */}
      <motion.div
        aria-hidden
        className="absolute top-16 right-0 w-[420px] h-[420px] opacity-[0.085]"
        animate={reduce ? {} : { y: [0, -10, 0], x: [0, -6, 0] }}
        transition={reduce ? {} : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 200 H150 V100 H250 V200 H350" stroke="white" strokeWidth="1.5" />
          <path d="M100 50 V150 H200 V250 H300 V350" stroke="white" strokeWidth="1.5" />
          <circle cx="150" cy="100" r="4" fill="white" />
          <circle cx="250" cy="200" r="4" fill="white" />
          <circle cx="200" cy="250" r="4" fill="white" />
          <circle cx="100" cy="150" r="4" fill="white" />
        </svg>
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <motion.div
          className="mx-auto max-w-3xl"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4db8e8]/70 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4db8e8]" />
            </span>
            Увс аймгийн дижитал өөрчлөлт
          </motion.div>

          {/* Messenger chip */}
          <motion.div
            variants={fadeUp}
            className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground/80 border border-primary-foreground/15"
            animate={reduce ? {} : { y: [0, -2, 0] }}
            transition={reduce ? {} : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <MessageCircle className="h-4 w-4 text-[#4db8e8]" />
            Facebook Chatbot
            <span className="ml-1 rounded-full bg-[#4db8e8]/15 px-2 py-0.5 text-[10px] text-primary-foreground/80">
              Messenger
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-[family-name:var(--font-heading)] text-4xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl text-balance"
          >
            “Ухаалаг Увс” чатбот албан ёсоор нэвтэрлээ!
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/80"
          >
            Увс аймгийн 25 агентлагийн нийт 141 төрлийн үйлчилгээг иргэд одоо чатботоор дамжуулан авах бүрэн боломжтой боллоо.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {/* Primary with shine */}
            <motion.div
              whileHover={reduce ? {} : { scale: 1.03 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
              className="relative"
            >
              <div className="pointer-events-none absolute inset-0 rounded-md opacity-70 blur-xl bg-[#4db8e8]/25" />
              <Button
                asChild
                size="lg"
                className="relative overflow-hidden bg-[#4db8e8] text-[#0b2a4a] font-semibold hover:bg-[#3da8d8] gap-2 px-8"
              >
                <a target="_blank" rel="noreferrer" href="https://m.me/smartuvs">
                  {/* shine sweep */}
                  {!reduce && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent animate-[shine_2.6s_ease-in-out_infinite]"
                    />
                  )}
                  Чатботруу шилжих
                  <motion.span
                    aria-hidden
                    animate={reduce ? {} : { x: [0, 3, 0] }}
                    transition={reduce ? {} : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-flex"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </a>
              </Button>
            </motion.div>

            <motion.div whileHover={reduce ? {} : { scale: 1.02 }} whileTap={reduce ? {} : { scale: 0.98 }}>
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
            </motion.div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            variants={fadeUp}
            className="mt-16 text-sm font-medium tracking-widest text-primary-foreground/50 uppercase"
          >
            Smart Uvs &mdash; Орон нутгийн дижитал шийдэл
          </motion.p>
        </motion.div>
      </div>

      {/* keyframes (Tailwind arbitrary animation ашиглаж байгаа тул global CSS дээр нэмэхгүйгээр inline) */}
      <style jsx global>{`
        @keyframes shine {
          0% { transform: translateX(-120%); }
          55% { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </section>
  )
}