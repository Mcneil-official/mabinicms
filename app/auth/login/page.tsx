import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Login page for internal staff
 * Redirects to dashboard if already authenticated
 */
export default async function StaffLoginPage() {
  // If already logged in, redirect to the correct dashboard per role
  const session = await getSession();
  if (session) {
    const role = (session.user.role || "").trim().toLowerCase();

    if (role === "workers") {
      redirect("/dashboard-workers");
    }

    if (role === "admin") {
      redirect("/dashboard-admin");
    }

    // Staff should use the original staff dashboard experience.
    if (role === "staff") {
      redirect("/dashboard");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-3 flex justify-start">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="border-slate-300/70 bg-white/80 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-800/60"
          >
            <Link href="/" aria-label="Back to Home" title="Back to Home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Health System
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Barangay Management Dashboard
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">Demo Credentials (Testing)</p>
          <p className="mt-1 text-xs">Contact your administrator for access</p>
        </div>
      </div>
    </div>
  );
}
