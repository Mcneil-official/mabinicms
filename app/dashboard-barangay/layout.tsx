/**
 * Barangay Health Dashboard Layout
 * Main layout container for Barangay Health Officers (CHOs)
 */

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BarangayHealthDashboardLayout } from "@/components/layout/barangay-health-dashboard-layout";
import { dbRoleToRoleType, RoleType } from "@/lib/rbac/roles";

export const metadata = {
  title: "Barangay Health Officer Dashboard - Barangay Health System",
};

export default async function BarangayHealthDashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect barangay health dashboard routes
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Convert role to RoleType for checking
  const roleType = dbRoleToRoleType(session.user.role);

  // Only allow barangay_admin role (CHO)
  if (roleType !== RoleType.BARANGAY_HEALTH) {
    redirect("/auth/login");
  }

  // Verify user has assigned barangay
  if (!session.user.assigned_barangay) {
    throw new Error("Barangay Health Officer must have an assigned barangay");
  }

  return (
    <BarangayHealthDashboardLayout user={session.user}>
      {children}
    </BarangayHealthDashboardLayout>
  );
}
