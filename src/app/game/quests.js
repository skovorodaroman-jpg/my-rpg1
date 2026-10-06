// ============================================================
// ХРОНІКИ ЗГАСЛОГО СВІТАНКУ
// Система квестів
// ============================================================

export const QUEST_TYPES = {
  BATTLE: "battle",
  VICTORY: "victory",
  DEFEAT: "defeat",
  STAGE: "stage",
  CHAPTER: "chapter",
  ARENA: "arena",
  MINE: "mine",
  SHOP: "shop",
  FORGE: "forge",
  LABORATORY: "laboratory",
  HERO: "hero",
  PET: "pet",
  CLAN: "clan",
  LOGIN: "login",
  RESOURCE: "resource",
};

export const QUEST_STATUS = {
  LOCKED: "locked",
  ACTIVE: "active",
  COMPLETED: "completed",
  CLAIMED: "claimed",
};

// ------------------------------------------------------------
// Створення квесту
// ------------------------------------------------------------

export function createQuest(data = {}) {
  return {
    id:
      data.id ||
      `quest_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    title:
      data.title ||
      "Новий квест",

    description:
      data.description ||
      "",

    type:
      data.type ||
      QUEST_TYPES.BATTLE,

    target:
      Math.max(
        1,
        Number(data.target) || 1
      ),

    progress:
      Math.max(
        0,
        Number(data.progress) || 0
      ),

    status:
      data.status ||
      QUEST_STATUS.ACTIVE,

    requiredLevel:
      Math.max(
        1,
        Number(data.requiredLevel) || 1
      ),

    chapter:
      data.chapter
        ? Number(data.chapter)
        : null,

    rewards:
      data.rewards || {
        gold: 0,
        crystals: 0,
        xp: 0,
      },

    hidden:
      Boolean(data.hidden),

    repeatable:
      Boolean(data.repeatable),

    daily:
      Boolean(data.daily),

    weekly:
      Boolean(data.weekly),

    claimed:
      Boolean(data.claimed),

    createdAt:
      data.createdAt ||
      new Date().toISOString(),

    updatedAt:
      data.updatedAt ||
      new Date().toISOString(),
  };
}

// ------------------------------------------------------------
// Стандартні квести
// ------------------------------------------------------------

export const DEFAULT_QUESTS = [
  createQuest({
    id: "first_battle",
    title: "Перший крок",
    description:
      "Проведи свій перший бій.",
    type: QUEST_TYPES.BATTLE,
    target: 1,
    rewards: {
      gold: 100,
      crystals: 5,
      xp: 50,
    },
  }),

  createQuest({
    id: "five_victories",
    title: "Перші перемоги",
    description:
      "Переможи 5 ворогів.",
    type: QUEST_TYPES.VICTORY,
    target: 5,
    rewards: {
      gold: 250,
      crystals: 10,
      xp: 100,
    },
  }),

  createQuest({
    id: "ten_battles",
    title: "Боєць Eldara",
    description:
      "Проведи 10 боїв.",
    type: QUEST_TYPES.BATTLE,
    target: 10,
    rewards: {
      gold: 500,
      crystals: 15,
      xp: 200,
    },
  }),

  createQuest({
    id: "mine_resources",
    title: "Багатства землі",
    description:
      "Добудь 100 ресурсів у шахті.",
    type: QUEST_TYPES.MINE,
    target: 100,
    rewards: {
      gold: 400,
      crystals: 10,
      xp: 150,
    },
  }),

  createQuest({
    id: "arena_three",
    title: "Арена кличе",
    description:
      "Проведи 3 бої на арені.",
    type: QUEST_TYPES.ARENA,
    target: 3,
    rewards: {
      gold: 350,
      crystals: 15,
      xp: 150,
    },
  }),

  createQuest({
    id: "upgrade_hero",
    title: "Сила героя",
    description:
      "Покращ героя один раз.",
    type: QUEST_TYPES.HERO,
    target: 1,
    rewards: {
      gold: 300,
      crystals: 5,
      xp: 100,
    },
  }),

  createQuest({
    id: "forge_item",
    title: "Майстер кузні",
    description:
      "Покращ спорядження.",
    type: QUEST_TYPES.FORGE,
    target: 1,
    rewards: {
      gold: 300,
      crystals: 5,
      xp: 100,
    },
  }),

  createQuest({
    id: "pet_upgrade",
    title: "Вірний супутник",
    description:
      "Покращ будь-якого пета.",
    type: QUEST_TYPES.PET,
    target: 1,
    rewards: {
      gold: 300,
      crystals: 5,
      xp: 100,
    },
  }),

  createQuest({
    id: "chapter_one",
    title: "Пробудження Світанку",
    description:
      "Заверши перший розділ пригод.",
    type: QUEST_TYPES.CHAPTER,
    target: 1,
    chapter: 1,
    requiredLevel: 1,
    rewards: {
      gold: 1000,
      crystals: 30,
      xp: 500,
    },
  }),

  createQuest({
    id: "level_five",
    title: "Новий рівень",
    description:
      "Досягни 5 рівня.",
    type: QUEST_TYPES.RESOURCE,
    target: 5,
    requiredLevel: 5,
    rewards: {
      gold: 750,
      crystals: 20,
      xp: 250,
    },
  }),
];

// ------------------------------------------------------------
// Перевірка відкриття квесту
// ------------------------------------------------------------

export function canUnlockQuest(
  quest,
  player = {}
) {
  if (!quest) {
    return false;
  }

  const playerLevel =
    Number(player.level) || 1;

  if (
    playerLevel <
    Number(quest.requiredLevel || 1)
  ) {
    return false;
  }

  if (
    quest.chapter &&
    Number(player.chapter || 1) <
      Number(quest.chapter)
  ) {
    return false;
  }

  return true;
}

// ------------------------------------------------------------
// Отримання статусу
// ------------------------------------------------------------

export function getQuestStatus(
  quest,
  player = {}
) {
  if (!quest) {
    return QUEST_STATUS.LOCKED;
  }

  if (quest.claimed) {
    return QUEST_STATUS.CLAIMED;
  }

  if (
    Number(quest.progress) >=
    Number(quest.target)
  ) {
    return QUEST_STATUS.COMPLETED;
  }

  if (
    !canUnlockQuest(
      quest,
      player
    )
  ) {
    return QUEST_STATUS.LOCKED;
  }

  return QUEST_STATUS.ACTIVE;
}

// ------------------------------------------------------------
// Прогрес у відсотках
// ------------------------------------------------------------

export function getQuestProgress(
  quest
) {
  if (!quest) {
    return 0;
  }

  const target =
    Math.max(
      1,
      Number(quest.target) || 1
    );

  const progress =
    Math.max(
      0,
      Number(quest.progress) || 0
    );

  return Math.min(
    100,
    Math.round(
      (progress / target) *
        100
    )
  );
}

// ------------------------------------------------------------
// Оновлення одного квесту
// ------------------------------------------------------------

export function updateQuestProgress(
  quest,
  amount = 1
) {
  if (!quest) {
    return null;
  }

  if (
    quest.claimed
  ) {
    return quest;
  }

  const target =
    Math.max(
      1,
      Number(quest.target) || 1
    );

  const current =
    Math.max(
      0,
      Number(quest.progress) || 0
    );

  const newProgress =
    Math.min(
      target,
      current +
        Math.max(
          0,
          Number(amount) || 0
        )
    );

  return {
    ...quest,

    progress:
      newProgress,

    status:
      newProgress >= target
        ? QUEST_STATUS.COMPLETED
        : QUEST_STATUS.ACTIVE,

    updatedAt:
      new Date().toISOString(),
  };
}

// ------------------------------------------------------------
// Оновлення квестів певного типу
// ------------------------------------------------------------

export function updateQuestsByType(
  quests = [],
  type,
  amount = 1
) {
  return quests.map(
    (quest) => {
      if (
        quest.type !== type
      ) {
        return quest;
      }

      return updateQuestProgress(
        quest,
        amount
      );
    }
  );
}

// ------------------------------------------------------------
// Подія гри
// ------------------------------------------------------------

export function processQuestEvent(
  quests = [],
  event = {}
) {
  if (!event?.type) {
    return quests;
  }

  const amount =
    Math.max(
      1,
      Number(event.amount) || 1
    );

  return quests.map(
    (quest) => {
      if (
        quest.claimed ||
        quest.type !== event.type
      ) {
        return quest;
      }

      return updateQuestProgress(
        quest,
        amount
      );
    }
  );
}

// ------------------------------------------------------------
// Спеціальна обробка перемоги
// ------------------------------------------------------------

export function processVictory(
  quests = [],
  data = {}
) {
  let result =
    processQuestEvent(
      quests,
      {
        type: QUEST_TYPES.BATTLE,
        amount: 1,
      }
    );

  result =
    processQuestEvent(
      result,
      {
        type: QUEST_TYPES.VICTORY,
        amount: 1,
      }
    );

  if (
    data.arena
  ) {
    result =
      processQuestEvent(
        result,
        {
          type: QUEST_TYPES.ARENA,
          amount: 1,
        }
      );
  }

  return result;
}

// ------------------------------------------------------------
// Обробка шахти
// ------------------------------------------------------------

export function processMining(
  quests = [],
  amount = 1
) {
  return processQuestEvent(
    quests,
    {
      type: QUEST_TYPES.MINE,
      amount,
    }
  );
}

// ------------------------------------------------------------
// Обробка покращення героя
// ------------------------------------------------------------

export function processHeroUpgrade(
  quests = []
) {
  return processQuestEvent(
    quests,
    {
      type: QUEST_TYPES.HERO,
      amount: 1,
    }
  );
}

// ------------------------------------------------------------
// Обробка покращення спорядження
// ------------------------------------------------------------

export function processForgeUpgrade(
  quests = []
) {
  return processQuestEvent(
    quests,
    {
      type: QUEST_TYPES.FORGE,
      amount: 1,
    }
  );
}

// ------------------------------------------------------------
// Обробка покращення пета
// ------------------------------------------------------------

export function processPetUpgrade(
  quests = []
) {
  return processQuestEvent(
    quests,
    {
      type: QUEST_TYPES.PET,
      amount: 1,
    }
  );
}

// ------------------------------------------------------------
// Завершення розділу
// ------------------------------------------------------------

export function processChapterComplete(
  quests = [],
  chapter = 1
) {
  return quests.map(
    (quest) => {
      if (
        quest.type !==
          QUEST_TYPES.CHAPTER ||
        Number(quest.chapter) !==
          Number(chapter)
      ) {
        return quest;
      }

      return updateQuestProgress(
        quest,
        1
      );
    }
  );
}

// ------------------------------------------------------------
// Отримати квести
// ------------------------------------------------------------

export function getActiveQuests(
  quests = [],
  player = {}
) {
  return quests.filter(
    (quest) =>
      getQuestStatus(
        quest,
        player
      ) ===
      QUEST_STATUS.ACTIVE
  );
}

export function getCompletedQuests(
  quests = [],
  player = {}
) {
  return quests.filter(
    (quest) =>
      getQuestStatus(
        quest,
        player
      ) ===
      QUEST_STATUS.COMPLETED
  );
}

export function getLockedQuests(
  quests = [],
  player = {}
) {
  return quests.filter(
    (quest) =>
      getQuestStatus(
        quest,
        player
      ) ===
      QUEST_STATUS.LOCKED
  );
}

export function getClaimedQuests(
  quests = []
) {
  return quests.filter(
    (quest) =>
      quest.claimed
  );
}

// ------------------------------------------------------------
// Отримати квест за ID
// ------------------------------------------------------------

export function getQuestById(
  quests = [],
  questId
) {
  return (
    quests.find(
      (quest) =>
        quest.id === questId
    ) || null
  );
}

// ------------------------------------------------------------
// Отримати нагороду
// ------------------------------------------------------------

export function getQuestReward(
  quest
) {
  if (!quest) {
    return {
      gold: 0,
      crystals: 0,
      xp: 0,
      items: [],
    };
  }

  return {
    gold:
      Math.max(
        0,
        Number(
          quest.rewards?.gold
        ) || 0
      ),

    crystals:
      Math.max(
        0,
        Number(
          quest.rewards?.crystals
        ) || 0
      ),

    xp:
      Math.max(
        0,
        Number(
          quest.rewards?.xp
        ) || 0
      ),

    items:
      Array.isArray(
        quest.rewards?.items
      )
        ? quest.rewards.items
        : [],
  };
}

// ------------------------------------------------------------
// Забрати нагороду
// ------------------------------------------------------------

export function claimQuest(
  quests = [],
  questId
) {
  const quest =
    getQuestById(
      quests,
      questId
    );

  if (!quest) {
    return {
      success: false,
      quests,
      reward: null,
      reason: "quest_not_found",
    };
  }

  if (quest.claimed) {
    return {
      success: false,
      quests,
      reward: null,
      reason: "already_claimed",
    };
  }

  if (
    Number(quest.progress) <
    Number(quest.target)
  ) {
    return {
      success: false,
      quests,
      reward: null,
      reason: "not_completed",
    };
  }

  const reward =
    getQuestReward(quest);

  const updatedQuests =
    quests.map(
      (item) => {
        if (
          item.id !== questId
        ) {
          return item;
        }

        return {
          ...item,

          claimed: true,

          status:
            QUEST_STATUS.CLAIMED,

          updatedAt:
            new Date().toISOString(),
        };
      }
    );

  return {
    success: true,

    quests:
      updatedQuests,

    reward,
  };
}

// ------------------------------------------------------------
// Створення квестів із шаблонів
// ------------------------------------------------------------

export function initializeQuests(
  savedQuests = []
) {
  if (
    Array.isArray(
      savedQuests
    ) &&
    savedQuests.length
  ) {
    return savedQuests.map(
      (quest) =>
        createQuest(quest)
    );
  }

  return DEFAULT_QUESTS.map(
    (quest) =>
      createQuest(quest)
  );
}

// ------------------------------------------------------------
// Денний скид
// ------------------------------------------------------------

export function resetDailyQuests(
  quests = []
) {
  return quests.map(
    (quest) => {
      if (!quest.daily) {
        return quest;
      }

      return {
        ...quest,

        progress: 0,

        claimed: false,

        status:
          QUEST_STATUS.ACTIVE,

        updatedAt:
          new Date().toISOString(),
      };
    }
  );
}

// ------------------------------------------------------------
// Тижневий скид
// ------------------------------------------------------------

export function resetWeeklyQuests(
  quests = []
) {
  return quests.map(
    (quest) => {
      if (!quest.weekly) {
        return quest;
      }

      return {
        ...quest,

        progress: 0,

        claimed: false,

        status:
          QUEST_STATUS.ACTIVE,

        updatedAt:
          new Date().toISOString(),
      };
    }
  );
}

// ------------------------------------------------------------
// Загальна статистика квестів
// ------------------------------------------------------------

export function getQuestMetrics(
  quests = [],
  player = {}
) {
  const total =
    quests.length;

  const active =
    getActiveQuests(
      quests,
      player
    ).length;

  const completed =
    getCompletedQuests(
      quests,
      player
    ).length;

  const claimed =
    getClaimedQuests(
      quests
    ).length;

  const locked =
    getLockedQuests(
      quests,
      player
    ).length;

  const totalProgress =
    quests.reduce(
      (sum, quest) =>
        sum +
        getQuestProgress(
          quest
        ),
      0
    );

  return {
    total,
    active,
    completed,
    claimed,
    locked,

    completionRate:
      total
        ? Math.round(
            (claimed / total) *
              100
          )
        : 0,

    averageProgress:
      total
        ? Math.round(
            totalProgress /
              total
          )
        : 0,
  };
}

// ------------------------------------------------------------
// Перевірка всіх умов після зміни прогресу
// ------------------------------------------------------------

export function refreshQuestStatuses(
  quests = [],
  player = {}
) {
  return quests.map(
    (quest) => {
      if (quest.claimed) {
        return {
          ...quest,
          status:
            QUEST_STATUS.CLAIMED,
        };
      }

      const status =
        getQuestStatus(
          quest,
          player
        );

      return {
        ...quest,
        status,
      };
    }
  );
}
