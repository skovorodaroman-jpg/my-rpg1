import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "❌ Не знайдено VITE_SUPABASE_URL або VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);


// =====================================================
// AUTH
// =====================================================

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("getSession:", error);
    return null;
  }

  return data.session;
}


export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("getCurrentUser:", error);
    return null;
  }

  return data.user;
}


export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("signOut:", error);
    throw error;
  }
}


// =====================================================
// AUTH LISTENER
// =====================================================

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}


// =====================================================
// PROFILE
// =====================================================

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("getProfile:", error);
    throw error;
  }

  return data;
}


export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("updateProfile:", error);
    throw error;
  }

  return data;
}


// =====================================================
// PLAYER STATS
// =====================================================

export async function getPlayerStats(userId) {
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getPlayerStats:", error);
    throw error;
  }

  return data;
}


export async function updatePlayerStats(userId, updates) {
  const { data, error } = await supabase
    .from("player_stats")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("updatePlayerStats:", error);
    throw error;
  }

  return data;
}


// =====================================================
// HEROES
// =====================================================

export async function getHeroes() {
  const { data, error } = await supabase
    .from("heroes")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("getHeroes:", error);
    throw error;
  }

  return data || [];
}


export async function getPlayerHeroes(userId) {
  const { data, error } = await supabase
    .from("player_heroes")
    .select(`
      *,
      hero:heroes(*)
    `)
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    console.error("getPlayerHeroes:", error);
    throw error;
  }

  return data || [];
}


export async function addPlayerHero(userId, heroId, stats = {}) {
  const { data, error } = await supabase
    .from("player_heroes")
    .insert({
      user_id: userId,
      hero_id: heroId,
      ...stats,
    })
    .select()
    .single();

  if (error) {
    console.error("addPlayerHero:", error);
    throw error;
  }

  return data;
}


export async function updatePlayerHero(playerHeroId, updates) {
  const { data, error } = await supabase
    .from("player_heroes")
    .update(updates)
    .eq("id", playerHeroId)
    .select()
    .single();

  if (error) {
    console.error("updatePlayerHero:", error);
    throw error;
  }

  return data;
}


// =====================================================
// PETS
// =====================================================

export async function getPets() {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("getPets:", error);
    throw error;
  }

  return data || [];
}


export async function getPlayerPets(userId) {
  const { data, error } = await supabase
    .from("player_pets")
    .select(`
      *,
      pet:pets(*)
    `)
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    console.error("getPlayerPets:", error);
    throw error;
  }

  return data || [];
}


export async function addPlayerPet(userId, petId, data = {}) {
  const { data: result, error } = await supabase
    .from("player_pets")
    .insert({
      user_id: userId,
      pet_id: petId,
      ...data,
    })
    .select()
    .single();

  if (error) {
    console.error("addPlayerPet:", error);
    throw error;
  }

  return result;
}


export async function updatePlayerPet(playerPetId, updates) {
  const { data, error } = await supabase
    .from("player_pets")
    .update(updates)
    .eq("id", playerPetId)
    .select()
    .single();

  if (error) {
    console.error("updatePlayerPet:", error);
    throw error;
  }

  return data;
}


// =====================================================
// ITEMS
// =====================================================

export async function getItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("getItems:", error);
    throw error;
  }

  return data || [];
}


export async function getPlayerItems(userId) {
  const { data, error } = await supabase
    .from("player_items")
    .select(`
      *,
      item:items(*)
    `)
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    console.error("getPlayerItems:", error);
    throw error;
  }

  return data || [];
}


export async function addPlayerItem(userId, itemId, quantity = 1) {
  const { data, error } = await supabase
    .from("player_items")
    .insert({
      user_id: userId,
      item_id: itemId,
      quantity,
    })
    .select()
    .single();

  if (error) {
    console.error("addPlayerItem:", error);
    throw error;
  }

  return data;
}


export async function updatePlayerItem(playerItemId, updates) {
  const { data, error } = await supabase
    .from("player_items")
    .update(updates)
    .eq("id", playerItemId)
    .select()
    .single();

  if (error) {
    console.error("updatePlayerItem:", error);
    throw error;
  }

  return data;
}


// =====================================================
// QUESTS
// =====================================================

export async function getQuests() {
  const { data, error } = await supabase
    .from("quests")
    .select("*")
    .eq("is_active", true)
    .order("created_at");

  if (error) {
    console.error("getQuests:", error);
    throw error;
  }

  return data || [];
}


export async function getPlayerQuests(userId) {
  const { data, error } = await supabase
    .from("player_quests")
    .select(`
      *,
      quest:quests(*)
    `)
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    console.error("getPlayerQuests:", error);
    throw error;
  }

  return data || [];
}


export async function updatePlayerQuest(playerQuestId, updates) {
  const { data, error } = await supabase
    .from("player_quests")
    .update(updates)
    .eq("id", playerQuestId)
    .select()
    .single();

  if (error) {
    console.error("updatePlayerQuest:", error);
    throw error;
  }

  return data;
}


// =====================================================
// BATTLES
// =====================================================

export async function getBattleHistory(userId, limit = 50) {
  const { data, error } = await supabase
    .from("battles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getBattleHistory:", error);
    throw error;
  }

  return data || [];
}


export async function saveBattle(userId, battle) {
  const { data, error } = await supabase
    .from("battles")
    .insert({
      user_id: userId,
      ...battle,
    })
    .select()
    .single();

  if (error) {
    console.error("saveBattle:", error);
    throw error;
  }

  return data;
}


// =====================================================
// GAME SETTINGS
// =====================================================

export async function getGameSettings() {
  const { data, error } = await supabase
    .from("game_settings")
    .select("*")
    .eq("is_public", true)
    .order("key");

  if (error) {
    console.error("getGameSettings:", error);
    throw error;
  }

  return data || [];
}


export async function getGameSetting(key) {
  const { data, error } = await supabase
    .from("game_settings")
    .select("*")
    .eq("key", key)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    console.error("getGameSetting:", error);
    throw error;
  }

  return data;
}


// =====================================================
// ADMIN
// =====================================================

export async function getAdminPlayers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAdminPlayers:", error);
    throw error;
  }

  return data || [];
}


export async function getSystemEvents(limit = 100) {
  const { data, error } = await supabase
    .from("system_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getSystemEvents:", error);
    throw error;
  }

  return data || [];
}


// =====================================================
// REALTIME
// =====================================================

export function subscribeToTable(table, callback) {
  return supabase
    .channel(`realtime-${table}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
      },
      callback
    )
    .subscribe();
}


// =====================================================
// EXPORT
// =====================================================

export default supabase;
