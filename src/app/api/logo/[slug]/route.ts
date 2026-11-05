/** GET /api/logo/<slug> — байгууллагын лого. ?v=<хугацаа> өөрчлөгдөхөд кэш шинэчлэгдэнэ. */
import { getLogoBySlug } from "@/db/tenant";
import { isValidSlug } from "@/lib/slug";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!isValidSlug(slug)) return new Response("Not found", { status: 404 });
  const logo = await getLogoBySlug(slug);
  if (!logo) return new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=60" } });
  const versioned = new URL(req.url).searchParams.has("v");
  return new Response(new Uint8Array(logo.data), {
    headers: {
      "content-type": logo.mime,
      "cache-control": versioned ? "public, max-age=31536000, immutable" : "public, max-age=300",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
    },
  });
}
