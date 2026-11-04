/** Нууц үгний дүрэм — client дээр ч ашиглана (crypto-гүй). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/** Хэрэглэгчид харуулах алдаа, эсвэл null (зөв) */
export function passwordProblem(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Нууц үг хамгийн багадаа ${PASSWORD_MIN} тэмдэгт байна`;
  if (pw.length > PASSWORD_MAX) return "Нууц үг хэт урт байна";
  return null;
}
