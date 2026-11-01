import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { writeAdminAudit } from "@/lib/admin-audit";

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileErr) {
    console.error("[refund-voucher] staff lookup error:", profileErr.message);
    return NextResponse.json({ error: "Unable to verify staff access." }, { status: 500 });
  }
  if (!["owner", "admin", "finance"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { requestId?: string; reason?: string };
  try {
    body = await req.json() as { requestId?: string; reason?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const requestId = body.requestId?.trim();
  const reason = body.reason?.trim();
  if (!requestId || !reason || reason.length < 10 || reason.length > 500) {
    return NextResponse.json({ error: "Provide a request ID and a reason between 10 and 500 characters." }, { status: 400 });
  }

  const { data: refundAmount, error: refundErr } = await admin.rpc("refund_voucher_request", {
    p_request_id: requestId,
    p_reason: reason,
    p_admin_id: user.id,
  });

  if (refundErr) {
    console.error("[refund-voucher] refund error:", refundErr.message);
    const status =
      refundErr.message.includes("not found") ? 404
        : refundErr.message.includes("legacy request") ? 409
          : refundErr.message.includes("Only pending or processing") ? 409
            : refundErr.message.includes("Forbidden") ? 403
              : 500;
    return NextResponse.json({ error: refundErr.message }, { status });
  }

  await writeAdminAudit(admin, {
    actorId: user.id,
    action: "voucher_refunded",
    targetType: "voucher_request",
    targetId: requestId,
    summary: `Refunded ${Number(refundAmount).toLocaleString()} NexCoins for voucher request: ${reason}`,
    metadata: { refundAmount: Number(refundAmount), reason },
  });

  return NextResponse.json({ success: true, refundAmount });
}
