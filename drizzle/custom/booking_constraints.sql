-- Давхар захиалгыг өгөгдлийн сангийн түвшинд хориглох.
-- `npm run db:migrate`-ийн дараа `npm run db:constraints`-аар нэг удаа ажиллуулна (дахин ажиллуулахад аюулгүй).
--
-- Хоёр хүн яг нэг цагийг зэрэг дарвал нэг нь л амжилттай болно; нөгөө нь
-- 23P01 (exclusion_violation) алдаа авч, апп "энэ цаг дөнгөж захиалагдлаа" гэж хариулна.

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  -- Нэг ажилтан нэг зэрэг хоёр захиалгатай байж болохгүй
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_staff_no_overlap') THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_staff_no_overlap
      EXCLUDE USING gist (
        staff_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
      ) WHERE (staff_id IS NOT NULL AND status IN ('pending', 'confirmed', 'checked_in'));
  END IF;

  -- Нэг нөөц (угаалгын бокс, өрөө) нэг зэрэг хоёр захиалгатай байж болохгүй
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_resource_no_overlap') THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_resource_no_overlap
      EXCLUDE USING gist (
        resource_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
      ) WHERE (resource_id IS NOT NULL AND status IN ('pending', 'confirmed', 'checked_in'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_time_order') THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_time_order CHECK (ends_at > starts_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_owner_one') THEN
    ALTER TABLE schedules ADD CONSTRAINT schedules_owner_one
      CHECK ((staff_id IS NULL) <> (resource_id IS NULL));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_time_order') THEN
    ALTER TABLE schedules ADD CONSTRAINT schedules_time_order
      CHECK (start_min >= 0 AND end_min <= 1440 AND end_min > start_min AND weekday BETWEEN 0 AND 6);
  END IF;
END $$;

-- Row-Level Security (дараагийн шатны хатуужуулалт):
-- MVP-д tenant тусгаарлалтыг апп-ын давхаргад src/db/tenant.ts хийнэ. Олон хөгжүүлэгчтэй болох,
-- эсвэл эмнэлгийн өгөгдөл ихсэх үед доорх загвараар RLS асааж, транзакц бүрт
-- `SET LOCAL app.tenant_id = '<uuid>'` тохируулна.
--
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON bookings
--   USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
