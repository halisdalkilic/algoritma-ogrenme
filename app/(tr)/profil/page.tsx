import type { Metadata } from "next";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { privatePage } from "@/lib/seo";

export const metadata: Metadata = privatePage("tr", "profile", "/profil");

// Sayfanın içeriği iki dilde ortak: components/pages/ProfilePage.tsx (metinler sözlükten gelir).
export default function Page() {
  return <ProfilePage />;
}
