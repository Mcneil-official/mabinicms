"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, setSession } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas/auth";
import type { User, Session } from "@/lib/types";
import bcrypt from "bcryptjs";

/**
 * Server Action: Login with username and password
 * Verifies credentials against public.users table
 * Sets secure session cookie on success
 */
export async function loginAction(formData: {
  username: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const validation = loginSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: "Invalid username or password" };
  }

  const { username, password } = validation.data;

  try {
    const supabase = await createServerSupabaseClient();

    // Fetch user from public.users table (exclude workers — they must use the worker login)
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .neq("user_role", "workers")
      .single();

    if (error || !user) {
      // Don't reveal if user exists or not (security best practice)
      return { success: false, error: "Invalid username or password" };
    }

    // Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return { success: false, error: "Invalid username or password" };
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

    // Redirect to dashboard
    redirect("/dashboard");
  } catch (error) {
    console.error("[loginAction]", error);
    return { success: false, error: "An error occurred. Please try again." };
  }
}

/**
 * Server Action: Logout
 * Clears session cookie and redirects to login
 */
export async function logoutAction(): Promise<void> {
  const { clearSession } = await import("@/lib/auth");
  await clearSession();
  redirect("/auth/login");
}
