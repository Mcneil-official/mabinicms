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

  if (role === "workers") {
    redirect("/dashboard-workers");
  }

  if (role === "admin") {
    redirect("/dashboard-admin");
  }

  if (role !== "staff") {
    redirect("/auth/login");
  }

  return <DashboardLayout user={session.user}>{children}</DashboardLayout>;
}
