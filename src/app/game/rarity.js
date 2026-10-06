// ============================================================
// ХРОНІКИ ЗГАСЛОГО СВІТАНКУ
// Система рідкості
// ============================================================

export const RARITIES = {
  COMMON: "common",
  UNCOMMON: "uncommon",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
  MYTHIC: "mythic",
};

export const RARITY_ORDER = [
  RARITIES.COMMON,
  RARITIES.UNCOMMON,
  RARITIES.RARE,
  RARITIES.EPIC,
  RARITIES.LEGENDARY,
  RARITIES.MYTHIC,
];

// ------------------------------------------------------------
// Основні параметри
// ------------------------------------------------------------

export const RARITY_DATA = {
  [RARITIES.COMMON]: {
    id: RARITIES.COMMON,
    name: "Звичайний",
    shortName: "Звичайний",

    color: "#9ca3af",

    multiplier: 1,

    maxLevel: 20,

    stars: 1,

    dropWeight: 60,

    upgradeCostMultiplier: 1,

    description:
      "Базова рідкість. Підходить для початкового розвитку.",
  },

  [RARITIES.UNCOMMON]: {
    id: RARITIES.UNCOMMON,
    name: "Незвичайний",
    shortName: "Незвичайний",

    color: "#4ade80",

    multiplier: 1.1,

    maxLevel: 25,

    stars: 2,

    dropWeight: 25,

    upgradeCostMultiplier: 1.15,

    description:
      "Трохи сильніший за звичайні предмети та героїв.",
  },

  [RARITIES.RARE]: {
    id: RARITIES.RARE,
    name: "Рідкісний",
    shortName: "Рідкісний",

    color: "#60a5fa",

    multiplier: 1.25,

    maxLevel: 30,

    stars: 3,

    dropWeight: 10,

    upgradeCostMultiplier: 1.35,

    description:
      "Рідкісна сила, яка вже помітно впливає на характеристики.",
  },

  [RARITIES.EPIC]: {
    id: RARITIES.EPIC,
    name: "Епічний",
    shortName: "Епічний",

    color: "#c084fc",

    multiplier: 1.5,

    maxLevel: 40,

    stars: 4,

    dropWeight: 4,

    upgradeCostMultiplier: 1.7,

    description:
      "Могутня рідкість для сильних героїв та спорядження.",
  },

  [RARITIES.LEGENDARY]: {
    id: RARITIES.LEGENDARY,
    name: "Легендарний",
    shortName: "Легендарний",

    color: "#fbbf24",

    multiplier: 1.8,

    maxLevel: 50,

    stars: 5,

    dropWeight: 0.9,

    upgradeCostMultiplier: 2.2,

    description:
      "Надзвичайно рідкісна сила легенд Eldara.",
  },

  [RARITIES.MYTHIC]: {
    id: RARITIES.MYTHIC,
    name: "Міфічний",
    shortName: "Міфічний",

    color: "#f43f5e",

    multiplier: 2.2,

    maxLevel: 60,

    stars: 6,

    dropWeight: 0.1,

    upgradeCostMultiplier: 3,

    description:
      "Найвища відома рідкість. Сила, про яку ходять легенди.",
  },
};

// ------------------------------------------------------------
// Отримати інформацію про рідкість
// ------------------------------------------------------------

export function getRarity(
  rarity = RARITIES.COMMON
) {
  return (
    RARITY_DATA[rarity] ||
    RARITY_DATA[RARITIES.COMMON]
  );
}

// ------------------------------------------------------------
// Назва
// ------------------------------------------------------------

export function getRarityName(
  rarity
) {
  return getRarity(rarity).name;
}

// ------------------------------------------------------------
// Колір
// ------------------------------------------------------------

export function getRarityColor(
  rarity
) {
  return getRarity(rarity).color;
}

// ------------------------------------------------------------
// Множник
// ------------------------------------------------------------

export function getRarityMultiplier(
  rarity
) {
  return getRarity(rarity).multiplier;
}

// ------------------------------------------------------------
// Максимальний рівень
// ------------------------------------------------------------

export function getRarityMaxLevel(
  rarity
) {
  return getRarity(rarity).maxLevel;
}

// ------------------------------------------------------------
// Кількість зірок
// ------------------------------------------------------------

export function getRarityStars(
  rarity
) {
  return getRarity(rarity).stars;
}

// ------------------------------------------------------------
// Перевірка рідкості
// ------------------------------------------------------------

