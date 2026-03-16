import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ residentId: string }>;
}

export default async function PregnancyProfilePageRedirect({ params }: Props) {
  await params;
  redirect("/dashboard/barangay-profiling");
}

export async function generateMetadata() {
  return {
    title: "Barangay & Pregnancy Profiling",
  };
}
