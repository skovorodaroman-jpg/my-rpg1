
export const EQUIPMENT_RARITIES = {
  common: {
    id: "common",
    label: "Обычные вещи",
    color: "#b0b0b0",
    borderColor: "#555555",
    bgGradient: "radial-gradient(circle, #2a2a2a 0%, #111111 100%)",
    glow: "0 0 5px rgba(255,255,255,0.2)",
  },
  common_plus: {
    id: "common_plus",
    label: "Обычные+ вещи",
    color: "#4caf50",
    borderColor: "#2e7d32",
    bgGradient: "radial-gradient(circle, #1b381e 0%, #0a170b 100%)",
    glow: "0 0 7px rgba(76,175,80,0.4)",
  },
  rare: {
    id: "rare",
    label: "Редкие вещи",
    color: "#2196f3",
    borderColor: "#1565c0",
    bgGradient: "radial-gradient(circle, #162c46 0%, #09131f 100%)",
    glow: "0 0 8px rgba(33,150,243,0.5)",
  },
  rare_plus: {
    id: "rare_plus",
    label: "Редкие+ вещи",
    color: "#00bcd4",
    borderColor: "#00838f",
    bgGradient: "radial-gradient(circle, #10383c 0%, #06181a 100%)",
    glow: "0 0 9px rgba(0,188,212,0.6)",
  },
  epic: {
    id: "epic",
    label: "Эпические вещи",
    color: "#9c27b0",
    borderColor: "#6a1b9a",
    bgGradient: "radial-gradient(circle, #391540 0%, #18081c 100%)",
    glow: "0 0 10px rgba(156,39,176,0.6)",
  },
  epic_plus: {
    id: "epic_plus",
    label: "Эпические+ вещи",
    color: "#e91e63",
    borderColor: "#ad1457",
    bgGradient: "radial-gradient(circle, #421124 0%, #1c060f 100%)",
    glow: "0 0 12px rgba(233,30,99,0.7)",
  },
  legendary: {
    id: "legendary",
    label: "Легендарные вещи",
    color: "#ff9800",
    borderColor: "#ef6c00",
    bgGradient: "radial-gradient(circle, #4a2a0a 0%, #1f1003 100%)",
    glow: "0 0 14px rgba(255,152,0,0.8)",
  },
  titanic: {
    id: "titanic",
    label: "Титанические вещи",
    color: "#f44336",
    borderColor: "#c62828",
    bgGradient: "radial-gradient(circle, #520a0a 0%, #210303 100%)",
    glow: "0 0 18px rgba(244,67,54,0.9)",
  },
};

// Зображення зберігай у public/equipment/
const EQUIPMENT_PATH = "/equipment/";

export const WARRIOR_SET_ITEMS = [
  {
    id: "warrior_helmet",
    name: "Шлем воина",
    slot: "helm",
    rarity: "common",
    priceGold: 10,
    stats: { defense: 2 },
    icon: "🪖",
    image: `${EQUIPMENT_PATH}шлемвоїна.jpeg`,
    description: "Простий шолом початківця.",
    setId: "warrior_set",
  },
  {
    id: "warrior_shoulders",
    name: "Наплечники воина",
    slot: "shoulders",
    rarity: "common",
    priceGold: 10,
    stats: { defense: 2 },
    icon: "🛡️",
    image: `${EQUIPMENT_PATH}наплечники воина.jpeg`,
    description: "Захищають плечі від ударів.",
    setId: "warrior_set",
  },
  {
    id: "warrior_armor",
    name: "Броня воина",
    slot: "chest",
    rarity: "common",
    priceGold: 10,
    stats: { defense: 4, hp: 10 },
    icon: "🥋",
    image: `${EQUIPMENT_PATH}броня війни.jpeg`,
    description: "Основна частина комплекту воїна.",
    setId: "warrior_set",
  },
  {
    id: "warrior_gloves",
    name: "Рукавицы воина",
    slot: "gloves",
    rarity: "common",
    priceGold: 10,
    stats: { attack: 1 },
    icon: "🥊",
    image: `${EQUIPMENT_PATH}рукавиці воина.jpeg`,
    description: "Допомагають міцніше тримати зброю.",
    setId: "warrior_set",
  },
  {
    id: "warrior_shield",
    name: "Щит воина",
    slot: "offhand",
    rarity: "common",
    priceGold: 10,
    stats: { defense: 3 },
    icon: "🛡️",
    image: `${EQUIPMENT_PATH}щит війни.jpeg`,
    description: "Надійний захист від ворожих атак.",
    setId: "warrior_set",
  },
  {
    id: "warrior_sword",
    name: "Меч воина",
    slot: "weapon",
    rarity: "common",
    priceGold: 10,
    stats: { attack: 5 },
    icon: "⚔️",
    image: `${EQUIPMENT_PATH}меч війни.jpeg`,
    description: "Зброя для перших битв.",
    setId: "warrior_set",
  },
  {
    id: "warrior_pants",
    name: "Штаны воина",
    slot: "legs",
    rarity: "common",
    priceGold: 10,
    stats: { defense: 2, hp: 5 },
    icon: "👖",
    image: `${EQUIPMENT_PATH}штани війни.jpeg`,
    description: "Захищають ноги в бою.",
    setId: "warrior_set",
  },
  {
    id: "warrior_boots",
    name: "Сапоги воина",
    slot: "boots",
    rarity: "common",
    priceGold: 10,
    stats: { defense: 1, speed: 1 },
    icon: "🥾",
    image: `${EQUIPMENT_PATH}чоботи війни.jpeg`,
    description: "Зручні чоботи для подорожей.",
    setId: "warrior_set",
  },
];

