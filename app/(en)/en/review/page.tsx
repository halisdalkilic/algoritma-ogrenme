import type { Metadata } from "next";
import { EnReview } from "@/components/pages/en-pages";
import { privatePage } from "@/lib/seo";

export const metadata: Metadata = privatePage("en", "review", "/en/review");

export default function Page() {
  return <EnReview />;
}
