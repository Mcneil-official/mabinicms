import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";

export const metadata = {
  title: "Admin Dashboard - MabiniCare",
};

export default async function AdminDashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/admin");
  }

  const role = (session.user.role || "").trim().toLowerCase();

  if (role !== "admin") {
    redirect(role === "workers" ? "/dashboard-workers" : "/dashboard-barangay");
  }

  return (
    <AdminDashboardLayout user={session.user}>{children}</AdminDashboardLayout>
  );
}