export function isValidRarity(
  rarity
) {
  return Boolean(
    RARITY_DATA[rarity]
  );
}

// ------------------------------------------------------------
// Порівняння рідкості
// ------------------------------------------------------------

export function compareRarity(
  first,
  second
) {
  const firstIndex =
    RARITY_ORDER.indexOf(first);

  const secondIndex =
    RARITY_ORDER.indexOf(second);

  return (
    firstIndex -
    secondIndex
  );
}

export function isRarityHigher(
  first,
  second
) {
  return (
    compareRarity(
      first,
      second
    ) > 0
  );
}

export function isRarityLower(
  first,
  second
) {
  return (
    compareRarity(
      first,
      second
    ) < 0
  );
}

// ------------------------------------------------------------
// Наступна рідкість
// ------------------------------------------------------------

export function getNextRarity(
  rarity
) {
  const index =
    RARITY_ORDER.indexOf(rarity);

  if (
    index < 0 ||
    index >=
      RARITY_ORDER.length - 1
  ) {
    return null;
  }

  return RARITY_ORDER[
    index + 1
  ];
}

// ------------------------------------------------------------
// Попередня рідкість
// ------------------------------------------------------------

export function getPreviousRarity(
  rarity
) {
  const index =
    RARITY_ORDER.indexOf(rarity);

  if (index <= 0) {
    return null;
  }

  return RARITY_ORDER[
    index - 1
  ];
}

// ------------------------------------------------------------
// Множники характеристик
// ------------------------------------------------------------

export function scaleStat(
  baseValue,
  rarity,
  level = 1
) {
  const base =
    Number(baseValue) || 0;

  const currentLevel =
    Math.max(
      1,
      Number(level) || 1
    );

  const rarityMultiplier =
    getRarityMultiplier(
      rarity
    );

  const levelMultiplier =
    1 +
    (currentLevel - 1) *
      0.08;

  return Math.round(
    base *
      rarityMultiplier *
      levelMultiplier
  );
}

// ------------------------------------------------------------
// Масштабування героя
// ------------------------------------------------------------

export function scaleHeroStats(
  hero = {}
) {
  const rarity =
    hero.rarity ||
    RARITIES.COMMON;

  const level =
    Math.max(
      1,
      Number(hero.level) || 1
    );

  return {
    ...hero,

    attack: scaleStat(
      hero.baseAttack ??
        hero.attack ??
        0,
      rarity,
      level
    ),

    defense: scaleStat(
      hero.baseDefense ??
        hero.defense ??
        0,
      rarity,
      level
    ),

    hp: scaleStat(
      hero.baseHp ??
        hero.hp ??
        hero.maxHp ??
        0,
      rarity,
      level
    ),

    speed: Math.round(
      (Number(
        hero.baseSpeed ??
          hero.speed ??
          0
      ) || 0) *
        (1 +
          (level - 1) *
            0.025)
    ),

    crit: Math.min(
      100,
      (Number(
        hero.baseCrit ??
          hero.crit ??
          0
      ) || 0) +
        (level - 1) *
          0.15
    ),
  };
}

// ------------------------------------------------------------
// Масштабування предмета
// ------------------------------------------------------------

export function scaleItemStats(
  item = {}
) {
  const rarity =
    item.rarity ||
    RARITIES.COMMON;

  const level =
    Math.max(
      1,
      Number(item.level) || 1
    );

  const result = {
    ...item,
  };

  if (
    item.attack !== undefined ||
    item.baseAttack !== undefined
  ) {
    result.attack =
      scaleStat(
        item.baseAttack ??
          item.attack ??
          0,
        rarity,
        level
      );
  }

  if (
    item.defense !== undefined ||
    item.baseDefense !== undefined
  ) {
    result.defense =
      scaleStat(
        item.baseDefense ??
          item.defense ??
          0,
        rarity,
        level
      );
  }

  if (
    item.hp !== undefined ||
    item.baseHp !== undefined
  ) {
    result.hp =
      scaleStat(
        item.baseHp ??
          item.hp ??
          0,
        rarity,
        level
      );
  }

  if (
    item.crit !== undefined ||
    item.baseCrit !== undefined
  ) {
    result.crit = Math.min(
      100,
      (Number(
        item.baseCrit ??
          item.crit ??
          0
      ) || 0) *
        getRarityMultiplier(
          rarity
        )
    );
  }

  return result;
}

