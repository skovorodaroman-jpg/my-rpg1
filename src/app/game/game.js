// ============================================================
// ХРОНІКИ ЗГАСЛОГО СВІТАНКУ
// Загальна ігрова логіка
// ============================================================

import { clamp } from "./battle";

// ------------------------------------------------------------
// Базові значення
// ------------------------------------------------------------

export const DEFAULT_PLAYER = {
  id: null,
  name: "Новий герой",
  avatar: "🧙",
  level: 1,
  xp: 0,
  xpToNextLevel: 100,

  gold: 500,
  crystals: 25,

  energy: 30,
  maxEnergy: 30,

  power: 0,

  arenaRating: 1000,
  arenaRank: null,

  chapter: 1,
  stage: 1,

  victories: 0,
  defeats: 0,

  createdAt: null,
};

export const DEFAULT_GAME_STATE = {
  player: DEFAULT_PLAYER,

  selectedHeroId: null,
  selectedPetId: null,

  team: [],

  completedStages: [],
  completedQuests: [],

  inventory: [],
  heroes: [],
  pets: [],

  lastEnergyUpdate: null,

  dailyRewardClaimed: false,

  loading: false,

  initialized: false,
};

// ------------------------------------------------------------
// Створення нового гравця
// ------------------------------------------------------------

export function createPlayer(data = {}) {
  return {
    ...DEFAULT_PLAYER,

    ...data,

    level: Math.max(
      1,
      Number(data.level) || 1
    ),

    xp: Math.max(
      0,
      Number(data.xp) || 0
    ),

    gold: Math.max(
      0,
      Number(data.gold) || 0
    ),

    crystals: Math.max(
      0,
      Number(data.crystals) || 0
    ),

    energy: clamp(
      Number(data.energy) || DEFAULT_PLAYER.maxEnergy,
      0,
      Number(data.maxEnergy) ||
        DEFAULT_PLAYER.maxEnergy
    ),

    maxEnergy:
      Math.max(
        1,
        Number(data.maxEnergy) ||
          DEFAULT_PLAYER.maxEnergy
      ),

    createdAt:
      data.createdAt ||
      new Date().toISOString(),
  };
}

// ------------------------------------------------------------
// Створення ігрового стану
// ------------------------------------------------------------

export function createGameState(data = {}) {
  const player =
    createPlayer(
      data.player || data
    );

  return {
    ...DEFAULT_GAME_STATE,

    ...data,

    player,

    initialized: true,

    lastEnergyUpdate:
      data.lastEnergyUpdate ||
      Date.now(),
  };
}

// ------------------------------------------------------------
// XP
// ------------------------------------------------------------

export function getRequiredXp(level = 1) {
  const currentLevel =
    Math.max(
      1,
      Number(level) || 1
    );

  return Math.round(
    100 *
      Math.pow(
        currentLevel,
        1.35
      )
  );
}

export function addXp(player, amount = 0) {
  if (!player) {
    return player;
  }

  let level =
    Math.max(
      1,
      Number(player.level) || 1
    );

  let xp =
    Math.max(
      0,
      Number(player.xp) || 0
    );

  let remainingXp =
    Math.max(
      0,
      Number(amount) || 0
    );

  let levelsGained = 0;

  while (remainingXp > 0) {
    const required =
      getRequiredXp(level);

    const needed =
      Math.max(
        0,
        required - xp
      );

    if (
      remainingXp < needed
    ) {
      xp += remainingXp;
      remainingXp = 0;
      break;
    }

    remainingXp -= needed;

    level += 1;
    levelsGained += 1;

    xp = 0;
  }

  return {
    ...player,

    level,

    xp,

    xpToNextLevel:
      getRequiredXp(level),

    levelsGained,
  };
}

// ------------------------------------------------------------
// Золото
// ------------------------------------------------------------

export function addGold(
  player,
  amount = 0
) {
  if (!player) {
    return player;
  }

  return {
    ...player,

    gold: Math.max(
      0,
      (Number(player.gold) || 0) +
        (Number(amount) || 0)
    ),
  };
}

