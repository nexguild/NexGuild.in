import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { createServerClient } from "@/lib/supabase-server";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const QUERY_BATCH_SIZE = 1000;

type LedgerKind = "coin" | "binance";
type Cursor = { createdAt: string; kind: LedgerKind; id: string };
type LedgerRow = {
  id: string;
  contributor_id: string;
  created_at: string;
  kind: LedgerKind;
  transactionType: string;
  status: string | null;
  amount: number;
  currency: "NexCoins" | "USDT";
  coinsRequested: number | null;
  source: string | null;
  description: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  contributorName: string | null;
  contributorEmail: string | null;
};

interface MonthBucket {
  month: string;
  earned: number;
  redeemed: number;
}

function isDate(value: string | null): value is string {
  return value !== null
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function parseCursor(value: string | null): Cursor | null | undefined {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<Cursor>;
    if (
      typeof parsed.createdAt !== "string"
      || Number.isNaN(Date.parse(parsed.createdAt))
      || (parsed.kind !== "coin" && parsed.kind !== "binance")
      || typeof parsed.id !== "string"
      || !/^[0-9a-f-]{36}$/i.test(parsed.id)
    ) return undefined;
    return { createdAt: parsed.createdAt, kind: parsed.kind, id: parsed.id };
  } catch {
    return undefined;
  }
}

function cursorFilter(cursor: Cursor, kind: LedgerKind): string {
  if (kind === "binance" && cursor.kind === "coin") {
    return `created_at.lt.${cursor.createdAt}`;
  }
  if (kind === "coin" && cursor.kind === "binance") {
    return `created_at.lte.${cursor.createdAt}`;
  }
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
}

function compareRows(a: LedgerRow, b: LedgerRow): number {
  const dateOrder = b.created_at.localeCompare(a.created_at);
  if (dateOrder !== 0) return dateOrder;
  if (a.kind !== b.kind) return a.kind === "binance" ? -1 : 1;
  return b.id.localeCompare(a.id);
}

