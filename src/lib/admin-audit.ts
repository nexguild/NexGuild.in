import type { SupabaseClient } from "@supabase/supabase-js";

interface AdminAuditEvent {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export async function writeAdminAudit(
  admin: SupabaseClient,
  event: AdminAuditEvent,
): Promise<void> {
  const { error } = await admin.from("admin_audit_logs").insert({
    actor_id: event.actorId,
    action: event.action,
    target_type: event.targetType,
    target_id: event.targetId ?? null,
    summary: event.summary,
    metadata: event.metadata ?? {},
  });

  if (error) {
    console.error("[admin-audit] failed to write audit entry:", error.message);
  }
}
