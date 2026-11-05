import { describe, expect, it } from "vitest";
import { availableActions, nextTenantStatus } from "@/lib/tenant-status";

describe("nextTenantStatus", () => {
  it("хүлээгдэж буйг батлах, татгалзах", () => {
    expect(nextTenantStatus("pending", "approve")).toBe("active");
    expect(nextTenantStatus("pending", "reject")).toBe("rejected");
  });
  it("татгалзсаныг дараа нь батлаж болно", () => {
    expect(nextTenantStatus("rejected", "approve")).toBe("active");
  });
  it("идэвхтэйг хааж, хаалттайг нээнэ", () => {
    expect(nextTenantStatus("active", "suspend")).toBe("suspended");
    expect(nextTenantStatus("suspended", "activate")).toBe("active");
  });
  it("буруу шилжүүлэлтэд null", () => {
    expect(nextTenantStatus("active", "approve")).toBeNull();
    expect(nextTenantStatus("active", "reject")).toBeNull();
    expect(nextTenantStatus("pending", "suspend")).toBeNull();
    expect(nextTenantStatus("unknown", "approve")).toBeNull();
  });
});

describe("availableActions", () => {
  it("төлөв бүрийн үйлдэл", () => {
    expect(availableActions("pending")).toEqual(["approve", "reject"]);
    expect(availableActions("active")).toEqual(["suspend"]);
    expect(availableActions("suspended")).toEqual(["activate"]);
    expect(availableActions("rejected")).toEqual(["approve"]);
  });
});
