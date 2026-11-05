import { describe, expect, it } from "vitest";
import { isAdminHost, routeForHost } from "@/lib/host-routing";

const A = "admin.smartuvs.mn";

describe("isAdminHost", () => {
  it("админ хостыг таньна", () => {
    expect(isAdminHost("admin.smartuvs.mn", A)).toBe(true);
    expect(isAdminHost("ADMIN.smartuvs.mn:443", A)).toBe(true);
    expect(isAdminHost("admin.localhost:3000", A)).toBe(true);
    expect(isAdminHost("tsag.smartuvs.mn", A)).toBe(false);
    expect(isAdminHost("admin.smartuvs.mn.evil.com", A)).toBe(false);
    expect(isAdminHost(null, A)).toBe(false);
  });
});

describe("routeForHost", () => {
  it("админ хост дээр /platform руу rewrite", () => {
    expect(routeForHost(A, "/", A)).toEqual({ kind: "rewrite", path: "/platform" });
    expect(routeForHost(A, "/login", A)).toEqual({ kind: "rewrite", path: "/platform/login" });
    expect(routeForHost(A, "/tenants", A)).toEqual({ kind: "rewrite", path: "/platform/tenants" });
  });
  it("админ хост дээр хуваалцсан замуудыг хөндөхгүй", () => {
    for (const p of ["/_next/static/x.js", "/api/admin/stats", "/smartuvs-logo.png", "/platform/users"]) {
      expect(routeForHost(A, p, A)).toEqual({ kind: "next" });
    }
  });
  it("tsag хост дээр /platform хаалттай, бусад нь хэвээр", () => {
    expect(routeForHost("tsag.smartuvs.mn", "/platform", A)).toEqual({ kind: "notFound" });
    expect(routeForHost("tsag.smartuvs.mn", "/platform/login", A)).toEqual({ kind: "notFound" });
    expect(routeForHost("tsag.smartuvs.mn", "/hatan-salon", A)).toEqual({ kind: "next" });
    expect(routeForHost("tsag.smartuvs.mn", "/admin/login", A)).toEqual({ kind: "next" });
  });
});
