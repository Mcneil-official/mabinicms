"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, setSession } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas/auth";
import type { Session } from "@/lib/types";
import bcrypt from "bcryptjs";

/**
 * Server Action: Admin-only login
 * Verifies credentials against public.users where user_role='admin'
 */
export async function adminLoginAction(formData: {
  username: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const validation = loginSchema.safeParse(formData);
  if (!validation.success) {
    return { success: false, error: "Invalid admin credentials" };
  }

  const { username, password } = validation.data;

  try {
    const supabase = await createServerSupabaseClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("user_role", "admin")
      .single();

    if (error || !user) {
      return { success: false, error: "Invalid admin credentials" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return { success: false, error: "Invalid admin credentials" };
    }

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

    await setSession(session);
    redirect("/dashboard-admin");
  } catch (error) {
    console.error("[adminLoginAction]", error);
    return { success: false, error: "An error occurred. Please try again." };
  }
}

/**
 * Server Action: Admin logout
 */
export async function adminLogoutAction(): Promise<void> {
  const { clearSession } = await import("@/lib/auth");
  await clearSession();
  redirect("/auth/admin");
}
