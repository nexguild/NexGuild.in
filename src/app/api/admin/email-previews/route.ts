import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  accountBannedHtml,
  accountDeactivatedHtml,
  adminNotifHtml,
  announcementHtml,
  assignmentApprovedHtml,
  assignmentRejectedHtml,
  binanceRedemptionPaidHtml,
  binanceRedemptionRejectedHtml,
  binanceRedemptionSubmittedHtml,
  coinsDeductedHtml,
  coinsReceivedHtml,
  contactFormHtml,
  contributorInquiryHtml,
  jobApplicationAdminHtml,
  jobApplicationConfirmHtml,
  newTaskHtml,
  nexleaderApprovedHtml,
  nexleaderRejectedHtml,
  resubmissionRequestedHtml,
  taskApprovedHtml,
  taskRejectedHtml,
  supportContributorReplyAlertHtml,
  supportReplyHtml,
  supportTicketCreatedHtml,
  voucherDeliveredHtml,
  weeklyDigestHtml,
  welcomeHtml,
} from "@/lib/email";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[admin/email-previews] role lookup failed:", profileError.message);
    return NextResponse.json({ error: "Unable to verify admin role." }, { status: 500 });
  }
  if (!ADMIN_ROLES.UPPER.some((role) => role === profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const applicant = {
    full_name: "Asha Sharma",
    email: "asha@example.com",
    phone: "+91 98765 43210",
    applicant_role: "Product Designer",
    experience_years: "3 years",
    linkedin_url: "https://www.linkedin.com/in/example",
    resume_url: "https://example.com/resume.pdf",
    notice_period: "30 days",
    current_ctc: "₹6 LPA",
    expected_ctc: "₹9 LPA",
    message: "I am excited to apply and bring my product design experience to your team.",
  };

  const templates = [
    { id: "welcome", name: "Welcome", html: welcomeHtml("Asha") },
    { id: "task-approved", name: "Task submission approved", html: taskApprovedHtml("Asha", "Improve the onboarding flow", 1_320, 8_450) },
    { id: "task-rejected", name: "Task submission feedback", html: taskRejectedHtml("Asha", "Improve the onboarding flow", "Please include the requested screenshots and explain the testing steps.") },
    { id: "assignment-approved", name: "Assignment approved", html: assignmentApprovedHtml("Asha", "Review the mobile experience", "sample-task-id") },
    { id: "assignment-rejected", name: "Assignment feedback", html: assignmentRejectedHtml("Asha", "Review the mobile experience", "Please add more detail about your experience with the product.") },
    { id: "new-task", name: "New task available", html: newTaskHtml("Asha", "Help test a new shopping experience", "Usability Testing", 5_000, 25, "sample-task-id") },
    { id: "account-suspended", name: "Account suspended", html: accountBannedHtml("Asha", "We need to verify recent account activity. Please contact support if you believe this is a mistake.") },
    { id: "coins-received", name: "NexCoins received", html: coinsReceivedHtml("Asha", 500, "Thank you for your continued contributions.", 8_450) },
    { id: "coins-deducted", name: "NexCoins deducted", html: coinsDeductedHtml("Asha", 250, "Adjustment following a duplicate credit.", 7_700) },
    { id: "binance-submitted", name: "Binance Pay request submitted", html: binanceRedemptionSubmittedHtml("Asha", 5, 3_300) },
    { id: "binance-paid", name: "Binance Pay request paid", html: binanceRedemptionPaidHtml("Asha", 5, "TXN-2026-001234") },
    { id: "binance-rejected", name: "Binance Pay request rejected", html: binanceRedemptionRejectedHtml("Asha", 3_300, "The payout details could not be verified. Please review them and contact support.") },
    { id: "resubmission-requested", name: "Resubmission requested", html: resubmissionRequestedHtml("Asha", "Improve the onboarding flow", "Please include the requested screenshots and explain the testing steps.") },
    { id: "nexleader-approved", name: "NexLeader approved", html: nexleaderApprovedHtml("Asha", "https://www.nexguild.in/signup?ref=ASHA123") },
    { id: "nexleader-rejected", name: "NexLeader application update", html: nexleaderRejectedHtml("Asha", "Please build more activity on your account before applying again.") },
    { id: "account-deactivated", name: "Account deactivated", html: accountDeactivatedHtml("Asha", "admin@nexguild.in") },
    { id: "job-application-admin", name: "New job application (admin)", html: jobApplicationAdminHtml("Product Designer", "NexGuild", applicant, "https://www.nexguild.in/admin/jobs/sample-job/edit") },
    { id: "job-application-confirmation", name: "Job application confirmation", html: jobApplicationConfirmHtml("Asha Sharma", "Product Designer", "NexGuild") },
    { id: "announcement", name: "Announcement", html: announcementHtml("Asha", "A new opportunity is here", "A new batch of contributor tasks is now available. Visit your dashboard to explore the latest opportunities.") },
    { id: "admin-alert", name: "Admin alert", html: adminNotifHtml("New Support Ticket", "Asha Sharma", "Voucher issue: My code is not working", "https://www.nexguild.in/admin/support") },
    { id: "weekly-digest", name: "Weekly earnings digest", html: weeklyDigestHtml("Asha", 1_320, 8_450) },
    { id: "contributor-inquiry", name: "Contributor inquiry (admin)", html: contributorInquiryHtml("Asha Sharma", "asha@example.com", "I would like to learn more about contributing to NexGuild.") },
    { id: "contact-form", name: "Contact form submission (admin)", html: contactFormHtml("Asha Sharma", "asha@example.com", "We are interested in discussing a research project.", { company: "Example Studio", projectType: "User research", budget: "$2,000–$5,000", timeline: "Next month" }) },
    { id: "support-ticket-created", name: "New support ticket (admin)", html: supportTicketCreatedHtml("Voucher code is not working", "Asha Sharma", "asha@example.com", "Voucher Issue", "sample-ticket-id", "I received my voucher, but the code is not being accepted at checkout.") },
    { id: "support-contributor-reply", name: "New contributor reply (admin)", html: supportContributorReplyAlertHtml("Voucher code is not working", "Asha Sharma", "I tried the steps you suggested, but the code still does not work.") },
    { id: "support-reply", name: "Support reply (contributor)", html: supportReplyHtml("Voucher code is not working", "Asha Sharma", "Thanks for letting us know. We have issued a replacement code and updated your request.") },
    { id: "voucher-delivered", name: "Voucher delivered", html: voucherDeliveredHtml("Asha", "Amazon Gift Card", "NG-EXAMPLE-2026", 5_000) },
  ];

  return NextResponse.json({ templates });
}
