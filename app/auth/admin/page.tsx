import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Admin/staff login page
 * Redirects to the proper dashboard if already authenticated
 */
export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) {
    const role = (session.user.role || "").trim().toLowerCase();

    if (role === "workers") {
      redirect("/dashboard-workers");
    }

    if (role === "barangay_admin") {
      redirect("/dashboard-barangay");
    }

    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <Link href="/" aria-label="Go to landing page">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Admin Portal
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Administrator Access Only
          </p>
        </div>

        <AdminLoginForm />

        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">Admin Access</p>
          <p className="mt-1 text-xs">Contact your administrator for access</p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you staff or a City Health Worker?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Go to Staff Login
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}