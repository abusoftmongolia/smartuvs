# tsag.smartuvs.mn

Үсчин, гоо сайхан, авто угаалга, эмнэлэгт зориулсан цаг захиалгын систем. Үйлчлүүлэгч төлбөргүй, бүртгэлгүйгээр утаснаасаа цаг захиална.

## Эхлүүлэх (MacBook)

1. **Node.js 20+** суулгасан байх (`node -v`).
2. Хамаарлуудыг суулгана:
   ```
   npm install
   ```
3. [Neon](https://neon.tech) дээр үнэгүй PostgreSQL үүсгээд **pooled connection string**-ийг хуулна.
4. Тохиргоо:
   ```
   cp .env.example .env
   # .env дотор DATABASE_URL-ийг бөглөнө
   ```
5. Өгөгдлийн сан бэлдэх (хүснэгт + давхардлын хамгаалалт + туршилтын 2 байгууллага):
   ```
   npm run db:setup
   ```
6. Ажиллуулах:
   ```
   npm run dev
   ```
   - http://localhost:3000/hatan-salon — үсчин (ажилтан сонгоно)
   - http://localhost:3000/uvs-wash — авто угаалга (боксоор, машины дугаар асууна)

   Захиалга хийхэд SMS-ийн текст терминалд хэвлэгдэнэ (`SMS_PROVIDER=console`).

## Шалгах
```
npm run typecheck && npm test && npm run build
```

## Шалгах (dev сервер ажиллаж байхад)
```
npm run typecheck && npm test && npm run build:check   # .next-build руу — `next dev`-ийн .next-ийг эвдэхгүй
```

## Production-д байршуулах (Vercel, бүс `sin1` = Neon ap-southeast-1)
1. **Өгөгдлийн сан:** туршилтын өгөгдөлгүй тусдаа Neon branch/DB. Хүснэгт + давхардлын constraint (seed-гүй!):
   ```
   DATABASE_URL=<prod url> npm run db:deploy
   DATABASE_URL=<prod url> npm run admin:grant   # super admin
   ```
2. **Environment Variables (Production):**
   | Нэр | Тайлбар |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** URL |
   | `NEXT_PUBLIC_SITE_URL` | `https://tsag.smartuvs.mn` |
   | `SESSION_SECRET` | 32+ тэмдэгт (`openssl rand -base64 32`) |
   | `CRON_SECRET` | 16+ тэмдэгт — Vercel Cron өөрөө `Authorization: Bearer` илгээнэ |
   | `VERIFYMN_API_KEY`, `VERIFYMN_API_URL` | verify.mn (production-д заавал, mock хаалттай) |
   | `SMS_PROVIDER`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER` | `console` биш |
   | `ADMIN_HOST`, `ADMIN_API_TOKEN` | admin.smartuvs.mn |
3. **Domains:** `tsag.smartuvs.mn`, `admin.smartuvs.mn` → CNAME. (`cag.smartuvs.mn` → redirect.)
4. **Cron:** `/api/cron/notifications` 5 мин тутам (Vercel Pro-ийн Cron, эсвэл гадны scheduler).
5. **Deploy-ийн дараа:** `https://tsag.smartuvs.mn/api/health` → `{"ok":true,"config":[]}`. `config` дотор дутуу тохиргооны НЭР гарна.

## Цаашид
Хөгжүүлэлтийн үе шат, дүрмүүдийг `CLAUDE.md`-ээс харна уу. Claude Code-д: *"CLAUDE.md-г уншаад Үе шат 1-ийг хий"*.
