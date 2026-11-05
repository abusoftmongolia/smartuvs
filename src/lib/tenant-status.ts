/**
 * Байгууллагын төлөв ба Super Admin-ы шилжүүлэлт — цэвэр функц (tests/tenant-status.test.ts).
 *   pending   → бүртгүүлсэн, админ хянаж буй (нийтэд харагдахгүй)
 *   active    → батлагдсан, захиалга авна
 *   rejected  → татгалзсан
 *   suspended → идэвхтэй байснаа хаагдсан
 */
export type TenantStatus = "pending" | "active" | "rejected" | "suspended";
export type AdminTenantAction = "approve" | "reject" | "suspend" | "activate";

export const TENANT_STATUS_MN: Record<TenantStatus, string> = {
  pending: "Хүлээгдэж буй",
  active: "Идэвхтэй",
  rejected: "Татгалзсан",
  suspended: "Хаалттай",
};

const RULES: Record<AdminTenantAction, { from: TenantStatus[]; to: TenantStatus }> = {
  approve: { from: ["pending", "rejected"], to: "active" },
  reject: { from: ["pending"], to: "rejected" },
  suspend: { from: ["active"], to: "suspended" },
  activate: { from: ["suspended"], to: "active" },
};

/** Шилжүүлж болох бол шинэ төлөв, болохгүй бол null */
export function nextTenantStatus(current: string, action: AdminTenantAction): TenantStatus | null {
  const r = RULES[action];
  return (r.from as string[]).includes(current) ? r.to : null;
}

/** Тухайн төлөвт админд харагдах үйлдлүүд */
export function availableActions(current: string): AdminTenantAction[] {
  return (Object.keys(RULES) as AdminTenantAction[]).filter((a) => nextTenantStatus(current, a) !== null);
}

export function isTenantStatus(s: string): s is TenantStatus {
  return s in TENANT_STATUS_MN;
}
