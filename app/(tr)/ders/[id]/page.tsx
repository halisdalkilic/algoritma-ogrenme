import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { og, seoText } from "@/lib/seo";
import { getLessonById, lessons } from "@/content";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

// Statik export: sadece build anında bilinen dersler üretilir, bilinmeyen id → 404.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lesson = getLessonById(id);
  if (!lesson) return {};
  const title = seoText("tr").lessonTitle(lesson.id, lesson.title);
  return { title, description: lesson.hook.text, ...og({ title, description: lesson.hook.text, path: `/ders/${lesson.id}` }, "tr") };
}

export function generateStaticParams() {
  return lessons.map((l) => ({ id: l.id }));
}

export default async function DersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = getLessonById(id);
  if (!lesson) notFound();

  return <LessonPlayer lesson={lesson} />;
}
