import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { isCountryCode } from "@/lib/countries";

const PARTNERS = ["gemiad", "notik"] as const;
const CATEGORIES = ["CPI", "CPR", "CPE", "General Survey"] as const;
const DEVICES = ["android", "ios", "desktop"] as const;
const MAX_REWARD = 2_147_483_647;

type Partner = (typeof PARTNERS)[number];
type OfferEvent = {
  partner_event_id: string;
  name: string;
  reward_nexcoins: number;
};

async function getAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const admin = createServerClient();
  const [{ data: { user }, error: authError }] = await Promise.all([
    admin.auth.getUser(token),
  ]);
  if (authError || !user) return null;

  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error || (profile?.role !== "owner" && profile?.role !== "admin")) return null;
  return { admin, userId: user.id };
}

function parseEvents(value: unknown): OfferEvent[] | null {
  if (!Array.isArray(value) || value.length > 30) return null;
  const events: OfferEvent[] = [];
  const ids = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const event = item as Record<string, unknown>;
    const partnerEventId = typeof event.partner_event_id === "string" ? event.partner_event_id.trim() : "";
    const name = typeof event.name === "string" ? event.name.trim() : "";
    const reward = Number(event.reward_nexcoins);
    if (!partnerEventId || partnerEventId.length > 120 || !name || name.length > 300
      || !Number.isFinite(reward) || reward <= 0 || reward > MAX_REWARD || ids.has(partnerEventId)) {
      return null;
    }
    ids.add(partnerEventId);
    events.push({
      partner_event_id: partnerEventId,
      name,
      reward_nexcoins: reward,
    });
  }
  return events;
}

function safeHttpsUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.length > 4096) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function isAllowedTrackingHost(partner: Partner, hostname: string) {
  const host = hostname.toLowerCase();
  const root = partner === "gemiad" ? "gemiwall.com" : "notik.me";
  return host === root || host.endsWith(`.${root}`);
}

