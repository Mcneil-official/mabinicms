import { redirect } from "next/navigation";

export default function PregnancyListPageRedirect() {
  redirect("/dashboard-barangay/barangay-profiling");
}
