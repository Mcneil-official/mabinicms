import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkerDashboardLayout } from "@/components/layout/worker-dashboard-layout";

export const metadata = {
  title: "Worker Dashboard - MabiniCare",
};

export default async function WorkerDashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect worker dashboard routes - redirect to worker login if not authenticated
  const session = await getSession();

  if (!session) {
    redirect("/auth/workers");
  }

  // Ensure the user has worker role
  if (session.user.role !== "workers") {
    redirect("/auth/workers");
  }

  return (
    <WorkerDashboardLayout user={session.user}>
      {children}
    </WorkerDashboardLayout>
  );
}
