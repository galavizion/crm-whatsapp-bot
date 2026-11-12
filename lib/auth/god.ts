export const GOD_EMAIL = "rene.galaviz@gmail.com";

export function isGodUser(email: string | null | undefined): boolean {
  return email === GOD_EMAIL;
}