export function canSpendGold(
  player,
  amount = 0
) {
  return (
    Number(player?.gold) >=
    Math.max(0, Number(amount) || 0)
  );
}

export function spendGold(
  player,
  amount = 0
) {
  const cost =
    Math.max(
      0,
      Number(amount) || 0
    );

  if (
    !player ||
    !canSpendGold(player, cost)
  ) {
    return {
      success: false,
      player,
    };
  }

  return {
    success: true,

    player: {
      ...player,

      gold:
        Number(player.gold) -
        cost,
    },
  };
}

// ------------------------------------------------------------
// Кристали
// ------------------------------------------------------------

export function addCrystals(
  player,
  amount = 0
) {
  if (!player) {
    return player;
  }

  return {
    ...player,

    crystals: Math.max(
      0,
      (Number(player.crystals) || 0) +
        (Number(amount) || 0)
    ),
  };
}

export function canSpendCrystals(
  player,
  amount = 0
) {
  return (
    Number(player?.crystals) >=
    Math.max(0, Number(amount) || 0)
  );
}

export function spendCrystals(
  player,
  amount = 0
) {
  const cost =
    Math.max(
      0,
      Number(amount) || 0
    );

  if (
    !player ||
    !canSpendCrystals(
      player,
      cost
    )
  ) {
    return {
      success: false,
      player,
    };
  }

  return {
    success: true,

    player: {
      ...player,

      crystals:
        Number(player.crystals) -
        cost,
    },
  };
}

// ------------------------------------------------------------
// Енергія
// ------------------------------------------------------------

export const ENERGY_REGEN_MINUTES = 5;

export function getEnergyRegen(
  lastUpdate,
  now = Date.now()
) {
  if (!lastUpdate) {
    return 0;
  }

  const elapsed =
    Math.max(
      0,
      now -
        Number(lastUpdate)
    );

  const minutes =
    elapsed / 60000;

  return Math.floor(
    minutes /
      ENERGY_REGEN_MINUTES
  );
}

export function restoreEnergy(
  player,
  lastUpdate,
  now = Date.now()
) {
  if (!player) {
    return {
      player,
      lastEnergyUpdate: now,
    };
  }

  const maxEnergy =
    Math.max(
      1,
      Number(player.maxEnergy) ||
        30
    );

  const currentEnergy =
    clamp(
      Number(player.energy) || 0,
      0,
      maxEnergy
    );

  const regenerated =
    getEnergyRegen(
      lastUpdate,
      now
    );

  if (regenerated <= 0) {
    return {
      player: {
        ...player,
        energy: currentEnergy,
        maxEnergy,
      },

      lastEnergyUpdate:
        lastUpdate || now,
    };
  }

  const newEnergy =
    Math.min(
      maxEnergy,
      currentEnergy +
        regenerated
    );

  const actuallyRestored =
    newEnergy -
    currentEnergy;

  const newTimestamp =
    actuallyRestored > 0
      ? now
      : lastUpdate;

  return {
    player: {
      ...player,

      energy: newEnergy,

      maxEnergy,
    },

    lastEnergyUpdate:
      newTimestamp,
  };
}

export function canSpendEnergy(
  player,
  amount = 1
) {
  return (
    Number(player?.energy) >=
    Math.max(
      0,
      Number(amount) || 0
    )
  );
}

export function spendEnergy(
  player,
  amount = 1
) {
  const cost =
    Math.max(
      0,
      Number(amount) || 0
    );

  if (
    !player ||
    !canSpendEnergy(
      player,
      cost
    )
  ) {
    return {
      success: false,
      player,
    };
  }

  return {
    success: true,

    player: {
      ...player,

      energy: Math.max(
        0,
        Number(player.energy) -
          cost
      ),
    },
  };
}

export function addEnergy(
  player,
  amount = 1
) {
  if (!player) {
    return player;
  }

  const maxEnergy =
    Math.max(
      1,
      Number(player.maxEnergy) ||
        30
    );

  return {
    ...player,

    energy: clamp(
      (Number(player.energy) || 0) +
        (Number(amount) || 0),
      0,
      maxEnergy
    ),

    maxEnergy,
  };
}

