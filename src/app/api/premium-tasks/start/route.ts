import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getProfileCountryCode } from "@/lib/countries";

type Partner = "gemiad" | "notik";

function isAllowedPartnerHost(partner: Partner, hostname: string) {
  const root = partner === "gemiad" ? "gemiwall.com" : "notik.me";
  const host = hostname.toLowerCase();
  return host === root || host.endsWith(`.${root}`);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let offerId: string;
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || typeof (body as { offerId?: unknown }).offerId !== "string") {
      return NextResponse.json({ error: "A valid offer is required." }, { status: 400 });
    }
    offerId = (body as { offerId: string }).offerId;
  } catch {
    return NextResponse.json({ error: "A valid offer is required." }, { status: 400 });
  }

  const admin = createServerClient();
  const [{ data: { user }, error: authError }] = await Promise.all([
    admin.auth.getUser(token),
  ]);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: profile, error: profileError }, { data: offer, error: offerError }] = await Promise.all([
    admin
      .from("profiles")
      .select("country, country_code")
      .eq("id", user.id)
      .single(),
    admin
      .from("premium_task_offers")
      .select("id, partner_slug, partner_offer_id, advertiser_name, offer_name, reward_nexcoins, events, countries, tracking_url_template, is_active")
      .eq("id", offerId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (profileError || offerError) {
    console.error("[api/premium-tasks/start] Offer lookup failed:", profileError?.message ?? offerError?.message);
    return NextResponse.json({ error: "This offer cannot be started right now." }, { status: 503 });
  }
  if (!profile || !offer) return NextResponse.json({ error: "This offer is no longer available." }, { status: 404 });

  const partner = offer.partner_slug as Partner;
  if (partner !== "gemiad" && partner !== "notik") {
    console.error("[api/premium-tasks/start] Unsupported stored partner:", offer.partner_slug);
    return NextResponse.json({ error: "This offer cannot be started right now." }, { status: 503 });
  }

  const countryCode = getProfileCountryCode(profile.country_code, profile.country);
  const countries = Array.isArray(offer.countries) ? offer.countries : [];
  if (countries.length > 0 && (!countryCode || !countries.includes(countryCode))) {
    return NextResponse.json({ error: "This offer is not available in your profile country." }, { status: 403 });
  }

  const clickId = crypto.randomUUID();
  let trackingUrl: URL;
  try {
    const template = typeof offer.tracking_url_template === "string" ? offer.tracking_url_template : "";
    const resolved = partner === "gemiad"
      ? template.replaceAll("{{click_id}}", clickId)
      : template.replaceAll("{{user_id}}", user.id);
    trackingUrl = new URL(resolved);
    if (trackingUrl.protocol !== "https:" || !isAllowedPartnerHost(partner, trackingUrl.hostname)) {
      throw new Error("Stored offer tracking URL is not allowed.");
    }

    if (partner === "gemiad") {
      if (!template.includes("{{click_id}}")) throw new Error("GemiAd link is missing the click ID macro.");
      trackingUrl.searchParams.set("userId", clickId);
    } else {
      if (!template.includes("{{user_id}}")) throw new Error("Notik link is missing the profile user ID macro.");
      const userIdParam = [...trackingUrl.searchParams.keys()]
        .find((key) => key.toLowerCase() === "user_id");
      if (!userIdParam) throw new Error("Notik link is missing its user ID parameter.");
      trackingUrl.searchParams.set("s1", clickId);
    }
  } catch (error) {
    console.error("[api/premium-tasks/start] Invalid tracking URL:", error);
    return NextResponse.json({ error: "This offer's tracking link is not configured correctly." }, { status: 503 });
  }

  const events = Array.isArray(offer.events) ? offer.events : [];
  const { error: clickError } = await admin.from("premium_task_clicks").insert({
    click_id: clickId,
    offer_id: offer.id,
    contributor_id: user.id,
    partner_slug: partner,
    partner_offer_id: offer.partner_offer_id,
    advertiser_name: offer.advertiser_name,
    offer_name: offer.offer_name,
    reward_nexcoins: offer.reward_nexcoins,
    events,
  });
  if (clickError) {
    console.error("[api/premium-tasks/start] Could not record click:", clickError.message);
    return NextResponse.json({ error: "This offer could not be started. Please try again." }, { status: 500 });
  }

  return NextResponse.json(
    { trackingUrl: trackingUrl.toString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
