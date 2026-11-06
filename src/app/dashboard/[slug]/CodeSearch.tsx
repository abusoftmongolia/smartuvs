/** Захиалгын кодоор хайх жижиг форм (GET) — JS-гүй ажиллана */
export function CodeSearch({ action, defaultValue }: { action: string; defaultValue?: string }) {
  return (
    <form action={action} method="get" role="search" className="flex gap-2">
      <label htmlFor="code-search" className="sr-only">Захиалгын кодоор хайх</label>
      <input id="code-search" name="code" defaultValue={defaultValue} placeholder="Код: X4K9M2" autoComplete="off" maxLength={20}
        className="min-h-11 w-36 rounded-lg border border-line bg-white px-3 font-mono text-sm uppercase outline-none focus:border-ink" />
      <button className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium">Хайх</button>
    </form>
  );
}
