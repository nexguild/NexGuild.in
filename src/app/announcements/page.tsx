import { redirect } from "next/navigation";

export default function AnnouncementsRedirectPage() {
  redirect("/dashboard/announcements");
}
