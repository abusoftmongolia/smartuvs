# tsag.smartuvs.mn — Claude Code-д зориулсан заавар

Олон салбарын (үсчин, гоо сайхан, хумс, авто угаалга, эмнэлэг, шүд, фитнесс, гэрэл зураг, сургалт, зөвлөх, тэжээвэр амьтан) цаг захиалгын вэб апп. Салбарын жагсаалт: `src/lib/industries.ts`.
SmartUvs.mn ухаалаг системүүдийн нэгдсэн платформын эхний бүтээгдэхүүн. Дараагийнх нь `ajil.smartuvs.mn` (цагийн ажил).

Хэрэглэгчтэй **монголоор (кирилл)** харилц. UI-ийн бүх бичиг монгол хэлээр.

## Стек
- Next.js 15 (App Router, Server Actions), React 19, TypeScript strict
- Tailwind CSS v4 — брэнд өнгө `src/app/globals.css`-ийн `@theme` дотор (`bg-brand`, `text-ink`, `border-line`, `bg-brand-tint`, `text-muted`)
- PostgreSQL (Neon) + Drizzle ORM (`postgres` драйвер, `prepare: false`)
- Zod — бүх оролтыг шалгана
- Vitest — цэвэр логикийн тест
- Hosting: AWS (үйлчилгээг сонгоогүй). Cron нь HTTP endpoint — EventBridge Scheduler эсвэл crontab-аар 5 мин тутам дуудна

## Командууд
```
npm run dev          # http://localhost:3000/hatan-salon
npm run typecheck
npm test
npm run build
npm run db:generate  # schema.ts өөрчилсний дараа migration үүсгэнэ
npm run db:setup     # migrate + давхардлын constraint + туршилтын өгөгдөл
```
Ажлаа дуусгахаас өмнө `npm run typecheck && npm test && npm run build` гурвыг заавал ажиллуул.

## Бүтэц
```
src/app/[slug]/page.tsx        Үйлчлүүлэгчийн захиалгын хуудас (tsag.smartuvs.mn/<slug>)
src/app/api/[slug]/slots/      Сул цагийн API
src/components/BookingFlow.tsx Захиалгын 3 алхам (client)
src/app/dashboard/[slug]/      Байгууллагын самбар: зүүн цэс (DashShell) + хуудсууд — тойм, calendar, pending, history, services, staff, hours, share, settings
src/server/availability.ts     Өгөгдлийн сангаас уншиж сул цаг тооцно
src/server/bookings.ts         createBooking server action
src/lib/slots.ts               Сул цагийн алгоритм — ЦЭВЭР функц, тесттэй
src/lib/time.ts                Цагийн бүс (UTC ↔ Asia/Hovd)
src/lib/slug.ts                "Хатан Салон" → "hatan-salon"
src/lib/presets.ts             Салбарын preset (үйлчилгээ, нэр томьёо, бодлого)
src/lib/sms.ts                 SMS adapter (console | http)
src/db/schema.ts               Drizzle schema
src/db/tenant.ts               Tenant-аар шүүсэн query-ууд
drizzle/custom/booking_constraints.sql  Давхар захиалга хориглох exclusion constraint
```

