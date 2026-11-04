"use client";

import { trContent } from "@/content/tr";
import { HomePage } from "./HomePage";
import { ReviewPage } from "./ReviewPage";

// Türkçe sayfaların istemci sarmalayıcıları: Türkçe içeriği (yaklaşık 700 KB) yalnızca ihtiyacı olan sayfalara bağlar.
// Ders sayfası içeriği sunucudan prop olarak alır, bu dosyayı kullanmaz; böylece o sayfa tüm içeriği indirmez.
export function TrHome() {
  return <HomePage content={trContent} />;
}

export function TrReview() {
  return <ReviewPage content={trContent} />;
}
