import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, slugInput, slugProblem, suggestSlug, uniqueSlug } from "@/lib/slug";

describe("slugify", () => {
  it("кирилл нэрийг латин болгоно", () => {
    expect(slugify("Хатан Салон")).toBe("hatan-salon");
    expect(slugify("Увс Авто Угаалга")).toBe("uvs-avto-ugaalga");
    expect(slugify("Өлзий шүдний эмнэлэг")).toBe("ulzii-shudnii-emneleg");
  });
  it("тэмдэгт, зайг цэвэрлэнэ", () => {
    expect(slugify("  FIT ZONE  UVS!! ")).toBe("fit-zone-uvs");
  });
});

describe("isValidSlug", () => {
  it("нөөцлөгдсөн үгийг хүлээж авахгүй", () => {
    expect(isValidSlug("api")).toBe(false);
    expect(isValidSlug("signup")).toBe(false);
    expect(isValidSlug("hatan-salon")).toBe(true);
  });
});

describe("uniqueSlug", () => {
  it("давхцвал -2, -3 нэмнэ", async () => {
    const taken = new Set(["hatan-salon", "hatan-salon-2"]);
    expect(await uniqueSlug("Хатан Салон", async (s) => taken.has(s))).toBe("hatan-salon-3");
  });
  it("нөөцлөгдсөн үг бол өөрчилнө", async () => {
    expect(await uniqueSlug("Admin", async () => false)).toBe("admin-1");
  });
});

describe("suggestSlug", () => {
  it("богино нэрийг хэвээр үлдээнэ", () => {
    expect(suggestSlug("Хатан Салон")).toBe("hatan-salon");
  });
  it("урт нэрийг ерөнхий үг хасаж, үгийн хилээр богиносгоно", () => {
    expect(suggestSlug("Анагаах увидас уламжлалтын эмнэлэг")).toBe("anagaah-uvidas");
    expect(suggestSlug("Улаангом шүдний эмнэлэг ХХК")).toBe("ulaangom-shudnii");
  });
  it("20 тэмдэгтээс хэтрэхгүй", () => {
    expect(suggestSlug("Супермаркетынхныхандаахантайгаа").length).toBeLessThanOrEqual(20);
  });
});

describe("slugInput / slugProblem", () => {
  it("бичсэнийг хаяг болгоно", () => {
    expect(slugInput("Уламжлалт Эмнэлэг")).toBe("ulamjlalt-emneleg");
    expect(slugInput("ab--c ")).toBe("ab-c-");
  });
  it("алдааг монголоор буцаана", () => {
    expect(slugProblem("ab")).toMatch(/3/);
    expect(slugProblem("abc-")).not.toBeNull();
    expect(slugProblem("login")).not.toBeNull();
    expect(slugProblem("ulamjlalt")).toBeNull();
  });
});