// Опис комплектів
export const EQUIPMENT_SETS = [
  {
    id: "warrior_set",
    name: "Комплект воина",
    rarity: "common",
    priceGold: 80,
    image: `${EQUIPMENT_PATH}206254753.jpeg`,
    description: "Повний комплект початківця: 8 предметів.",
    itemIds: WARRIOR_SET_ITEMS.map((item) => item.id),
  },
];

// Інші предмети магазину
export const OTHER_EQUIPMENT = [
  {
    id: "wooden_sword",
    name: "Деревянный меч",
    slot: "weapon",
    rarity: "common",
    priceGold: 100,
    stats: { attack: 5 },
    icon: "🗡️",
    image: "https://game-icons.net/icons/000000/transparent/1x1/lorc/wooden-sword.svg",
  },
  {
    id: "cloth_shirt",
    name: "Тканевая рубаха",
    slot: "chest",
    rarity: "common",
    priceGold: 80,
    stats: { defense: 4, hp: 10 },
    icon: "👕",
    image: "https://game-icons.net/icons/000000/transparent/1x1/lorc/cloth-jar.svg",
  },
  {
    id: "iron_broadsword",
    name: "Железный палаш",
    slot: "weapon",
    rarity: "rare",
    priceGold: 1500,
    stats: { attack: 25, crit: 2 },
    icon: "⚔️",
    image: "https://game-icons.net/icons/000000/transparent/1x1/lorc/broadsword.svg",
  },
  {
    id: "steel_breastplate",
    name: "Стальная кираса",
    slot: "chest",
    rarity: "rare",
    priceGold: 1200,
    stats: { defense: 20, hp: 60 },
    icon: "🛡️",
    image: "https://game-icons.net/icons/000000/transparent/1x1/lorc/breastplate.svg",
  },
  {
    id: "shadow_blade",
    name: "Клинок теней",
    slot: "weapon",
    rarity: "epic",
    priceGold: 10000,
    priceCrystals: 50,
    stats: { attack: 80, crit: 8 },
    icon: "🗡️",
    image: "https://game-icons.net/icons/000000/transparent/1x1/lorc/dungeon-gate.svg",
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
    image: "https://game-icons.net/icons/000000/transparent/1x1/lorc/knight-helmet.svg",
  },
  {
    id: "dragon_slayer",
    name: "Губитель драконов",
    slot: "weapon",
    rarity: "legendary",
    priceGold: 50000,
    priceCrystals: 250,
    stats: { attack: 250, crit: 15 },
    icon: "⚔️",
    image: "https://game-icons.net/icons/000000/transparent/1x1/lorc/flaming-trident.svg",
  },
  {
    id: "titanic_god_sword",
    name: "Меч Древнего Титана",
    slot: "weapon",
    rarity: "titanic",
    priceGold: 250000,
    priceCrystals: 1000,
    stats: { attack: 750, crit: 30, hp: 500 },
    icon: "🔱",
    image: "https://game-icons.net/icons/000000/transparent/1x1/lorc/warlord-helmet.svg",
  },
];

// Основний каталог магазину
export const EQUIPMENT_DATABASE = [
  ...WARRIOR_SET_ITEMS,
  ...OTHER_EQUIPMENT,
];

// Зворотна сумісність з попереднім кодом
export const EQUIPMENT_ITEMS = EQUIPMENT_DATABASE;

export const getEquipmentById = (id) =>
  EQUIPMENT_DATABASE.find((item) => item.id === id) ?? null;

export const getEquipmentRarity = (rarity) =>
  EQUIPMENT_RARITIES[rarity] ?? EQUIPMENT_RARITIES.common;

export const getEquipmentByRarity = (rarity) =>
  EQUIPMENT_DATABASE.filter((item) => item.rarity === rarity);

export const getEquipmentSetById = (id) =>
  EQUIPMENT_SETS.find((set) => set.id === id) ?? null;

export const getEquipmentSetItems = (setId) =>
  EQUIPMENT_DATABASE.filter((item) => item.setId === setId);

export const getEquipmentStats = (items = []) =>
  items.reduce(
    (total, item) => {
      const stats = item.stats ?? {};
      total.attack += Number(stats.attack ?? 0);
      total.defense += Number(stats.defense ?? 0);
      total.hp += Number(stats.hp ?? 0);
      total.speed += Number(stats.speed ?? 0);
      total.crit += Number(stats.crit ?? 0);
      return total;
    },
    { attack: 0, defense: 0, hp: 0, speed: 0, crit: 0 }
  );
       