export async function GET(req: NextRequest) {
  const ctx = await getAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: offers, error: offersError }, { data: providers, error: providersError }] = await Promise.all([
    ctx.admin
      .from("premium_task_offers")
      .select("*")
      .order("updated_at", { ascending: false }),
    ctx.admin
      .from("offerwall_providers")
      .select("slug, postback_secret")
      .in("slug", [...PARTNERS]),
  ]);

  if (offersError || providersError) {
    console.error("[admin/premium-tasks] Data load failed:", offersError?.message ?? providersError?.message);
    return NextResponse.json({ error: "Premium task administration is temporarily unavailable." }, { status: 500 });
  }

  const providerRows = providers ?? [];
  return NextResponse.json({
    offers: offers ?? [],
    partners: Object.fromEntries(PARTNERS.map((partner) => [
      partner,
      providerRows.some((provider) => provider.slug === partner && !!provider.postback_secret?.trim()),
    ])) as Record<Partner, boolean>,
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.action === "deactivate") {
    const id = typeof body.id === "string" ? body.id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "A valid offer ID is required." }, { status: 400 });
    const { error } = await ctx.admin
      .from("premium_task_offers")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("[admin/premium-tasks] Deactivation failed:", error.message);
      return NextResponse.json({ error: "Could not deactivate the offer." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const id = typeof body.id === "string" && body.id ? body.id : null;
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "A valid offer ID is required." }, { status: 400 });

  const partner = body.partner_slug;
  const category = body.category;
  if (!PARTNERS.includes(partner as Partner)) {
    return NextResponse.json({ error: "Choose GemiAd or Notik as the campaign source." }, { status: 400 });
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json({ error: "Choose a supported premium task type." }, { status: 400 });
  }

  const advertiserName = typeof body.advertiser_name === "string" ? body.advertiser_name.trim() : "";
  const offerName = typeof body.offer_name === "string" ? body.offer_name.trim() : "";
  const partnerOfferId = typeof body.partner_offer_id === "string" ? body.partner_offer_id.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const trackingTemplate = typeof body.tracking_url_template === "string" ? body.tracking_url_template.trim() : "";
  if (!advertiserName || advertiserName.length > 160 || !offerName || offerName.length > 200
    || !partnerOfferId || partnerOfferId.length > 160 || !description || description.length > 5000) {
    return NextResponse.json({ error: "Advertiser, offer name, partner offer ID, and description are required." }, { status: 400 });
  }

  const url = safeHttpsUrl(trackingTemplate);
  const requiredMacro = partner === "gemiad" ? "{{click_id}}" : "{{user_id}}";
  if (!url || !isAllowedTrackingHost(partner as Partner, url.hostname)
    || !trackingTemplate.includes(requiredMacro)) {
    return NextResponse.json({
      error: `Use an HTTPS ${partner === "gemiad" ? "GemiAd" : "Notik"} tracking link and include ${requiredMacro} in its user ID.`,
    }, { status: 400 });
  }

  const imageUrl = body.image_url === "" || body.image_url == null ? null : safeHttpsUrl(body.image_url);
  if (body.image_url && !imageUrl) return NextResponse.json({ error: "Offer images must use a valid HTTPS URL." }, { status: 400 });

  const countries = body.countries;
  if (!Array.isArray(countries) || countries.length > 250
    || countries.some((country) => typeof country !== "string" || !isCountryCode(country))) {
    return NextResponse.json({ error: "Countries must be valid two-letter country codes." }, { status: 400 });
  }
  const devices = body.devices;
  if (!Array.isArray(devices) || devices.some((device) => !DEVICES.includes(device as (typeof DEVICES)[number]))) {
    return NextResponse.json({ error: "Choose supported devices only." }, { status: 400 });
  }

  const events = parseEvents(body.events);
  if (!events) {
    return NextResponse.json({ error: "Each event needs a unique partner event ID, a name, and a positive NexCoin reward." }, { status: 400 });
  }
  const enteredReward = Number(body.reward_nexcoins);
  const reward = events.length
    ? events.reduce((total, event) => total + event.reward_nexcoins, 0)
    : enteredReward;
  if (!Number.isFinite(reward) || reward <= 0 || reward > MAX_REWARD) {
    return NextResponse.json({ error: "Enter a positive NexCoin reward within the supported limit." }, { status: 400 });
  }

  const isActive = body.is_active === true;
  if (isActive) {
    const { data: provider, error } = await ctx.admin
      .from("offerwall_providers")
      .select("postback_secret")
      .eq("slug", partner)
      .maybeSingle();
    if (error) {
      console.error("[admin/premium-tasks] Partner readiness check failed:", error.message);
      return NextResponse.json({ error: "Could not verify the partner callback configuration." }, { status: 500 });
    }
    if (!provider?.postback_secret?.trim()) {
      return NextResponse.json({ error: "Configure this partner's postback secret under Admin → Offerwalls before activating offers." }, { status: 400 });
    }
  }

  const record = {
    partner_slug: partner,
    partner_offer_id: partnerOfferId,
    advertiser_name: advertiserName,
    offer_name: offerName,
    category,
    description,
    terms: typeof body.terms === "string" ? body.terms.trim() || null : null,
    confirmation_time: typeof body.confirmation_time === "string" ? body.confirmation_time.trim() || null : null,
    image_url: imageUrl?.toString() ?? null,
    countries,
    devices,
    os: typeof body.os === "string" ? body.os.trim() || null : null,
    reward_nexcoins: reward,
    events,
    tracking_url_template: trackingTemplate,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  const query = id
    ? ctx.admin.from("premium_task_offers").update(record).eq("id", id)
    : ctx.admin.from("premium_task_offers").insert({ ...record, created_by: ctx.userId });
  const { data: offer, error } = await query.select("*").single();
  if (error || !offer) {
    console.error("[admin/premium-tasks] Save failed:", error?.message ?? "No offer returned");
    const conflict = error?.code === "23505";
    return NextResponse.json({
      error: conflict ? "An offer with this partner and offer ID already exists." : "Could not save this offer.",
    }, { status: conflict ? 409 : 500 });
  }

  return NextResponse.json({ offer });
}
