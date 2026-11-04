import type { Metadata } from "next";
import { PrivacyPage } from "@/components/pages/PrivacyPage";
import { tr } from "@/lib/i18n/dict/tr";
import { og } from "@/lib/seo";

export const metadata: Metadata = {
  title: tr.privacy.metaTitle,
  description: tr.privacy.metaDescription,
  ...og({ title: tr.privacy.ogTitle, description: tr.privacy.metaDescription, path: "/gizlilik" }),
};

export default function Page() {
  return <PrivacyPage locale="tr" />;
}
