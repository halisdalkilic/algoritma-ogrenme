import type { Metadata } from "next";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
import { en } from "@/lib/i18n/dict/en";
import { og } from "@/lib/seo";

export const metadata: Metadata = {
  title: en.privacy.metaTitle,
  description: en.privacy.metaDescription,
  ...og({ title: en.privacy.ogTitle, description: en.privacy.metaDescription, path: "/en/privacy" }, "en"),
};

export default function Page() {
  return <PrivacyPage locale="en" />;
}
