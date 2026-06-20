import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
    const ALLOWED_ROLES = ["owner", "admin", "reviewer"];
    if (!ALLOWED_ROLES.includes(caller?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await admin
      .from("submissions")
      .select(`
        id,
        contributor_id,
        status,
        notes,
        files,
        coins_awarded,
        feedback,
        submitted_at,
        tasks ( id, title, pay_per_task ),
        profiles ( full_name, email )
      `)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("[admin/submissions] query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submissions: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
