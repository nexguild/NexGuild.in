import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getProfileCountryCode } from "@/lib/countries";

export const dynamic = "force-dynamic";

type StoredEvent = {
  partner_event_id: string;
  name: string;
  reward_nexcoins: number;
};

function isStoredEvent(value: unknown): value is StoredEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return typeof event.partner_event_id === "string"
    && typeof event.name === "string"
    && Number.isFinite(Number(event.reward_nexcoins))
    && Number(event.reward_nexcoins) > 0;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const [{ data: { user }, error: authError }] = await Promise.all([
    admin.auth.getUser(token),
  ]);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: profile, error: profileError }, { data: offers, error: offersError }] = await Promise.all([
    admin
      .from("profiles")
      .select("country, country_code")
      .eq("id", user.id)
      .single(),
    admin
      .from("premium_task_offers")
      .select("id, advertiser_name, offer_name, category, description, terms, confirmation_time, image_url, countries, devices, os, reward_nexcoins, events")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  if (profileError || offersError) {
    console.error("[api/premium-tasks] Feed lookup failed:", profileError?.message ?? offersError?.message);
    return NextResponse.json({ error: "Premium tasks are temporarily unavailable." }, { status: 503 });
  }

  const countryCode = getProfileCountryCode(profile?.country_code, profile?.country);
  const eligible = (offers ?? []).filter((offer) => {
    const countries = Array.isArray(offer.countries) ? offer.countries : [];
    return countries.length === 0 || (countryCode !== null && countries.includes(countryCode));
  }).map((offer) => {
    const events = Array.isArray(offer.events) ? offer.events.filter(isStoredEvent) : [];
    const reward = events.length
      ? events.reduce((total, event) => total + Number(event.reward_nexcoins), 0)
      : Number(offer.reward_nexcoins);
    return {
      id: offer.id,
      advertiserName: offer.advertiser_name,
      name: offer.offer_name,
      category: offer.category,
      description: offer.description,
      terms: offer.terms,
      confirmationTime: offer.confirmation_time,
      imageUrl: offer.image_url,
      countries: Array.isArray(offer.countries) ? offer.countries : [],
      devices: Array.isArray(offer.devices) ? offer.devices : [],
      os: offer.os,
      estimatedRewardCoins: reward,
      events: events.map((event) => ({
        name: event.name,
        estimatedRewardCoins: Number(event.reward_nexcoins),
      })),
    };
  });

  return NextResponse.json(
    { offers: eligible, countryCode, countryMissing: countryCode === null },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
