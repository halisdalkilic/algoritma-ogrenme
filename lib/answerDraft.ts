/**
 * Yanlış cevaptan sonra "Tekrar dene" bileşeni baştan kurar; yazılı cevap (özellikle uzun sözde kod)
 * kaybolmasın diye son yanlış cevap bellekte tutulur. Doğru cevapta temizlenir. Kalıcı depolamaya yazılmaz.
 */
const drafts = new Map<string, unknown>();

export function saveDraft(exerciseId: string, value: unknown): void {
  drafts.set(exerciseId, value);
}

export function loadDraft<T>(exerciseId: string): T | undefined {
  return drafts.get(exerciseId) as T | undefined;
}

export function clearDraft(exerciseId: string): void {
  drafts.delete(exerciseId);
}
