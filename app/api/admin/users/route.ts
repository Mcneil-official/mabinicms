/* eslint-disable @typescript-eslint/no-require-imports */
import { createServerSupabaseClient } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { auditRecordOperation } from "@/lib/audit-logger";
import { requireRole } from "@/lib/api-authorization";
import { RoleType } from "@/lib/rbac/roles";
import {
  adminCreateUserSchema,
  adminUserListQuerySchema,
} from "@/lib/schemas/admin";

/**
 * Admin Users API
 * GET: List all users with pagination and filtering
 * POST: Create a new user
 */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, RoleType.ADMIN);
    if (!auth.authorized) {
      return auth.error;
    }

    const session = auth.session;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const parsedQuery = adminUserListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsedQuery.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { page, limit, search, role, status } = parsedQuery.data;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from("users")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(`username.ilike.%${search}%`);
    }

    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    }

    const { data: users, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      users,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, RoleType.ADMIN);
    if (!auth.authorized) {
      return auth.error;
    }

    const session = auth.session;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const parsedBody = adminCreateUserSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { username, password, role, assigned_barangay } = parsedBody.data;

    // Hash password
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        username,
        password_hash: passwordHash,
        role,
        user_role: role,
        assigned_barangay: assigned_barangay || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await auditRecordOperation(
      session.user.id,
      "create",
      "user",
      newUser.id,
      undefined,
      { username, role, assigned_barangay }
    );

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