// ------------------------------------------------------------
// Сила гравця
// ------------------------------------------------------------

export function calculateHeroPower(
  hero
) {
  if (!hero) {
    return 0;
  }

  const attack =
    Number(hero.attack) || 0;

  const defense =
    Number(hero.defense) || 0;

  const hp =
    Number(hero.hp) ||
    Number(hero.maxHp) ||
    0;

  const speed =
    Number(hero.speed) || 0;

  const crit =
    Number(hero.crit) || 0;

  return Math.round(
    attack * 2 +
      defense * 1.5 +
      hp * 0.25 +
      speed * 2 +
      crit * 5
  );
}

export function calculateTeamPower(
  heroes = []
) {
  return heroes
    .filter(Boolean)
    .reduce(
      (total, hero) =>
        total +
        calculateHeroPower(hero),
      0
    );
}

// ------------------------------------------------------------
// Команда
// ------------------------------------------------------------

export function setTeam(
  state,
  heroIds = []
) {
  return {
    ...state,

    team: Array.isArray(heroIds)
      ? heroIds.slice(0, 3)
      : [],
  };
}

export function addHeroToTeam(
  state,
  heroId
) {
  if (
    !state ||
    !heroId
  ) {
    return state;
  }

  const currentTeam =
    state.team || [];

  if (
    currentTeam.includes(heroId)
  ) {
    return state;
  }

  if (
    currentTeam.length >= 3
  ) {
    return state;
  }

  return {
    ...state,

    team: [
      ...currentTeam,
      heroId,
    ],
  };
}

export function removeHeroFromTeam(
  state,
  heroId
) {
  if (!state) {
    return state;
  }

  return {
    ...state,

    team: (state.team || [])
      .filter(
        (id) => id !== heroId
      ),
  };
}

// ------------------------------------------------------------
// Прогрес пригод
// ------------------------------------------------------------

export function getStageKey(
  chapter,
  stage
) {
  return `${chapter}-${stage}`;
}

export function isStageCompleted(
  state,
  chapter,
  stage
) {
  const key =
    getStageKey(
      chapter,
      stage
    );

  return (
    state?.completedStages ||
    []
  ).includes(key);
}

export function completeStage(
  state,
  chapter,
  stage
) {
  if (!state) {
    return state;
  }

  const key =
    getStageKey(
      chapter,
      stage
    );

  const completed =
    state.completedStages || [];

  if (completed.includes(key)) {
    return state;
  }

  return {
    ...state,

    completedStages: [
      ...completed,
      key,
    ],
  };
}

// ------------------------------------------------------------
// Нагороди
// ------------------------------------------------------------

export function applyRewards(
  state,
  rewards = {}
) {
  if (!state) {
    return state;
  }

  let player =
    state.player;

  if (
    Number(rewards.gold)
  ) {
    player =
      addGold(
        player,
        rewards.gold
      );
  }

  if (
    Number(rewards.crystals)
  ) {
    player =
      addCrystals(
        player,
        rewards.crystals
      );
  }

  if (
    Number(rewards.energy)
  ) {
    player =
      addEnergy(
        player,
        rewards.energy
      );
  }

  if (
    Number(rewards.xp)
  ) {
    player =
      addXp(
        player,
        rewards.xp
      );
  }

  return {
    ...state,

    player,
  };
}

// ------------------------------------------------------------
// Результат бою
// ------------------------------------------------------------

export function applyBattleResult(
  state,
  result = {}
) {
  if (!state || !result) {
    return state;
  }

  let nextState =
    state;

  if (result.victory) {
    nextState =
      applyRewards(
        nextState,
        result.rewards || {}
      );

    nextState = {
      ...nextState,

      player: {
        ...nextState.player,

        victories:
          (Number(
            nextState.player.victories
          ) || 0) + 1,
      },
    };
  }

  if (result.defeat) {
    nextState = {
      ...nextState,

      player: {
        ...nextState.player,

        defeats:
          (Number(
            nextState.player.defeats
          ) || 0) + 1,
      },
    };
  }

  return nextState;
}

