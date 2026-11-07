"use client";
/** Root layout өөрөө унасан үед — globals.css ачаалагдахгүй байж болох тул inline style */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="mn">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fcfcfc", color: "#0b0b0b", margin: 0 }}>
        <div role="alert" style={{ maxWidth: 420, margin: "0 auto", padding: "48px 16px" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Алдаа гарлаа</h1>
          <p style={{ fontSize: 14, color: "#555" }}>Түр хүлээгээд дахин оролдоно уу.</p>
          <button type="button" onClick={reset}
            style={{ minHeight: 48, padding: "0 20px", borderRadius: 12, border: 0, background: "#f5a800", color: "#0b0b0b", fontWeight: 600, fontSize: 15 }}>
            Дахин оролдох
          </button>
        </div>
      </body>
    </html>
  );
}
