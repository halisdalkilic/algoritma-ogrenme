"use client";

import { enContent } from "@/content/en";
import { HomePage } from "./HomePage";
import { ReviewPage } from "./ReviewPage";

// İngilizce sayfaların istemci sarmalayıcıları (bkz. tr-pages.tsx).
export function EnHome() {
  return <HomePage content={enContent} />;
}

export function EnReview() {
  return <ReviewPage content={enContent} />;
}
