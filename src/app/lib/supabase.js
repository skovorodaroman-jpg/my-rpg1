import { createClient } from "@supabase/supabase-js";

// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (
  !SUPABASE_URL ||
  !SUPABASE_ANON_KEY
) {
  console.warn(
    "⚠️ Supabase environment variables не налаштовані."
  );
}

export const supabase =
  createClient(
    SUPABASE_URL || "",
    SUPABASE_ANON_KEY || "",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

// ============================================================
// AUTH
// ============================================================

export async function getSession() {
  const {
    data,
    error,
  } =
    await supabase.auth.getSession();

  if (error) {
    console.error(
      "Помилка отримання сесії:",
      error
    );

    return null;
  }

  return data?.session || null;
}

export async function getCurrentUser() {
  const {
    data,
    error,
  } =
    await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data?.user || null;
}

export async function signOut() {
  const {
    error,
  } =
    await supabase.auth.signOut();

  if (error) {
    console.error(
      "Помилка виходу:",
      error
    );

    return {
      success: false,
      error,
    };
  }

  return {
    success: true,
  };
}

// ============================================================
// PROFILE
// ============================================================

export async function getProfile(
  userId
) {
  if (!userId) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

  if (error) {
    console.error(
      "Помилка завантаження профілю:",
      error
    );

    return null;
  }

  return data;
}

export async function updateProfile(
  userId,
  updates = {}
) {
  if (!userId) {
    return {
      data: null,
      error: new Error(
        "Не вказано userId"
      ),
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

  return {
    data,
    error,
  };
}

// ============================================================
// PLAYER STATS
// ============================================================

export async function getPlayerStats(
  userId
) {
  if (!userId) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("player_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

  if (error) {
    console.error(
      "Помилка завантаження статистики:",
      error
    );

    return null;
  }

  return data;
}

export async function updatePlayerStats(
  userId,
  updates = {}
) {
  if (!userId) {
    return {
      data: null,
      error: new Error(
        "Не вказано userId"
      ),
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("player_stats")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

  return {
    data,
    error,
  };
}

// ============================================================
// ГЕРОЇ
// ============================================================

export async function getHeroes() {
  const {
    data,
    error,
  } =
    await supabase
      .from("heroes")
      .select("*")
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

  if (error) {
    console.error(
      "Помилка завантаження героїв:",
      error
    );

    return [];
  }

  return data || [];
}

export async function getPlayerHeroes(
  userId
) {
  if (!userId) {
    return [];
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("player_heroes")
      .select(
        `
          *,
          hero:heroes(*)
        `
      )
      .eq(
        "user_id",
        userId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

  if (error) {
    console.error(
      "Помилка завантаження героїв гравця:",
      error
    );

    return [];
  }

  return data || [];
}

// ============================================================
// ПЕТИ
// ============================================================

export async function getPets() {
  const {
    data,
    error,
  } =
    await supabase
      .from("pets")
      .select("*")
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

  if (error) {
    console.error(
      "Помилка завантаження петів:",
      error
    );

    return [];
  }

  return data || [];
}

export async function getPlayerPets(
  userId
) {
  if (!userId) {
    return [];
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("player_pets")
      .select(
        `
          *,
          pet:pets(*)
        `
      )
      .eq(
        "user_id",
        userId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

  if (error) {
    console.error(
      "Помилка завантаження петів гравця:",
      error
    );

    return [];
  }

  return data || [];
}

// ============================================================
// ПРЕДМЕТИ
// ============================================================

export async function getItems() {
  const {
    data,
    error,
  } =
    await supabase
      .from("items")
      .select("*")
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

  if (error) {
    console.error(
      "Помилка завантаження предметів:",
      error
    );

    return [];
  }

  return data || [];
}

export async function getPlayerItems(
  userId
) {
  if (!userId) {
    return [];
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("player_items")
      .select(
        `
          *,
          item:items(*)
        `
      )
      .eq(
        "user_id",
        userId
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

  if (error) {
    console.error(
      "Помилка завантаження інвентарю:",
      error
    );

    return [];
  }

  return data || [];
}

// ============================================================
// КВЕСТИ
// ============================================================

export async function getQuests() {
  const {
    data,
    error,
  } =
    await supabase
      .from("quests")
      .select("*")
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

  if (error) {
    console.error(
      "Помилка завантаження квестів:",
      error
    );

    return [];
  }

  return data || [];
}

// ============================================================
// БОЇ
// ============================================================

export async function getBattleHistory(
  userId,
  limit = 20
) {
  if (!userId) {
    return [];
  }

  const safeLimit =
    Math.min(
      100,
      Math.max(
        1,
        Number(limit) || 20
      )
    );

  const {
    data,
    error,
  } =
    await supabase
      .from("battles")
      .select("*")
      .eq(
        "user_id",
        userId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(
        safeLimit
      );

  if (error) {
    console.error(
      "Помилка історії боїв:",
      error
    );

    return [];
  }

  return data || [];
}

// ============================================================
// ІГРОВІ НАЛАШТУВАННЯ
// ============================================================

export async function getGameSettings() {
  const {
    data,
    error,
  } =
    await supabase
      .from("game_settings")
      .select("*");

  if (error) {
    console.error(
      "Помилка завантаження налаштувань гри:",
      error
    );

    return [];
  }

  return data || [];
}

export async function getGameSetting(
  key
) {
  if (!key) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("game_settings")
      .select("*")
      .eq(
        "key",
        key
      )
      .maybeSingle();

  if (error) {
    console.error(
      "Помилка завантаження налаштування:",
      error
    );

    return null;
  }

  return data;
}

// ============================================================
// ЗАПИС БОЮ
// ============================================================

export async function saveBattle(
  battle
) {
  if (!battle) {
    return {
      data: null,
      error: new Error(
        "Дані бою відсутні"
      ),
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("battles")
      .insert(
        battle
      )
      .select()
      .single();

  return {
    data,
    error,
  };
}

// ============================================================
// УНІВЕРСАЛЬНИЙ INSERT
// ============================================================

export async function insertRow(
  table,
  values
) {
  if (!table || !values) {
    return {
      data: null,
      error: new Error(
        "Не вказано table або values"
      ),
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(table)
      .insert(values)
      .select()
      .single();

  return {
    data,
    error,
  };
}

// ============================================================
// УНІВЕРСАЛЬНИЙ UPDATE
// ============================================================

export async function updateRow(
  table,
  id,
  values
) {
  if (
    !table ||
    !id ||
    !values
  ) {
    return {
      data: null,
      error: new Error(
        "Недостатньо даних для update"
      ),
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(table)
      .update(values)
      .eq(
        "id",
        id
      )
      .select()
      .single();

  return {
    data,
    error,
  };
}

// ============================================================
// УНІВЕРСАЛЬНИЙ DELETE
// ============================================================

export async function deleteRow(
  table,
  id
) {
  if (
    !table ||
    !id
  ) {
    return {
      data: null,
      error: new Error(
        "Недостатньо даних для delete"
      ),
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(table)
      .delete()
      .eq(
        "id",
        id
      )
      .select();

  return {
    data,
    error,
  };
}

// ============================================================
// REALTIME
// ============================================================

export function subscribeToTable(
  table,
  callback,
  filter = null
) {
  let channel =
    supabase
      .channel(
        `realtime-${table}-${Date.now()}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter || {}),
        },
        (payload) => {
          if (
            typeof callback ===
            "function"
          ) {
            callback(payload);
          }
        }
      )
      .subscribe();

  return () => {
    if (channel) {
      supabase.removeChannel(
        channel
      );
    }
  };
}

// ============================================================
// AUTH STATE
// ============================================================

export function subscribeToAuth(
  callback
) {
  const {
    data,
  } =
    supabase.auth.onAuthStateChange(
      (
        event,
        session
      ) => {
        if (
          typeof callback ===
          "function"
        ) {
          callback(
            event,
            session
          );
        }
      }
    );

  return () => {
    data?.subscription?.unsubscribe();
  };
    }
