"use server";

import { createServerSupabaseClient, getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "staff", "workers", "admin"]),
  assigned_barangay: z.string().min(1, "Barangay is required"),
});

const updateUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).optional(),
  role: z.enum(["user", "staff", "workers", "admin"]).optional(),
  assigned_barangay: z.string().min(1).optional(),
});

const changePasswordSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Server Action: Create new staff user
 * Admin only
 */
export async function createStaffUserAction(
  input: CreateUserInput,
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized - admin only" };
  }

  // Validate input
  const validation = createUserSchema.safeParse(input);
  if (!validation.success) {
    const messages = validation.error.issues
      .map((e) => `${String(e.path[0])}: ${e.message}`)
      .join("; ");
    return { success: false, error: messages };
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check if username already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", input.username)
      .single();

    if (existing) {
      return { success: false, error: "Username already exists" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        username: input.username,
        password_hash: passwordHash,
        role: input.role,
        assigned_barangay: input.assigned_barangay,
      })
      .select("id")
      .single();

    if (createError || !newUser) {
      console.error("[createStaffUserAction]", createError);
      return { success: false, error: "Failed to create user" };
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: session.user.id,
      action: "created",
      resource_type: "user",
      resource_id: newUser.id,
    });

    return { success: true, userId: newUser.id };
  } catch (error) {
    console.error("[createStaffUserAction]", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Server Action: Update staff user
 * Admin only
 */
export async function updateStaffUserAction(
  input: UpdateUserInput,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized - admin only" };
  }

  // Validate input
  const validation = updateUserSchema.safeParse(input);
  if (!validation.success) {
    const messages = validation.error.issues
      .map((e) => `${String(e.path[0])}: ${e.message}`)
      .join("; ");
    return { success: false, error: messages };
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Check if new username already exists (if changing)
    if (input.username) {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", input.username)
        .neq("id", input.id)
        .single();

      if (existing) {
        return { success: false, error: "Username already exists" };
      }
    }

    // Update user
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.username) updateData.username = input.username;
    if (input.role) updateData.role = input.role;
    if (input.assigned_barangay)
      updateData.assigned_barangay = input.assigned_barangay;

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", input.id);

    if (error) {
      console.error("[updateStaffUserAction]", error);
      return { success: false, error: "Failed to update user" };
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: session.user.id,
      action: "updated",
      resource_type: "user",
      resource_id: input.id,
      changes: input,
    });

    return { success: true };
  } catch (error) {
    console.error("[updateStaffUserAction]", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Server Action: Change staff user password
 * Admin only
 */
export async function changeStaffUserPasswordAction(
  input: z.infer<typeof changePasswordSchema>,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized - admin only" };
  }

  // Validate input
  const validation = changePasswordSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: "Invalid password" };
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Hash new password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Update password
    const { error } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (error) {
      console.error("[changeStaffUserPasswordAction]", error);
      return { success: false, error: "Failed to change password" };
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: session.user.id,
      action: "password_changed",
      resource_type: "user",
      resource_id: input.id,
    });

    return { success: true };
  } catch (error) {
    console.error("[changeStaffUserPasswordAction]", error);
    return { success: false, error: "An error occurred" };
  }
}

/**
 * Server Action: Delete staff user
 * Admin only
 */
export async function deleteStaffUserAction(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized - admin only" };
  }

  if (!userId || !z.string().uuid().safeParse(userId).success) {
    return { success: false, error: "Invalid user ID" };
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Prevent deleting the current admin
    if (userId === session.user.id) {
      return { success: false, error: "Cannot delete your own account" };
    }

    // Delete user
    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      console.error("[deleteStaffUserAction]", error);
      return { success: false, error: "Failed to delete user" };
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: session.user.id,
      action: "deleted",
      resource_type: "user",
      resource_id: userId,
    });

    return { success: true };
  } catch (error) {
    console.error("[deleteStaffUserAction]", error);
    return { success: false, error: "An error occurred" };
  }
}
