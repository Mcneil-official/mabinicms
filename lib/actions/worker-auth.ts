"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, setSession } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas/auth";
import type { Session } from "@/lib/types";
import bcrypt from "bcryptjs";

/**
 * Server Action: Worker Login with username and password
 * Verifies credentials against public.users table with role='worker'
 * Sets secure session cookie on success
 */
export async function workerLoginAction(formData: {
  username: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = loginSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: "Invalid username or password" };
  }

  const { username, password } = validation.data;

  let shouldRedirect = false;

  try {
    const supabase = await createServerSupabaseClient();

    // Fetch user from public.users table where user_role is 'workers'
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("user_role", "workers")
      .single();

    if (error || !user) {
      // Don't reveal if user exists or not (security best practice)
      return { success: false, error: "Invalid worker credentials" };
    }

    // Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return { success: false, error: "Invalid worker credentials" };
    }

    // Create session with 7-day expiry
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const session: Session = {
      user: {
        id: user.id,
        username: user.username,
        role: user.user_role,
        assigned_barangay: user.assigned_barangay,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      expires_at: expiresAt,
    };

    // Set session in httpOnly cookie
    await setSession(session);

    // Redirect to workers dashboard after try/catch completes
    shouldRedirect = true;
  } catch (error) {
    console.error("[workerLoginAction]", error);
    return { success: false, error: "An error occurred. Please try again." };
  }

  if (shouldRedirect) {
    redirect("/dashboard-workers");
  }

  return { success: true };
}

/**
 * Server Action: Worker Logout
 * Clears session cookie and redirects to worker login
 */
export async function workerLogoutAction(): Promise<void> {
  const { clearSession } = await import("@/lib/auth");
  await clearSession();
  redirect("/auth/workers");
}
