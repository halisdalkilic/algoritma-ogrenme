import type { Metadata } from "next";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { privatePage } from "@/lib/seo";

export const metadata: Metadata = privatePage("en", "profile", "/en/profile");

export default function Page() {
  return <ProfilePage />;
}
