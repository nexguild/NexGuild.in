import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin" && callerProfile?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { requestId, voucherCode } = await req.json() as {
    requestId: string;
    voucherCode: string;
  };

  if (!requestId || !voucherCode?.trim()) {
    return NextResponse.json({ error: "requestId and voucherCode are required" }, { status: 400 });
  }

  const { error: updateErr } = await admin
    .from("voucher_requests")
    .update({ voucher_code: voucherCode.trim() })
    .eq("id", requestId);

  if (updateErr) {
    return NextResponse.json({ error: "Failed to update: " + updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
