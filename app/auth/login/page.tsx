import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

/**
 * Login page for internal staff
 * Redirects to dashboard if already authenticated
 */
export default async function LoginPage() {
  // If already logged in, redirect to dashboard
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
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

        <div className="mt-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you a community City Health Worker?{" "}
            <Link
              href="/auth/workers"
              className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Login as Worker
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
