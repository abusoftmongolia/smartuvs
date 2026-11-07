import { afterEach, describe, expect, it, vi } from "vitest";
import { getJson, HttpError, query } from "@/lib/fetch-json";

afterEach(() => vi.unstubAllGlobals());

describe("query", () => {
  it("null/undefined/хоосон утгыг алгасна", () => {
    expect(query({ a: "1", b: null, c: undefined, d: "", e: "x y" })).toBe("a=1&e=x+y");
  });
});

describe("getJson", () => {
  it("амжилттай JSON буцаана, header дамжуулна", async () => {
    const f = vi.fn(async (_u: string, _init?: RequestInit) => new Response(JSON.stringify({ state: "pending" }), { status: 200 }));
    vi.stubGlobal("fetch", f);
    await expect(getJson("/x", { headers: { "x-verify-token": "t" } })).resolves.toEqual({ state: "pending" });
    expect(f.mock.calls[0][1]).toMatchObject({ headers: { "x-verify-token": "t" }, cache: "no-store" });
  });
  it("ok биш бол HttpError (статустай) — 'сул цаг алга' гэж андуурахгүй", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    const e = (await getJson("/x").catch((x: unknown) => x)) as HttpError;
    expect(e).toBeInstanceOf(HttpError);
    expect(e.status).toBe(404);
  });
  it("timeout болбол abort хийгдэж алдаа өгнө", async () => {
    vi.stubGlobal("fetch", vi.fn((_u: string, init: RequestInit) => new Promise((_, rej) => {
      init.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
    })));
    await expect(getJson("/x", { timeoutMs: 10 })).rejects.toThrow();
  });
  it("гаднаас abort хийвэл хүсэлт зогсоно", async () => {
    vi.stubGlobal("fetch", vi.fn((_u: string, init: RequestInit) => new Promise((_, rej) => {
      init.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
    })));
    const ctrl = new AbortController();
    const p = getJson("/x", { signal: ctrl.signal, timeoutMs: 60_000 });
    ctrl.abort();
    await expect(p).rejects.toThrow();
  });
});
