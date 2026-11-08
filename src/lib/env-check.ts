/**
 * Production-д заавал хэрэгтэй тохиргоо. Утгыг биш, зөвхөн НЭРИЙГ буцаана (нууц задрахгүй).
 * /api/health ашиглана — deploy хийсний дараа дутууг шууд харна.
 */
export type EnvProblem = { name: string; problem: string };

export function productionEnvProblems(env: Record<string, string | undefined> = process.env): EnvProblem[] {
  const out: EnvProblem[] = [];
  const need = (name: string, min = 1, problem = "тохируулаагүй") => {
    if ((env[name] ?? "").length < min) out.push({ name, problem });
  };
  need("DATABASE_URL");
  need("SESSION_SECRET", 32, "32+ тэмдэгт байх ёстой");
  need("CRON_SECRET", 16, "16+ тэмдэгт байх ёстой (мэдэгдэл, сануулга явахгүй)");
  need("VERIFYMN_API_KEY", 1, "тохируулаагүй — утас баталгаажуулах боломжгүй");
  need("NEXT_PUBLIC_SITE_URL");
  if ((env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("http://")) out.push({ name: "NEXT_PUBLIC_SITE_URL", problem: "https биш" });
  if ((env.SMS_PROVIDER ?? "console") === "console") {
    out.push({ name: "SMS_PROVIDER", problem: "console — SMS (баталгаа, сануулга) жинхэнээр илгээгдэхгүй" });
  } else {
    need("SMS_API_URL");
    need("SMS_API_KEY");
  }
  return out;
}