// ------------------------------------------------------------
// Щоденна нагорода
// ------------------------------------------------------------

export const DAILY_REWARDS = [
  {
    day: 1,
    gold: 100,
    crystals: 0,
  },

  {
    day: 2,
    gold: 150,
    crystals: 5,
  },

  {
    day: 3,
    gold: 250,
    crystals: 10,
  },

  {
    day: 4,
    gold: 350,
    crystals: 15,
  },

  {
    day: 5,
    gold: 500,
    crystals: 20,
  },

  {
    day: 6,
    gold: 750,
    crystals: 30,
  },

  {
    day: 7,
    gold: 1000,
    crystals: 50,
  },
];

export function claimDailyReward(
  state,
  day = 1
) {
  if (
    !state ||
    state.dailyRewardClaimed
  ) {
    return {
      success: false,
      state,
      reward: null,
    };
  }

  const reward =
    DAILY_REWARDS.find(
      (item) =>
        item.day === day
    ) ||
    DAILY_REWARDS[0];

  const nextState =
    applyRewards(
      state,
      reward
    );

  return {
    success: true,

    state: {
      ...nextState,

      dailyRewardClaimed: true,
    },

    reward,
  };
}

// ------------------------------------------------------------
// Збереження локального стану
// ------------------------------------------------------------

export const GAME_STORAGE_KEY =
  "eldara_game_state";

export function saveGameLocally(
  state
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  try {
    localStorage.setItem(
      GAME_STORAGE_KEY,
      JSON.stringify(state)
    );

    return true;
  } catch (error) {
    console.error(
      "Не вдалося зберегти гру:",
      error
    );

    return false;
  }
}

export function loadGameLocally() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      localStorage.getItem(
        GAME_STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(
      "Не вдалося завантажити гру:",
      error
    );

    return null;
  }
}

export function clearLocalGame() {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  try {
    localStorage.removeItem(
      GAME_STORAGE_KEY
    );

    return true;
  } catch (error) {
    console.error(
      "Не вдалося очистити гру:",
      error
    );

    return false;
  }
}

// ------------------------------------------------------------
// Синхронізація енергії при запуску
// ------------------------------------------------------------

export function refreshGameState(
  state,
  now = Date.now()
) {
  if (!state) {
    return createGameState();
  }

  const restored =
    restoreEnergy(
      state.player,
      state.lastEnergyUpdate,
      now
    );

  return {
    ...state,

    player:
      restored.player,

    lastEnergyUpdate:
      restored.lastEnergyUpdate,
  };
}

// ------------------------------------------------------------
// Форматування ресурсів
// ------------------------------------------------------------

export function formatNumber(
  value = 0
) {
  return new Intl.NumberFormat(
    "uk-UA"
  ).format(
    Number(value) || 0
  );
}

export function formatXp(
  player
) {
  if (!player) {
    return "0 / 0";
  }

  return `${formatNumber(
    player.xp
  )} / ${formatNumber(
    getRequiredXp(player.level)
  )}`;
}

export function getXpProgress(
  player
) {
  if (!player) {
    return 0;
  }

  const required =
    getRequiredXp(
      player.level
    );

  return clamp(
    ((Number(player.xp) || 0) /
      required) *
      100,
    0,
    100
  );
}

// ------------------------------------------------------------
// Загальний snapshot для UI
// ------------------------------------------------------------

export function getPlayerSnapshot(
  state
) {
  if (!state?.player) {
    return null;
  }

  const player =
    state.player;

  return {
    id: player.id,

    name: player.name,

    avatar: player.avatar,

    level: player.level,

    xp: player.xp,

    xpToNextLevel:
      getRequiredXp(
        player.level
      ),

    xpProgress:
      getXpProgress(player),

    gold: player.gold,

    crystals:
      player.crystals,

    energy:
      player.energy,

    maxEnergy:
      player.maxEnergy,

    power:
      player.power,

    arenaRating:
      player.arenaRating,

    victories:
      player.victories,

    defeats:
      player.defeats,
  };
    }
