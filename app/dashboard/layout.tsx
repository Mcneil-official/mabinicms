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
  // Protect dashboard routes - redirect to login if not authenticated
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const role = (session.user.role || "").trim().toLowerCase();

  // Workers must use the dedicated worker dashboard only
  if (role === "workers") {
    redirect("/dashboard-workers");
  }

  // Keep /dashboard for admin, barangay_admin, and staff only
  if (role !== "admin" && role !== "barangay_admin" && role !== "staff") {
    redirect("/auth/login");
  }

  return <DashboardLayout user={session.user}>{children}</DashboardLayout>;
}
