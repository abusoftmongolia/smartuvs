import { describe, expect, it } from "vitest";
import { INDUSTRY_IDS, type Industry } from "@/lib/industries";
import {
  DEFAULT_MENU, DEFAULT_TILES, expandMenu, MenuConfig, MenuHref, resolveIndustries, resolveMenu, resolveTiles, visibleIndustries,
} from "@/lib/site-config";

const defaults = Object.fromEntries(INDUSTRY_IDS.map((id) => [id, `L-${id}`])) as Record<Industry, string>;

describe("resolveIndustries", () => {
  it("тохиргоогүй үед анхны дараалал, нэр", () => {
    const r = resolveIndustries(undefined, defaults);
    expect(r.map((i) => i.id)).toEqual([...INDUSTRY_IDS]);
    expect(r[0]).toEqual({ id: "barber", label: "L-barber", defaultLabel: "L-barber", hidden: false });
  });
  it("дараалал, нэр, нуулт; дутуу салбар төгсгөлд, other үргэлж сүүлд", () => {
    const r = resolveIndustries({ order: ["other", "clinic", "barber"], labels: { clinic: "Эмнэлэг, клиник" }, hidden: ["pet"] }, defaults);
    expect(r.slice(0, 3).map((i) => i.id)).toEqual(["clinic", "barber", "beauty"]);
    expect(r.at(-1)!.id).toBe("other");
    expect(r[0].label).toBe("Эмнэлэг, клиник");
    expect(r.length).toBe(INDUSTRY_IDS.length);
    expect(visibleIndustries(r).some((i) => i.id === "pet" || i.id === "other")).toBe(false);
  });
  it("эвдэрсэн JSON → анхны утга", () => {
    expect(resolveIndustries({ order: ["nope"] }, defaults).map((i) => i.id)).toEqual([...INDUSTRY_IDS]);
  });
});

describe("цэс", () => {
  it("холбоосын шалгалт", () => {
    for (const ok of ["/business", "/?industry=clinic#list", "https://smartuvs.mn/x"]) expect(MenuHref.safeParse(ok).success).toBe(true);
    for (const bad of ["//evil.com", "javascript:alert(1)", "http://x.mn", "business", "/a b"]) expect(MenuHref.safeParse(bad).success).toBe(false);
  });
  it("салбарын бүлэг давхардвал алдаа", () => {
    const items = [...DEFAULT_MENU.items, { ...DEFAULT_MENU.items[1], id: "ind2" }];
    expect(MenuConfig.safeParse({ items }).success).toBe(false);
  });
  it("буруу холбоостой мөр → алдаа, resolveMenu анхны утга руу буцна", () => {
    const bad = { items: [{ id: "x", kind: "link", label: "X", href: "//evil" }] };
    expect(MenuConfig.safeParse(bad).success).toBe(false);
    expect(resolveMenu(bad)).toEqual(DEFAULT_MENU);
  });
  it("expandMenu салбаруудыг дэлгэж, нуусан мөрийг алгасна", () => {
    const menu = { items: DEFAULT_MENU.items.map((i) => (i.id === "business" ? { ...i, visible: false } : i)) };
    const links = expandMenu(menu, [{ id: "clinic", label: "Эмнэлэг" }, { id: "barber", label: "Үсчин" }]);
    expect(links.map((l) => l.href)).toEqual(["/#list", "/?industry=clinic#list", "/?industry=barber#list"]);
    expect(links[0].icon).toBe("grid");
  });
});

describe("хавтан", () => {
  it("3 биш бол анхны утга", () => {
    expect(resolveTiles({ tiles: DEFAULT_TILES.slice(0, 2) })).toEqual(DEFAULT_TILES);
    const t = DEFAULT_TILES.map((x) => ({ ...x, title: x.title + "!" }));
    expect(resolveTiles({ tiles: t })[0].title).toBe("Гоо сайхан!");
  });
});
