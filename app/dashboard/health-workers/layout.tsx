import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Workers Dashboard - MabiniCare",
  description:
    "Interactive health metrics dashboard for community health workers",
};

export default function HealthWorkersDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
