import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "NexLeader referral assignment has been retired." },
    { status: 410 },
  );
}
