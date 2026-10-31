import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "The NexLeader program has been retired." },
    { status: 410 },
  );
}
