/**
 * Geriye uyumlu giriş: Türkçe içerik. İngilizce içerik content/en.ts'te. Bileşenler hangi dilin içeriğini
 * kullanacaklarını kendileri seçer (components/pages/{tr,en}-pages.tsx); böylece bir dilin sayfaları diğer dilin
 * derslerini indirmez.
 */
import { trContent } from "./tr";

export const { lessons, getLessonById, getLessonsByWorld, getExerciseById } = trContent;
