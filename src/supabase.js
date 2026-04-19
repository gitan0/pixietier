import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = (url && key)
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;

export const isSupabaseConfigured = () => supabase !== null;

// Generate a short URL-safe slug (8 chars, ~47 bits entropy)
export function generateSlug() {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/1/l/o to avoid confusion
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function saveTierList({ title, tiers, creatorName }) {
  if (!supabase) throw new Error("Supabase not configured");
  // Retry on slug collision (extremely unlikely but cheap)
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = generateSlug();
    const { data, error } = await supabase
      .from("tier_lists")
      .insert({
        slug,
        title: title || "My Pixie Tier List",
        tiers,
        creator_name: creatorName || null,
      })
      .select("slug")
      .single();
    if (!error) return data.slug;
    if (error.code !== "23505") throw error; // 23505 = unique violation
  }
  throw new Error("Could not generate unique slug");
}

export async function loadTierList(slug) {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("tier_lists")
    .select("slug, title, tiers, creator_name, created_at, view_count")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function incrementViewCount(slug) {
  if (!supabase) return;
  try {
    await supabase.rpc("increment_tier_list_views", { list_slug: slug });
  } catch {}
}

export async function snapshotPlayerStats({ totalRankedPlayers, games24h, activeNow }) {
  if (!supabase) return;
  try {
    await supabase
      .from("player_snapshots")
      .upsert({
        snapped_at: new Date().toISOString().slice(0, 10),
        total_ranked_players: totalRankedPlayers ?? null,
        games_24h: games24h ?? null,
        active_now: activeNow ?? null,
      }, { onConflict: "snapped_at", ignoreDuplicates: true });
  } catch (_) {}
}

export async function getPlayerSnapshots() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("player_snapshots")
    .select("snapped_at, total_ranked_players, games_24h, active_now")
    .order("snapped_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getConsensus() {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase.rpc("get_consensus_tiers");
  if (error) throw error;
  return data || [];
}
