import type { Exercise } from "@/content/schema";

/** Paket 3'te gelecek tüm alıştırma bileşenlerinin ortak arayüzü. */
export interface ExerciseProps<T extends Exercise = Exercise> {
  exercise: T;
  onResult: (correct: boolean) => void;
}