async function loadSummary(admin: ReturnType<typeof createServerClient>) {
  let totalCoinsEarned = 0;
  let totalCoinsRedeemed = 0;
  const buckets: Record<string, MonthBucket> = {};
  let offset = 0;

  while (true) {
    const { data, error } = await admin
      .from("coin_transactions")
      .select("amount, type, created_at")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + QUERY_BATCH_SIZE - 1);
    if (error) return { error: "Unable to load coin ledger summary." };

    for (const transaction of data ?? []) {
      const amount = Number(transaction.amount ?? 0);
      if (transaction.type === "earned") totalCoinsEarned += amount;
      if (transaction.type === "redeemed") totalCoinsRedeemed += amount;

      const date = new Date(transaction.created_at);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const month = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      if (!buckets[key]) buckets[key] = { month, earned: 0, redeemed: 0 };
      if (transaction.type === "earned") buckets[key].earned += amount;
      if (transaction.type === "redeemed") buckets[key].redeemed += amount;
    }

    if ((data?.length ?? 0) < QUERY_BATCH_SIZE) break;
    offset += QUERY_BATCH_SIZE;
  }

  let binancePaidUsdt = 0;
  let paidBinanceCount = 0;
  offset = 0;
  while (true) {
    const { data, error } = await admin
      .from("binance_redemption_requests")
      .select("usdt_amount")
      .eq("status", "paid")
      .order("id", { ascending: true })
      .range(offset, offset + QUERY_BATCH_SIZE - 1);
    if (error) return { error: "Unable to load Binance payout summary." };
    for (const request of data ?? []) {
      binancePaidUsdt += Number(request.usdt_amount ?? 0);
      paidBinanceCount += 1;
    }
    if ((data?.length ?? 0) < QUERY_BATCH_SIZE) break;
    offset += QUERY_BATCH_SIZE;
  }

  const [
    vouchersResult,
    deliveredVouchersResult,
    contributorsResult,
    pendingSubmissionsResult,
    pendingBinanceResult,
  ] = await Promise.all([
    admin.from("voucher_requests").select("id", { count: "exact", head: true }),
    admin.from("voucher_requests").select("id", { count: "exact", head: true }).eq("status", "delivered"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "contributor").eq("status", "active"),
    admin.from("submissions").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    admin.from("binance_redemption_requests").select("id", { count: "exact", head: true }).in("status", ["pending", "under_review"]),
  ]);
  if (vouchersResult.error) return { error: "Unable to load voucher summary." };
  if (deliveredVouchersResult.error) return { error: "Unable to load delivered voucher summary." };
  if (contributorsResult.error) return { error: "Unable to load active contributor summary." };
  if (pendingSubmissionsResult.error) return { error: "Unable to load pending submission summary." };
  if (pendingBinanceResult.error) return { error: "Unable to load pending Binance payout summary." };

  const monthlyData = Object.keys(buckets).sort().slice(-6).map((key) => buckets[key]);
  return {
    summary: {
      totalCoinsEarned,
      totalCoinsRedeemed,
      totalVouchers: vouchersResult.count ?? 0,
      totalDelivered: deliveredVouchersResult.count ?? 0,
      activeContributors: contributorsResult.count ?? 0,
      pendingSubmissions: pendingSubmissionsResult.count ?? 0,
      pendingBinancePayouts: pendingBinanceResult.count ?? 0,
      binancePaidUsdt,
      paidBinanceCount,
      monthlyData,
    },
  };
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!ADMIN_ROLES.FINANCE.some((role) => role === profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const pageSizeValue = Number(params.get("limit") ?? DEFAULT_PAGE_SIZE);
  const limit = Number.isInteger(pageSizeValue) && pageSizeValue > 0
    ? Math.min(pageSizeValue, MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
  const type = params.get("type") ?? "all";
  const status = params.get("status") ?? "all";
  const from = params.get("from");
  const to = params.get("to");
  const cursor = parseCursor(params.get("cursor"));

  if (!["all", "earned", "redeemed", "binance"].includes(type)) {
    return NextResponse.json({ error: "Invalid ledger type filter." }, { status: 400 });
  }
  if (!["all", "pending", "under_review", "paid", "rejected", "refunded", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid payout status filter." }, { status: 400 });
  }
  if (status !== "all" && (type === "earned" || type === "redeemed")) {
    return NextResponse.json({ error: "Payout status cannot be combined with a coin-only filter." }, { status: 400 });
  }
  if ((from && !isDate(from)) || (to && !isDate(to)) || (from && to && from > to)) {
    return NextResponse.json({ error: "Date filters must be valid and ordered calendar dates." }, { status: 400 });
  }
  if (cursor === undefined) return NextResponse.json({ error: "Invalid ledger cursor." }, { status: 400 });

  const includeCoins = type !== "binance" && status === "all";
  const includeBinance = type === "all" || type === "binance" || status !== "all";
  const coinTypes = type === "earned" || type === "redeemed" ? [type] : ["earned", "redeemed"];
  const toExclusive = to
    ? new Date(Date.parse(`${to}T00:00:00.000Z`) + 24 * 60 * 60 * 1000).toISOString()
    : null;
  const dataQueries: PromiseLike<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>[] = [];

  if (includeCoins) {
    let query = admin.from("coin_transactions")
      .select("id, contributor_id, amount, type, source, description, created_at")
      .in("type", coinTypes);
    if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
    if (toExclusive) query = query.lt("created_at", toExclusive);
    if (cursor) query = query.or(cursorFilter(cursor, "coin"));
    dataQueries.push(query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1));
  }

  if (includeBinance) {
    let query = admin.from("binance_redemption_requests")
      .select("id, contributor_id, coins_requested, usdt_amount, status, payment_reference, created_at, paid_at");
    if (status !== "all") query = query.eq("status", status);
    if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
    if (toExclusive) query = query.lt("created_at", toExclusive);
    if (cursor) query = query.or(cursorFilter(cursor, "binance"));
    dataQueries.push(query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1));
  }

  const results = await Promise.all(dataQueries);
  const failedResult = results.find((result) => result.error);
  if (failedResult?.error) {
    console.error("[admin/finance-ledger] query error:", failedResult.error.message);
    return NextResponse.json({ error: "Unable to load finance ledger entries." }, { status: 500 });
  }

  const rows: LedgerRow[] = [];
  for (const result of results) {
    for (const item of result.data ?? []) {
      if ("coins_requested" in item) {
        rows.push({
          id: String(item.id),
          contributor_id: String(item.contributor_id),
          created_at: String(item.created_at),
          kind: "binance",
          transactionType: "Binance payout",
          status: String(item.status),
          amount: Number(item.usdt_amount ?? 0),
          currency: "USDT",
          coinsRequested: Number(item.coins_requested ?? 0),
          source: "binance_pay",
          description: null,
          paymentReference: typeof item.payment_reference === "string" ? item.payment_reference : null,
          paidAt: typeof item.paid_at === "string" ? item.paid_at : null,
          contributorName: null,
          contributorEmail: null,
        });
      } else {
        rows.push({
          id: String(item.id),
          contributor_id: String(item.contributor_id),
          created_at: String(item.created_at),
          kind: "coin",
          transactionType: String(item.type),
          status: null,
          amount: Number(item.amount ?? 0),
          currency: "NexCoins",
          coinsRequested: null,
          source: typeof item.source === "string" ? item.source : null,
          description: typeof item.description === "string" ? item.description : null,
          paymentReference: null,
          paidAt: null,
          contributorName: null,
          contributorEmail: null,
        });
      }
    }
  }
  rows.sort(compareRows);
  const pageRows = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const contributorIds = [...new Set(pageRows.map((row) => row.contributor_id))];
  if (contributorIds.length > 0) {
    const { data: contributors, error } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", contributorIds);
    if (error) {
      console.error("[admin/finance-ledger] contributor lookup error:", error.message);
      return NextResponse.json({ error: "Unable to load finance ledger contributors." }, { status: 500 });
    }
    const contributorById = new Map((contributors ?? []).map((contributor) => [contributor.id, contributor]));
    for (const row of pageRows) {
      const contributor = contributorById.get(row.contributor_id);
      row.contributorName = contributor?.full_name ?? null;
      row.contributorEmail = contributor?.email ?? null;
    }
  }

  let summary;
  if (!cursor) {
    const result = await loadSummary(admin);
    if ("error" in result) {
      console.error("[admin/finance-ledger] summary error:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    summary = result.summary;
  }

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastRow
    ? JSON.stringify({ createdAt: lastRow.created_at, kind: lastRow.kind, id: lastRow.id } satisfies Cursor)
    : null;

  return NextResponse.json({ rows: pageRows, nextCursor, summary });
}
