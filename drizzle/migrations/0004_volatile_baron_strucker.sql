ALTER TYPE "public"."industry" ADD VALUE 'nails' BEFORE 'carwash';--> statement-breakpoint
ALTER TYPE "public"."industry" ADD VALUE 'dental' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."industry" ADD VALUE 'fitness' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."industry" ADD VALUE 'photo' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."industry" ADD VALUE 'education' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."industry" ADD VALUE 'consulting' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."industry" ADD VALUE 'pet' BEFORE 'other';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "code" text;--> statement-breakpoint
-- Хуучин захиалгуудад код олгоно (src/lib/booking-code.ts-ийн цагаан толгойгоор). Мөр бүрт random дахин тооцогдоно.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM "bookings" WHERE "code" IS NULL LOOP
    UPDATE "bookings" SET "code" = (
      SELECT string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
      FROM generate_series(1, 6)
    ) WHERE id = r.id;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_tenant_code_uq" ON "bookings" USING btree ("tenant_id","code");