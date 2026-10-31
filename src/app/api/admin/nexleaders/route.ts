import { NextResponse } from "next/server";

function retiredResponse() {
  return NextResponse.json(
    { error: "The NexLeader program has been retired." },
    { status: 410 },
  );
}

export async function GET() {
  return retiredResponse();
}

export async function POST() {
  return retiredResponse();
}
