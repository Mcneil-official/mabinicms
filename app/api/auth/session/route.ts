/**
 * Session API Route
 * Returns current user session information
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
        user_role: session.user.role, // Include both for compatibility
        assigned_barangay: session.user.assigned_barangay,
      },
    });
  } catch (error) {
    console.error("Session endpoint error:", error);
    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}
