import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { og, seoText } from "@/lib/seo";
import { enContent } from "@/content/en";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

// Statik export: yalnızca İngilizcesi hazır dersler üretilir, diğer her id → 404.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lesson = enContent.getLessonById(id);
  if (!lesson) return {};
  const title = seoText("en").lessonTitle(lesson.id, lesson.title);
  return { title, description: lesson.hook.text, ...og({ title, description: lesson.hook.text, path: `/en/lesson/${lesson.id}` }, "en") };
}

export function generateStaticParams() {
  // "output: export" en az bir adres ister. İngilizce ders henüz yokken (Paket 6 öncesi) yer tutucu id üretilir,
  // sayfa onu 404'e çevirir; ilk ders eklenince bu dal kendiliğinden devre dışı kalır.
  if (enContent.lessons.length === 0) return [{ id: "0.1" }];
  return enContent.lessons.map((l) => ({ id: l.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = enContent.getLessonById(id);
  if (!lesson) notFound();

  return <LessonPlayer lesson={lesson} />;
}
