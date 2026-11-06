/**
 * Захиалгын богино код (#X4K9M2) — үйлчлүүлэгч хадгалж, байгууллага кодоор хайж олно.
 * Андуурагдах тэмдэгтгүй (0/O, 1/I/L байхгүй). 31 тэмдэгт, 6 урт = ~890 сая хувилбар, байгууллага дотроо давтагдахгүй (unique index).
 */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

/** 256 нь 31-д хуваагддаггүй тул илүү байтыг алгасаж (rejection sampling) тэгш тархалттай болгоно */
const webRandom = (n: number) => crypto.getRandomValues(new Uint8Array(n)); // Node 20+ ба хөтөч хоёуланд

export function generateBookingCode(rand: (n: number) => Uint8Array = webRandom): string {
  const n = CODE_ALPHABET.length;
  const limit = 256 - (256 % n);
  let out = "";
  while (out.length < CODE_LENGTH) {
    for (const b of rand(CODE_LENGTH * 2)) {
      if (b < limit) out += CODE_ALPHABET[b % n];
      if (out.length === CODE_LENGTH) break;
    }
  }
  return out;
}

/** Хэрэглэгчийн бичсэн кодыг цэвэрлэнэ: " #x4k-9m2 " → "X4K9M2". Буруу бол null. */
export function normalizeBookingCode(input: string): string | null {
  const c = input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  return c.length === CODE_LENGTH && [...c].every((ch) => CODE_ALPHABET.includes(ch)) ? c : null;
}

export const formatBookingCode = (code: string) => `#${code}`;
