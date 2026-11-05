import { describe, expect, it } from "vitest";
import { matchesQuery } from "@/lib/search";

const salon = { name: "Хатан Салон", slug: "hatan-salon", address: "Улаангом, 2-р баг" };
const wash = { name: "Увс Авто Угаалга", slug: "uvs-wash", address: null };

describe("matchesQuery", () => {
  it("хоосон хайлт бүгдийг харуулна", () => {
    expect(matchesQuery(salon, "")).toBe(true);
    expect(matchesQuery(salon, "   ")).toBe(true);
  });
  it("кириллээр, том жижиг үсгээс үл хамааран", () => {
    expect(matchesQuery(salon, "хатан")).toBe(true);
    expect(matchesQuery(salon, "САЛОН")).toBe(true);
    expect(matchesQuery(wash, "угаалга")).toBe(true);
  });
  it("хаягаар", () => {
    expect(matchesQuery(salon, "улаангом")).toBe(true);
  });
  it("латинаар", () => {
    expect(matchesQuery(salon, "hatan")).toBe(true);
    expect(matchesQuery(wash, "wash")).toBe(true);
    expect(matchesQuery(wash, "ugaalga")).toBe(true);
  });
  it("таарахгүй бол false", () => {
    expect(matchesQuery(salon, "эмнэлэг")).toBe(false);
    expect(matchesQuery(wash, "hatan")).toBe(false);
  });
});
