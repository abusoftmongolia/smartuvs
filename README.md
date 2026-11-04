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

## Vercel-д байршуулах
1. GitHub-д push хийгээд Vercel дээр Import.
2. Environment Variables: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL=https://tsag.smartuvs.mn`, `SESSION_SECRET`, `SMS_PROVIDER`.
3. Settings → Domains: `tsag.smartuvs.mn` нэмээд, домэйн бүртгэгч дээрээ Vercel-ийн заасан **CNAME** бичлэг үүсгэнэ.
4. (Заавал биш) `cag.smartuvs.mn` нэмээд `tsag.smartuvs.mn` руу redirect тохируулна.

## Цаашид
Хөгжүүлэлтийн үе шат, дүрмүүдийг `CLAUDE.md`-ээс харна уу. Claude Code-д: *"CLAUDE.md-г уншаад Үе шат 1-ийг хий"*.
