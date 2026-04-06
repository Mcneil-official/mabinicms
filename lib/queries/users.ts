"use server";

import { createServerSupabaseClient } from "@/lib/auth";
import type { User } from "@/lib/types";

/**
 * Fetch all internal staff users (admin only)
 */
export async function getStaffUsers(filters?: {
  role?: "user" | "workers" | "staff" | "admin";
  barangay?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Apply role filter
  if (filters?.role) {
    query = query.eq("role", filters.role);
  }

  // Apply barangay filter
  if (filters?.barangay) {
    query = query.eq("assigned_barangay", filters.barangay);
  }

  // Apply pagination
  const limit = filters?.limit || 10;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[getStaffUsers]", error);
    return { data: [], count: 0, error };
  }

  return { data: (data || []) as User[], count: count || 0, error: null };
}

/**
 * Fetch a single staff user by ID
 */
export async function getStaffUserById(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getStaffUserById]", error);
    return { data: null, error };
  }

  return { data: data as User, error: null };
}

/**
 * Get unique barangays from staff users
 */
export async function getBarangays() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("assigned_barangay")
    .order("assigned_barangay");

  if (error) {
    console.error("[getBarangays]", error);
    return { data: [], error };
  }

  const barangays = (data || [])
    .map((d) => d.assigned_barangay)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  return { data: barangays as string[], error: null };
}
