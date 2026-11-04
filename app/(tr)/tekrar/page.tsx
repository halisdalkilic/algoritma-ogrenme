import type { Metadata } from "next";
import { TrReview } from "@/components/pages/tr-pages";
import { privatePage } from "@/lib/seo";

export const metadata: Metadata = privatePage("tr", "review", "/tekrar");

export default function Page() {
  return <TrReview />;
}
