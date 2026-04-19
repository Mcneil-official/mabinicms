import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import Image from "next/image";
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
    if (role === "staff") {
      redirect("/dashboard-barangay");
    }

    if (role === "workers") {
      redirect("/dashboard-workers");
    }

    if (role === "admin") {
      redirect("/dashboard-admin");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
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
          <div className="mb-3 flex justify-center">
            <Image
              src="/mabini-logo.png"
              alt="MabiniCare official logo"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border border-blue-200 bg-white object-cover"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            MabiniCare
          </h1>
          <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            Barangay Management Dashboard
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">Demo Credentials (Testing)</p>
          <p className="mt-1 text-xs">Contact your administrator for access</p>
        </div>
      </div>
    </div>
  );
}
