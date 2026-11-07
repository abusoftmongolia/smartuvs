/**
 * Client талын GET + JSON. Уншилтыг server action-оор биш GET-ээр хийнэ:
 * action-ууд POST, дараалан ажилладаг, abort хийгдэхгүй — сул сүлжээнд удаашруулна.
 */
export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

export async function getJson<T>(
  url: string,
  opts: { signal?: AbortSignal; timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<T> {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  opts.signal?.addEventListener("abort", onAbort);
  // Сүлжээ сул үед мөнхийн хүлээлтээс сэргийлнэ
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 10_000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: opts.headers, cache: "no-store" });
    if (!r.ok) throw new HttpError(r.status);
    return (await r.json()) as T;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

/** URLSearchParams — undefined/null утгыг алгасна */
export function query(params: Record<string, string | null | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") qs.set(k, v);
  return qs.toString();
}
