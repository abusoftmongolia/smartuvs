import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, uniqueSlug } from "@/lib/slug";

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
