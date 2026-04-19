import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const metadata = {
  title: "Dashboard - MabiniCare",
};

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const role = (session.user.role || "").trim().toLowerCase();

  if (role !== "staff" && role !== "barangay") {
    redirect(role === "workers" ? "/dashboard-workers" : "/dashboard-admin");
  }

  return <DashboardLayout user={session.user}>{children}</DashboardLayout>;
}
