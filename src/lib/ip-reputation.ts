/**
 * IPQualityScore (IPQS) VPN/proxy/datacenter detection.
 * Env var required: IPQS_API_KEY
 * Free tier: 1,000 lookups/month.
 *
 * Quota strategy: results are cached in the `ip_reputation_cache` DB table.
 * The same IP is never checked twice (within CACHE_TTL_DAYS). This means
 * 1,000 calls covers 1,000 distinct IP addresses across ALL users — not 1 per login.
 */

import { createServerClient } from "@/lib/supabase-server";

export interface IpReputationResult {
  vpnDetected: boolean;
  fraudScore:  number;
}

const CACHE_TTL_DAYS = 30;

const PRIVATE_PREFIXES = [
  "127.", "10.", "192.168.", "::1", "localhost",
  "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.",
  "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
  "172.30.", "172.31.",
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_PREFIXES.some((p) => ip.startsWith(p));
}

async function callIpqs(ip: string): Promise<IpReputationResult | null> {
  const apiKey = process.env.IPQS_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://ipqualityscore.com/api/json/ip/${apiKey}/${encodeURIComponent(ip)}` +
      `?strictness=1&allow_public_access_points=true&fast=true&lighter_penalties=true`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data = await res.json() as {
      success: boolean;
      vpn: boolean;
      proxy: boolean;
      tor: boolean;
      fraud_score: number;
    };

    if (!data.success) return null;

    const vpnDetected = !!(data.vpn || data.proxy || data.tor || data.fraud_score >= 85);
    return { vpnDetected, fraudScore: data.fraud_score ?? 0 };
  } catch {
    return null;
  }
}

/**
 * Returns the VPN/proxy status for an IP, using the DB cache to avoid
 * redundant IPQS calls. Only hits the IPQS API for IPs not seen before
 * (or whose cache entry is older than CACHE_TTL_DAYS).
 */
export async function getIpReputation(ip: string): Promise<IpReputationResult | null> {
  if (!ip || isPrivateIp(ip)) return null;

  const admin = createServerClient();

  // Check cache first
  const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await admin
    .from("ip_reputation_cache")
    .select("vpn_detected, fraud_score, checked_at")
    .eq("ip", ip)
    .gte("checked_at", cutoff)
    .maybeSingle();

  if (cached) {
    return {
      vpnDetected: (cached as { vpn_detected: boolean }).vpn_detected,
      fraudScore:  (cached as { fraud_score: number }).fraud_score,
    };
  }

  // Cache miss — call IPQS
  const result = await callIpqs(ip);
  if (!result) return null;

  // Upsert into cache (ignore errors — don't break login if cache write fails)
  try {
    await admin.from("ip_reputation_cache").upsert({
      ip,
      vpn_detected: result.vpnDetected,
      fraud_score:  result.fraudScore,
      checked_at:   new Date().toISOString(),
    }, { onConflict: "ip" });
  } catch { /* non-fatal */ }

  return result;
}
