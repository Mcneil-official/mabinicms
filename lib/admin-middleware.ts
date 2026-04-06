import { createServerSupabaseClient } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Admin middleware - verify user is admin before allowing page load
 * Use in layout or page server components
 */
export async function requireAdminRole() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const role = (userData?.role || "").trim().toLowerCase();

  if (role !== "admin") {
    redirect(role === "workers" ? "/dashboard-workers" : "/dashboard-barangay");
  }

  return userData;
}