## Заавал баримтлах дүрэм
1. **Төлбөр байхгүй.** Үйлчлүүлэгч захиалахдаа юу ч төлөхгүй. `price` зөвхөн мэдээлэл. QPay, урьдчилгаа нэмэхгүй.
2. **Байгууллагыг URL-ын замаар ялгана:** `tsag.smartuvs.mn/<slug>`. Subdomain ашиглахгүй. Шинэ дээд түвшний route нэмбэл `RESERVED_SLUGS`-д нэмэх.
3. **Tenant тусгаарлалт:** байгууллагын өгөгдөлтэй query бүр `tenant_id`-аар шүүнэ. Шинэ query-г `src/db/tenant.ts`-д бич.
4. **Цаг:** сан дотор UTC (`timestamptz`). Ажлын цаг өдрийн минутаар (540 = 09:00). Харуулахдаа `tenant.timezone` (Увс: `Asia/Hovd`, УБ: `Asia/Ulaanbaatar`).
5. **Давхардал:** эцсийн хамгаалалт нь DB constraint. `23P01` алдааг "Энэ цаг дөнгөж захиалагдлаа" гэж хэрэглэгчид харуул. UI-ийн шалгалтад найдахгүй.
6. **Салбарын ялгааг код биш preset болго** (`presets.ts`, `tenants.settings`). `if (industry === "carwash")` гэх мэт салбарын нэрээр салаалахгүй — `bookingMode`, `customFields` ашигла.
7. **Брэнд:** шар `#F5A800` товч дээр бичиг ХАР (`text-ink`), цагаан биш. Лого хар-шар тул үргэлж цагаан дэвсгэр дээр.
8. **Mobile-first, хүртээмж:** товч ≥ 44px, жинхэнэ `<button>`/`<label>`, бичиг 4.5:1 ялгарал.
9. **Хамгийн бага хувийн мэдээлэл.** Эмнэлэгт шинж тэмдгийг заавал асуухгүй. Утасны дугаарыг лог руу бүтнээр нь бичихгүй.

## Хөгжүүлэлтийн үе шат
Дизайны загвар (canvas) ба архитектурын баримт бичиг claude.ai дээр байгаа. Үе шат бүрийг дуусгаад тест, build-ээ шалга.

- [x] **0. Суурь** — schema, constraint, сул цагийн алгоритм, захиалгын хуудас, seed
- [x] **1. OTP баталгаажуулалт** — verify.mn-ээр хийгдсэн (үйлчлүүлэгч 144773 руу код илгээнэ, `src/lib/verifymn.ts`). Анхны төлөвлөгөө: `otp_codes` хүснэгтээр 6 оронтой код (hash-лаж хадгална, 5 мин хүчинтэй, дугаарт цагт 5 оролдлого). `createBooking`-ийн `TODO(Үе шат 1)`-ийг хийж, захиалгын хуудсанд код оруулах алхам нэмэх.
- [x] **2. Ажилтны самбар** — `/dashboard`: нэвтрэлт (утас + нууц үг, session cookie), өдрийн календарь (ажилтнаар баганалсан), батлах хүлээж буй жагсаалт (Батлах / Өөр цаг санал болгох), гараар захиалга нэмэх, ирсэн / ирээгүй тэмдэглэх. Загвар: canvas-ын `Admin.dc.html`.
- [x] **3. Байгууллага өөрөө бүртгүүлэх** — `/signup`: 4 алхам (бүртгэл+OTP → байгууллага+салбар → үйлчилгээ+цаг → ажилтан/бокс) + "Бэлэн" (холбоос, A4 QR постер PDF). `uniqueSlug`, `defaultSettings` ашигла. Нэг дугаараар хоногт 3-аас олон байгууллага үүсгэхгүй. Загвар: `Signup.dc.html`.
- [x] **4. Мэдэгдэл** — cron: `GET /api/cron/notifications` (`Authorization: Bearer $CRON_SECRET`). Анхны төлөвлөгөө: `notifications` хүснэгтийн хугацаа болсон мөрүүдийг Vercel Cron-оор 5 мин тутам илгээх; `/manage/<token>` хуудас (цуцлах, шилжүүлэх).
- [x] **5. Тайлан ба Super Admin** — өдөр/сарын захиалга, ирээгүй хувь; шинэ бүртгэлийг хянах, идэвхгүй болгох.

## Claude Code-д өгөх жишээ prompt
> CLAUDE.md-г уншаад **Үе шат 1 (OTP)**-ийг хий. Эхлээд төлөвлөгөөгөө монголоор товч бичээд надаас батлуул. `src/lib/otp.ts` дотор логикийг цэвэр функц болгон салгаж тест бич. Дуусаад typecheck, test, build ажиллуул.
