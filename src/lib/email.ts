import { Resend } from "resend";

export const FROM_NOREPLY = "NexGuild <noreply@nexguild.in>";

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0D0D0D;border-radius:16px;overflow:hidden;border:1px solid #222;">
      <!-- header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a0f00 0%,#0D0D0D 50%,#1a0800 100%);padding:22px 36px;border-bottom:1px solid rgba(245,158,11,0.15);">
          <span style="font-size:22px;font-weight:800;color:#F59E0B;letter-spacing:-0.5px;">NexGuild</span>
        </td>
      </tr>
      <!-- body -->
      <tr><td style="padding:32px 36px;">${body}</td></tr>
      <!-- footer -->
      <tr>
        <td style="padding:18px 36px;border-top:1px solid #1f1f1f;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#444;">© 2025 NexGuild · <a href="https://nexguild.in" style="color:#444;text-decoration:none;">nexguild.in</a></p>
          <p style="margin:0;font-size:11px;color:#2f2f2f;">You received this because you have a NexGuild account.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function btn(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
  <tr><td style="background:#F59E0B;border-radius:10px;">
    <a href="${href}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:700;color:#000;text-decoration:none;">${text}</a>
  </td></tr>
</table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Welcome
// ─────────────────────────────────────────────────────────────────────────────
export function welcomeHtml(name: string): string {
  const n = esc(name);
  return layout(`
<h1 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#fff;">Welcome to NexGuild! 🎉</h1>
<p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.38);">Your account is ready. Let's get you earning.</p>

<p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7;">
  Hi <strong style="color:#fff;">${n}</strong>,<br><br>
  You're now part of NexGuild — the platform where contributors earn real rewards by completing tasks for organisations.
  Browse tasks, earn NexCoins, and redeem them for Amazon, Flipkart, and more gift vouchers.
</p>

<div style="background:#111;border:1px solid #222;border-radius:10px;padding:18px 22px;margin:0 0 24px;">
  <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:1px;">Get started in 3 steps</p>
  <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.6;"><strong style="color:#fff;">1.</strong> Complete your profile — add skills and device info</p>
  <p style="margin:0 0 8px;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.6;"><strong style="color:#fff;">2.</strong> Browse available tasks and find one that fits you</p>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.65);line-height:1.6;"><strong style="color:#fff;">3.</strong> Submit your work and earn NexCoins</p>
</div>

${btn("Go to Dashboard →", "https://nexguild.in/dashboard")}

<p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.3);">
  New to NexGuild? <a href="https://nexguild.in/earn" style="color:#F59E0B;text-decoration:none;">See how it works →</a>
</p>`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Task Approved
// ─────────────────────────────────────────────────────────────────────────────
export function taskApprovedHtml(
  name: string,
  taskTitle: string,
  coinsAwarded: number,
  newBalance: number,
): string {
  const n = esc(name), t = esc(taskTitle);
  return layout(`
<div style="background:linear-gradient(135deg,#0a1f0a,#0f1a0f);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:18px 22px;margin:0 0 24px;">
  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#22c55e;text-transform:uppercase;letter-spacing:1px;">Submission Approved ✓</p>
  <p style="margin:0;font-size:30px;font-weight:800;color:#4ade80;">+${coinsAwarded.toLocaleString()} NexCoins</p>
</div>

<p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7;">
  Hi <strong style="color:#fff;">${n}</strong>,<br><br>
  Your submission for <strong style="color:#fff;">${t}</strong> has been approved and the coins have been added to your balance.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:10px;margin:0 0 24px;">
  <tr><td style="padding:14px 20px;border-bottom:1px solid #1a1a1a;">
    <span style="font-size:12px;color:rgba(255,255,255,0.38);">Task</span><br>
    <span style="font-size:14px;color:#fff;font-weight:600;">${t}</span>
  </td></tr>
  <tr><td style="padding:14px 20px;border-bottom:1px solid #1a1a1a;">
    <span style="font-size:12px;color:rgba(255,255,255,0.38);">Coins Earned</span><br>
    <span style="font-size:16px;color:#4ade80;font-weight:700;">+${coinsAwarded.toLocaleString()} NexCoins</span>
  </td></tr>
  <tr><td style="padding:14px 20px;">
    <span style="font-size:12px;color:rgba(255,255,255,0.38);">New Balance</span><br>
    <span style="font-size:16px;color:#F59E0B;font-weight:700;">${newBalance.toLocaleString()} NexCoins</span>
  </td></tr>
</table>

${btn("View Earnings →", "https://nexguild.in/dashboard/earnings")}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Task Rejected
// ─────────────────────────────────────────────────────────────────────────────
export function taskRejectedHtml(
  name: string,
  taskTitle: string,
  feedback: string | null,
): string {
  const n = esc(name), t = esc(taskTitle);
  const f = feedback ? esc(feedback) : null;
  return layout(`
<h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#fff;">Submission Feedback</h1>
<p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.38);">${t}</p>

<p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7;">
  Hi <strong style="color:#fff;">${n}</strong>,<br><br>
  Your submission for <strong style="color:#fff;">${t}</strong> was reviewed but did not meet the quality criteria this time.
</p>

${f ? `<div style="background:#1c1010;border:1px solid rgba(239,68,68,0.25);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 20px;">
  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:1px;">Reviewer Feedback</p>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;white-space:pre-wrap;">${f}</p>
</div>` : ""}

<div style="background:#111;border:1px solid #222;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
  <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:1px;">Next steps</p>
  <p style="margin:0 0 6px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">• Review the task instructions carefully</p>
  <p style="margin:0 0 6px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">• Address the feedback above before re-submitting</p>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">• You can re-submit when you're confident in your work</p>
</div>

${btn("Go to My Tasks →", "https://nexguild.in/dashboard/tasks")}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Assignment Approved
// ─────────────────────────────────────────────────────────────────────────────
export function assignmentApprovedHtml(
  name: string,
  taskTitle: string,
  taskId: string,
): string {
  const n = esc(name), t = esc(taskTitle), id = esc(taskId);
  return layout(`
<div style="background:linear-gradient(135deg,#0a1f0a,#0f1a0f);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:18px 22px;margin:0 0 24px;">
  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#22c55e;text-transform:uppercase;letter-spacing:1px;">Assignment Approved ✓</p>
  <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${t}</p>
</div>

<p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7;">
  Hi <strong style="color:#fff;">${n}</strong>,<br><br>
  Your assignment for <strong style="color:#fff;">${t}</strong> has been approved. You can now access the full task and start earning NexCoins.
</p>

${btn("Start the Task →", `https://nexguild.in/dashboard/tasks/${id}`)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Assignment Rejected
// ─────────────────────────────────────────────────────────────────────────────
export function assignmentRejectedHtml(
  name: string,
  taskTitle: string,
  feedback: string | null,
): string {
  const n = esc(name), t = esc(taskTitle);
  const f = feedback ? esc(feedback) : null;
  return layout(`
<h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#fff;">Assignment Feedback</h1>
<p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.38);">${t}</p>

<p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7;">
  Hi <strong style="color:#fff;">${n}</strong>,<br><br>
  Your assignment for <strong style="color:#fff;">${t}</strong> was reviewed but did not pass this time.
</p>

${f ? `<div style="background:#1c1010;border:1px solid rgba(239,68,68,0.25);border-left:3px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 20px;">
  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#f87171;text-transform:uppercase;letter-spacing:1px;">Reviewer Feedback</p>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;white-space:pre-wrap;">${f}</p>
</div>` : ""}

<div style="background:#111;border:1px solid #222;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
  <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:1px;">Tips to improve</p>
  <p style="margin:0 0 6px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">• Re-read the task description and requirements carefully</p>
  <p style="margin:0 0 6px;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">• Check your work for accuracy before re-applying</p>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.6;">• You can re-apply for this assignment after reviewing</p>
</div>

${btn("Browse Tasks →", "https://nexguild.in/dashboard/tasks")}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. New Task Available
// ─────────────────────────────────────────────────────────────────────────────
export function newTaskHtml(
  name: string,
  taskTitle: string,
  taskType: string,
  coinsPerTask: number,
  totalSlots: number | null,
  taskId: string,
): string {
  const n = esc(name), t = esc(taskTitle), ty = esc(taskType), id = esc(taskId);
  return layout(`
<div style="display:inline-block;background:#111;border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:4px 14px;margin:0 0 18px;">
  <span style="font-size:12px;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:1px;">New Task Available</span>
</div>

<h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#fff;line-height:1.3;">${t}</h1>
<p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.38);">${ty}</p>

<p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.7;">
  Hi <strong style="color:#fff;">${n}</strong>,<br><br>
  A new task has just been posted on NexGuild. Slots fill up fast — get in early!
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:10px;margin:0 0 24px;">
  <tr><td style="padding:14px 20px;${totalSlots != null ? "border-bottom:1px solid #1a1a1a;" : ""}">
    <span style="font-size:12px;color:rgba(255,255,255,0.38);">Reward</span><br>
    <span style="font-size:20px;color:#F59E0B;font-weight:800;">${coinsPerTask.toLocaleString()} NexCoins</span>
    <span style="font-size:12px;color:rgba(255,255,255,0.3);"> per submission</span>
  </td></tr>
  ${totalSlots != null ? `<tr><td style="padding:14px 20px;">
    <span style="font-size:12px;color:rgba(255,255,255,0.38);">Slots Available</span><br>
    <span style="font-size:14px;color:#fff;font-weight:600;">${totalSlots.toLocaleString()}</span>
  </td></tr>` : ""}
</table>

${btn("View Task →", `https://nexguild.in/dashboard/tasks/${id}`)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Announcement
// ─────────────────────────────────────────────────────────────────────────────
export function announcementHtml(
  name: string,
  annTitle: string,
  annMessage: string,
): string {
  const n = esc(name), at = esc(annTitle), am = esc(annMessage);
  return layout(`
<div style="display:inline-block;background:#111;border:1px solid rgba(245,158,11,0.3);border-radius:8px;padding:4px 14px;margin:0 0 18px;">
  <span style="font-size:12px;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:1px;">📢 Announcement</span>
</div>

<h1 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#fff;line-height:1.3;">${at}</h1>

<p style="margin:0 0 16px;font-size:15px;color:rgba(255,255,255,0.7);">Hi <strong style="color:#fff;">${n}</strong>,</p>

<div style="background:#111;border:1px solid #222;border-left:3px solid #F59E0B;border-radius:0 10px 10px 0;padding:18px 22px;margin:0 0 24px;">
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.7;white-space:pre-wrap;">${am}</p>
</div>

${btn("View on Dashboard →", "https://nexguild.in/dashboard/announcements")}`);
}
