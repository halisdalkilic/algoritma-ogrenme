/** Çoğul eki: Türkçede sayıdan sonra ek yok ("5 ders"); İngilizcede var ("1 lesson", "5 lessons"). */
export function plural(n: number, one: string, other: string): string {
  return n === 1 ? one : other;
}