// ------------------------------------------------------------
// Вартість прокачування
// ------------------------------------------------------------

export function getUpgradeCost(
  rarity,
  level = 1,
  baseCost = 100
) {
  const rarityData =
    getRarity(rarity);

  const currentLevel =
    Math.max(
      1,
      Number(level) || 1
    );

  const cost =
    Number(baseCost) || 100;

  return Math.round(
    cost *
      rarityData.upgradeCostMultiplier *
      Math.pow(
        1.12,
        currentLevel - 1
      )
  );
}

// ------------------------------------------------------------
// Перевірка можливості прокачування
// ------------------------------------------------------------

export function canUpgrade(
  item
) {
  if (!item) {
    return false;
  }

  const maxLevel =
    getRarityMaxLevel(
      item.rarity
    );

  return (
    Number(item.level) <
    maxLevel
  );
}

// ------------------------------------------------------------
// Наступний рівень
// ------------------------------------------------------------

export function getNextLevel(
  item
) {
  if (!item) {
    return 1;
  }

  const maxLevel =
    getRarityMaxLevel(
      item.rarity
    );

  return Math.min(
    maxLevel,
    (Number(item.level) || 1) +
      1
  );
}

// ------------------------------------------------------------
// Шанс випадіння
// ------------------------------------------------------------

export function getTotalDropWeight() {
  return RARITY_ORDER.reduce(
    (total, rarity) =>
      total +
      getRarity(rarity)
        .dropWeight,
    0
  );
}

export function rollRarity() {
  const total =
    getTotalDropWeight();

  let roll =
    Math.random() * total;

  for (
    const rarity of RARITY_ORDER
  ) {
    const weight =
      getRarity(rarity)
        .dropWeight;

    roll -= weight;

    if (roll <= 0) {
      return rarity;
    }
  }

  return RARITIES.COMMON;
}

// ------------------------------------------------------------
// Випадкова рідкість із гарантованим мінімумом
// ------------------------------------------------------------

export function rollRarityAtLeast(
  minimumRarity = RARITIES.COMMON
) {
  const minimumIndex =
    RARITY_ORDER.indexOf(
      minimumRarity
    );

  if (minimumIndex < 0) {
    return rollRarity();
  }

  const allowed =
    RARITY_ORDER.slice(
      minimumIndex
    );

  const total =
    allowed.reduce(
      (sum, rarity) =>
        sum +
        getRarity(rarity)
          .dropWeight,
      0
    );

  let roll =
    Math.random() * total;

  for (
    const rarity of allowed
  ) {
    roll -=
      getRarity(rarity)
        .dropWeight;

    if (roll <= 0) {
      return rarity;
    }
  }

  return allowed[
    allowed.length - 1
  ];
}

// ------------------------------------------------------------
// Відображення зірок
// ------------------------------------------------------------

export function getRarityStarsText(
  rarity
) {
  const stars =
    getRarityStars(rarity);

  return "★".repeat(stars);
}

// ------------------------------------------------------------
// CSS-клас
// ------------------------------------------------------------

export function getRarityClass(
  rarity
) {
  return `rarity-${rarity}`;
}

// ------------------------------------------------------------
// Повна інформація для UI
// ------------------------------------------------------------

export function getRarityDisplay(
  rarity
) {
  const data =
    getRarity(rarity);

  return {
    id: data.id,
    name: data.name,
    shortName: data.shortName,
    color: data.color,
    multiplier: data.multiplier,
    maxLevel: data.maxLevel,
    stars: data.stars,
    starsText:
      getRarityStarsText(
        rarity
      ),
    className:
      getRarityClass(
        rarity
      ),
    description:
      data.description,
  };
}

// ------------------------------------------------------------
// Список для селекторів
// ------------------------------------------------------------

export function getAllRarities() {
  return RARITY_ORDER.map(
    (rarity) =>
      getRarityDisplay(rarity)
  );
}

// ------------------------------------------------------------
// Об'єднання базових характеристик
// ------------------------------------------------------------

export function applyRarity(
  entity = {}
) {
  const rarity =
    entity.rarity ||
    RARITIES.COMMON;

  const data =
    getRarity(rarity);

  return {
    ...entity,

    rarity,

    rarityName:
      data.name,

    rarityColor:
      data.color,

    rarityMultiplier:
      data.multiplier,

    maxLevel:
      data.maxLevel,
  };
}
