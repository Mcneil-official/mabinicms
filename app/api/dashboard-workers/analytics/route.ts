import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "Analytics and Health Indicators are now available on /dashboard-barangay.",
    },
    { status: 410 },
  );
}
