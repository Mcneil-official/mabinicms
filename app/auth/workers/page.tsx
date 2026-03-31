import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkerLoginForm } from "@/components/auth/worker-login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Login page for workers
 * Redirects to workers dashboard if already authenticated
 */
export default async function WorkerLoginPage() {
  // If already logged in as worker, redirect to workers dashboard
  const session = await getSession();
  if (session && session.user.role === "workers") {
    redirect("/dashboard-workers");
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
            City Health Portal
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            City Health Login
          </p>
        </div>

        <WorkerLoginForm />

        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">Worker Access</p>
          <p className="mt-1 text-xs">
            Contact your supervisor for login credentials
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you a staff member?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Login as Staff
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
