
/* =========================================================
   РАРИТЕТНІСТЬ СПОРЯДЖЕННЯ
   ========================================================= */

export const EQUIPMENT_RARITIES = {
  common: {
    id: "common",
    label: "Обычные вещи",
    color: "#b0b0b0",
    borderColor: "#555555",
    bgGradient: "radial-gradient(circle, #2a2a2a 0%, #111111 100%)",
    glow: "0 0 5px rgba(255, 255, 255, 0.2)",
  },
  common_plus: {
    id: "common_plus",
    label: "Обычные+ вещи",
    color: "#4caf50",
    borderColor: "#2e7d32",
    bgGradient: "radial-gradient(circle, #1b381e 0%, #0a170b 100%)",
    glow: "0 0 7px rgba(76, 175, 80, 0.4)",
  },
  rare: {
    id: "rare",
    label: "Редкие вещи",
    color: "#2196f3",
    borderColor: "#1565c0",
    bgGradient: "radial-gradient(circle, #162c46 0%, #09131f 100%)",
    glow: "0 0 8px rgba(33, 150, 243, 0.5)",
  },
  rare_plus: {
    id: "rare_plus",
    label: "Редкие+ вещи",
    color: "#00bcd4",
    borderColor: "#00838f",
    bgGradient: "radial-gradient(circle, #10383c 0%, #06181a 100%)",
    glow: "0 0 9px rgba(0, 188, 212, 0.6)",
  },
  epic: {
    id: "epic",
    label: "Эпические вещи",
    color: "#9c27b0",
    borderColor: "#6a1b9a",
    bgGradient: "radial-gradient(circle, #391540 0%, #18081c 100%)",
    glow: "0 0 10px rgba(156, 39, 176, 0.6)",
  },
  epic_plus: {
    id: "epic_plus",
    label: "Эпические+ вещи",
    color: "#e91e63",
    borderColor: "#ad1457",
    bgGradient: "radial-gradient(circle, #421124 0%, #1c060f 100%)",
    glow: "0 0 12px rgba(233, 30, 99, 0.7)",
  },
  legendary: {
    id: "legendary",
    label: "Легендарные вещи",
    color: "#ff9800",
    borderColor: "#ef6c00",
    bgGradient: "radial-gradient(circle, #4a2a0a 0%, #1f1003 100%)",
    glow: "0 0 14px rgba(255, 152, 0, 0.8)",
  },
  titanic: {
    id: "titanic",
    label: "Титанические вещи",
    color: "#f44336",
    borderColor: "#c62828",
    bgGradient: "radial-gradient(circle, #520a0a 0%, #210303 100%)",
    glow: "0 0 18px rgba(244, 67, 54, 0.9)",
  },
};

/* =========================================================
   БАЗА СПОРЯДЖЕННЯ
   ========================================================= */

const LOCAL_EQUIPMENT_IMAGE = "/equipment/206254753.jpeg";

export const EQUIPMENT_DATABASE = [
  // --- ПОВНИЙ ЗВИЧАЙНИЙ КОМПЛЕКТ ВОЇНА ---
  {
    id: "common_warrior_set",
    name: "Обычный комплект воина",
    slot: "set",
    rarity: "common",
    priceGold: 500,
    stats: {
      attack: 15,
      defense: 10,
      hp: 40,
    },
    icon: "🛡️",
    image: LOCAL_EQUIPMENT_IMAGE,
    description:
      "Простой комплект доспехов начинающего воина.",
    isFullSet: true,
  },

  // --- ЗВИЧАЙНІ ПРЕДМЕТИ ---
  {
    id: "wooden_sword",
    name: "Деревянный меч",
    slot: "weapon",
    rarity: "common",
    priceGold: 100,
    stats: { attack: 5 },
    icon: "🗡️",
    image:
      "https://game-icons.net/icons/000000/transparent/1x1/lorc/wooden-sword.svg",
  },
  {
    id: "cloth_shirt",
    name: "Тканевая рубаха",
    slot: "chest",
    rarity: "common",
    priceGold: 80,
    stats: { defense: 4, hp: 10 },
    icon: "👕",
    image:
      "https://game-icons.net/icons/000000/transparent/1x1/lorc/cloth-jar.svg",
  },

  // --- РІДКІСНІ ПРЕДМЕТИ ---
  {
    id: "iron_broadsword",
    name: "Железный палаш",
    slot: "weapon",
    rarity: "rare",
    priceGold: 1500,
    stats: { attack: 25, crit: 2 },
    icon: "⚔️",
    image:
      "https://game-icons.net/icons/000000/transparent/1x1/lorc/broadsword.svg",
  },
  {
    id: "steel_breastplate",
    name: "Стальная кираса",
    slot: "chest",
    rarity: "rare",
    priceGold: 1200,
    stats: { defense: 20, hp: 60 },
    icon: "🛡️",
    image:
      "https://game-icons.net/icons/000000/transparent/1x1/lorc/breastplate.svg",
  },

  // --- ЕПІЧНІ ПРЕДМЕТИ ---
  {
    id: "shadow_blade",
    name: "Клинок теней",
    slot: "weapon",
    rarity: "epic",
    priceGold: 10000,
    priceCrystals: 50,
    stats: { attack: 80, crit: 8 },
    icon: "🗡️",
    image:
      "https://game-icons.net/icons/000000/transparent/1x1/lorc/dungeon-gate.svg",
  },
  {
    id: "knight_helm",
    name: "Шлем рыцаря",
    slot: "helm",
    rarity: "epic",
    priceGold: 8000,
    priceCrystals: 40,
    stats: { defense: 55, hp: 150 },
    icon: "🪖",
    image:
      "https://game-icons.net/icons/000000/transparent/1x1/lorc/knight-helmet.svg",
  },

  // --- ЛЕГЕНДАРНИЙ ПРЕДМЕТ ---
  {
    id: "dragon_slayer",
    name: "Губитель драконов",
    slot: "weapon",
    rarity: "legendary",
    priceGold: 50000,
    priceCrystals: 250,
    stats: { attack: 250, crit: 15 },
    icon: "⚔️",
    image:
      "https://game-icons.net/icons/000000/transparent/1x1/lorc/flaming-trident.svg",
  },

  // --- ТИТАНІЧНИЙ ПРЕДМЕТ ---
  {
    id: "titanic_god_sword",
    name: "Меч Древнего Титана",
    slot: "weapon",
    rarity: "titanic",
    priceGold: 250000,
    priceCrystals: 1000,
    stats: { attack: 750, crit: 30, hp: 500 },
    icon: "🔱",
    image:
      "https://game-icons.net/icons/000000/transparent/1x1/lorc/warlord-helmet.svg",
  },
];

/* =========================================================
   СУМІСНІСТЬ З ІНШИМИ МОДУЛЯМИ
   ========================================================= */

// Якщо інші файли проєкту використовують цю назву:
export const EQUIPMENT_ITEMS = EQUIPMENT_DATABASE;

// Допоміжні функції
export const getEquipmentById = (id) =>
  EQUIPMENT_DATABASE.find((item) => item.id === id) ?? null;

export const getEquipmentRarity = (rarity) =>
  EQUIPMENT_RARITIES[rarity] ?? EQUIPMENT_RARITIES.common;

export const getEquipmentByRarity = (rarity) =>
  EQUIPMENT_DATABASE.filter((item) => item.rarity === rarity);
     
