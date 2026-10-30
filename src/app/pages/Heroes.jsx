import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const EQUIPMENT_SLOTS = [
  { type: "helmet", label: "Шолом", icon: "👑" },
  { type: "weapon", label: "Права рука", icon: "⚔️" },
  { type: "shoulders", label: "Наплічники", icon: "🛡️" },
  { type: "armor", label: "Броня", icon: "🦺" },
  { type: "gloves", label: "Рукавиці", icon: "🧤" },
  { type: "shield", label: "Ліва рука", icon: "🛡️" },
  { type: "pants", label: "Штани", icon: "👖" },
  { type: "boots", label: "Чоботи", icon: "🥾" },
];

const EXTRA_SLOTS = [
  { type: "ring_1", label: "Перше кільце", icon: "💍" },
  { type: "ring_2", label: "Друге кільце", icon: "💍" },
];

const SLOT_STAT = {
  helmet: "strength",
  weapon: "strength",
  shield: "strength",
  shoulders: "health",
  armor: "armor",
  gloves: "luck",
  pants: "armor",
  boots: "health",
  ring_1: "health",
  ring_2: "armor",
};

const SLOT_ALIASES = {
  helmet: ["helmet", "шолом", "шлем"],
  weapon: ["weapon", "зброя", "меч", "клинок"],
  shoulders: ["shoulders", "наплічники", "наплечники"],
  armor: ["armor", "броня", "обладунок"],
  gloves: ["gloves", "рукавиці", "рукавицы", "перчатки"],
  shield: ["shield", "щит"],
  pants: ["pants", "штани", "штаны"],
  boots: ["boots", "чоботи", "сапоги"],
};

function getSlotType(row) {
  if (row?.equipped_slot) return row.equipped_slot;

  const item = row?.item || {};
  const type = String(item.item_type || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();

  for (const [slot, aliases] of Object.entries(SLOT_ALIASES)) {
    if (aliases.some((alias) => type === alias || name.includes(alias))) {
      return slot;
    }
  }

  return null;
}

function getRuneStat(type) {
  const mapping = {
    strength: "strength",
    attack: "strength",
    health: "health",
    hp: "health",
    armor: "armor",
    defense: "armor",
    luck: "luck",
    speed: "speed",
    crit: "crit",
    critical: "crit",
  };

  return mapping[String(type || "").toLowerCase()] || null;
}

function formatNumber(value) {
  return Math.floor(Number(value) || 0).toLocaleString("uk-UA");
}

function emptyStats() {
  return {
    strength: 0,
    health: 0,
    armor: 0,
    luck: 0,
    speed: 0,
    crit: 0,
  };
}

export default function Heroes({ profile, player, onNavigate }) {
  const hero = player || profile || {};
  const userId = hero.id;

  const [message, setMessage] = useState(null);
  const [equippedItems, setEquippedItems] = useState([]);
  const [slotBonuses, setSlotBonuses] = useState([]);
  const [runes, setRunes] = useState([]);
  const [sharpening, setSharpening] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [equipmentError, setEquipmentError] = useState("");

  const heroName = hero.display_name || hero.username || "Аріан";
  const level = Number(hero.level || 1);
  const experience = Number(hero.experience || 0);
  const gold = Number(hero.gold || 0);
  const crystals = Number(hero.crystals || 0);

  const loadEquipment = useCallback(async () => {
    if (!userId) {
      setEquippedItems([]);
      setSlotBonuses([]);
      setRunes([]);
      setSharpening([]);
      setLoadingEquipment(false);
      return;
    }

    setLoadingEquipment(true);
    setEquipmentError("");

    try {
      const [
        equipmentResult,
        bonusesResult,
        runesResult,
        sharpeningResult,
      ] = await Promise.all([
        supabase
          .from("player_items")
          .select(
            "id, item_id, is_equipped, equipped_slot, storage_location, item:items(*)"
          )
          .eq("user_id", userId)
          .eq("is_equipped", true),

        supabase
          .from("player_slot_bonuses")
          .select("slot_type, bonus_level")
          .eq("user_id", userId),

        supabase
          .from("player_runes")
          .select("slot_id, rune_type, bonus")
          .eq("user_id", userId),

        supabase
          .from("player_slot_sharpening")
          .select("slot_type, sharpen_level")
          .eq("user_id", userId),
      ]);

      if (equipmentResult.error) throw equipmentResult.error;
      if (bonusesResult.error) throw bonusesResult.error;
      if (runesResult.error) throw runesResult.error;
      if (sharpeningResult.error) throw sharpeningResult.error;

      setEquippedItems(
        (equipmentResult.data || []).filter((row) => row.item)
      );
      setSlotBonuses(bonusesResult.data || []);
      setRunes(runesResult.data || []);
      setSharpening(sharpeningResult.data || []);
    } catch (err) {
      console.error("Помилка завантаження характеристик героя:", err);
      setEquipmentError(
        "Не вдалося завантажити спорядження та характеристики."
      );
    } finally {
      setLoadingEquipment(false);
    }
  }, [userId]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const equipmentBySlot = useMemo(() => {
    const result = {};

    for (const row of equippedItems) {
      const slot = getSlotType(row);

      if (slot && !result[slot]) {
        result[slot] = row;
      }
    }

    return result;
  }, [equippedItems]);

  const bonuses = useMemo(() => {
    const total = emptyStats();

    // 1. Базові характеристики екіпірованих предметів
    for (const row of equippedItems) {
      const item = row.item || {};

      total.strength += Number(item.attack_bonus || 0);
      total.health += Number(item.hp_bonus || 0);
      total.armor += Number(item.defense_bonus || 0);
      total.luck += Number(item.luck_bonus || 0);
      total.speed += Number(item.speed_bonus || 0);
      total.crit += Number(item.crit_bonus || 0);
    }

    // 2. Бонуси слотів: кожен рівень додає 24
    for (const bonus of slotBonuses) {
      const stat = SLOT_STAT[bonus.slot_type];
      if (!stat) continue;

      total[stat] += Number(bonus.bonus_level || 0) * 24;
    }

    // 3. Руни
    for (const rune of runes) {
      const stat = getRuneStat(rune.rune_type);
      if (!stat) continue;

      total[stat] += Number(rune.bonus || 0);
    }

    // 4. Заточка: рівень 1 = 24, рівень 2 = 28 і т.д.
    for (const sharpen of sharpening) {
      const stat = SLOT_STAT[sharpen.slot_type];
      if (!stat) continue;

      const sharpenLevel = Number(sharpen.sharpen_level || 0);

      if (sharpenLevel > 0) {
        total[stat] += 20 + sharpenLevel * 4;
      }
    }

    return total;
  }, [equippedItems, slotBonuses, runes, sharpening]);

  const equipmentPower =
    bonuses.strength +
    bonuses.health +
    bonuses.armor +
    bonuses.luck +
    bonuses.speed +
    bonuses.crit;

  const power = 100 + equipmentPower;

  const totalRuneBonus = runes.reduce(
    (sum, rune) => sum + Number(rune.bonus || 0),
    0
  );

  const totalSharpenLevel = sharpening.reduce(
    (sum, item) => sum + Number(item.sharpen_level || 0),
    0
  );

  const totalSlotLevels = slotBonuses.reduce(
    (sum, item) => sum + Number(item.bonus_level || 0),
    0
  );

  const showPlaceholder = (title) => setMessage(title);

  const menu = [
    { icon: "🏆", title: "Досягнення", value: "0 / 30" },
    { icon: "📦", title: "Колекції", value: "0 / 14" },
    {
      icon: "🛡️",
      title: "Спорядження",
      value: `${equippedItems.length} / 10`,
    },
    { icon: "🐉", title: "Вихованець", value: "Рівень 1" },
    { icon: "⚔️", title: "Уміння", value: "0 / 6" },
    { icon: "🎒", title: "Сумка", value: "Відкрити" },
    { icon: "📦", title: "Сундук", value: "Відкрити" },
    { icon: "✉️", title: "Пошта", value: "0" },
    { icon: "🏋️", title: "Тренування", value: "(+)", plus: true },
    { icon: "⚡", title: "Усиления", value: "(+)", plus: true },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.heroHeader}>
        <div style={styles.heroName}>⚔️ {heroName}</div>
        <div style={styles.heroLevel}>⬆️ {level} ур.</div>
        <div style={styles.heroClan}>🛡️ Без клана</div>

        <div style={styles.power}>
          Міць: <span>⚔️ {formatNumber(power)}</span>
        </div>
      </header>

      <section style={styles.equipmentArea}>
        <div style={styles.equipmentColumn}>
          {EQUIPMENT_SLOTS.slice(0, 4).map((slot) => (
            <EquipmentSlot
              key={slot.type}
              slot={slot}
              row={equipmentBySlot[slot.type]}
              loading={loadingEquipment}
              onClick={() => showPlaceholder(slot.label)}
            />
          ))}
        </div>

        <div style={styles.heroImage}>
          {hero.avatar_url ? (
            <img
              src={hero.avatar_url}
              alt={heroName}
              style={styles.heroAvatar}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div style={styles.heroImageGlow}>⚔️</div>
          )}

          <div style={styles.heroImageText}>{heroName}</div>
          <div style={styles.heroLevelBadge}>Рівень {level}</div>
        </div>

        <div style={styles.equipmentColumn}>
          {EQUIPMENT_SLOTS.slice(4, 8).map((slot) => (
            <EquipmentSlot
              key={slot.type}
              slot={slot}
              row={equipmentBySlot[slot.type]}
              loading={loadingEquipment}
              onClick={() => showPlaceholder(slot.label)}
            />
          ))}
        </div>
      </section>

      <div style={styles.amuletRow}>
        {EXTRA_SLOTS.map((slot) => (
          <EquipmentSlot
            key={slot.type}
            slot={slot}
            row={equipmentBySlot[slot.type]}
            loading={loadingEquipment}
            onClick={() => showPlaceholder(slot.label)}
          />
        ))}
      </div>

      {equipmentError && (
        <div style={styles.errorNotice}>
          {equipmentError}
          <button style={styles.retryButton} onClick={loadEquipment}>
            Повторити
          </button>
        </div>
      )}

      <section style={styles.statsBlock}>
        <div style={styles.statsTitle}>Характеристики героя</div>

        <StatRow
          icon="❤️"
          label="Здоров'я"
          value={`+${formatNumber(bonuses.health)}`}
        />
        <StatRow
          icon="⚔️"
          label="Сила"
          value={`+${formatNumber(bonuses.strength)}`}
        />
        <StatRow
          icon="🛡️"
          label="Броня"
          value={`+${formatNumber(bonuses.armor)}`}
        />
        <StatRow
          icon="🍀"
          label="Удача"
          value={`+${formatNumber(bonuses.luck)}`}
        />
        <StatRow
          icon="⚡"
          label="Швидкість"
          value={`+${formatNumber(bonuses.speed)}`}
        />
        <StatRow
          icon="🎯"
          label="Критичний шанс"
          value={`${formatNumber(bonuses.crit)}%`}
        />

        <div style={styles.equippedCount}>
          Надіто предметів: {equippedItems.length}
        </div>
      </section>

      <section style={styles.statsBlock}>
        <div style={styles.statsTitle}>Додаткові посилення</div>
        <StatRow
          icon="🔮"
          label="Бонус від рун"
          value={`+${formatNumber(totalRuneBonus)}`}
        />
        <StatRow
          icon="⚒️"
          label="Сумарний рівень заточки"
          value={`+${formatNumber(totalSharpenLevel)}`}
        />
        <StatRow
          icon="✨"
          label="Рівні бонусів слотів"
          value={formatNumber(totalSlotLevels)}
        />
      </section>

      <div style={styles.quickBar}>
        {[
          ["🏆", "Досягнення"],
          ["🪓", "Колекції"],
          ["📿", "Амулет"],
          ["👑", "Бонус"],
          ["🛡️", "Заточка"],
          ["🔥", "Зірки"],
        ].map(([icon, title]) => (
          <button
            key={title}
            style={styles.quickButton}
            onClick={() => showPlaceholder(title)}
            title={title}
          >
            <span>{icon}</span>
            <small>{title}</small>
          </button>
        ))}
      </div>

      <div style={styles.list}>
        {menu.map((item) => (
          <div
            key={item.title}
            style={styles.menuItem}
            onClick={() => {
              if (item.title === "Тренування") {
                onNavigate?.("training");
              } else if (item.title === "Уміння") {
                onNavigate?.("skills");
              } else if (item.title === "Сумка") {
                onNavigate?.("inventory", "bag");
              } else if (item.title === "Сундук") {
                onNavigate?.("inventory", "chest");
              } else {
                showPlaceholder(item.title);
              }
            }}
          >
            <div style={styles.menuLeft}>
              <span style={styles.menuIcon}>{item.icon}</span>
              <span style={styles.menuTitle}>{item.title}</span>
            </div>

            <div
              style={{
                ...styles.menuValue,
                ...(item.plus ? styles.plus : {}),
              }}
            >
              {item.value}
            </div>

            <span style={styles.arrow}>›</span>
          </div>
        ))}
      </div>

      <div style={styles.infoBlock}>
        <span>🛡️ Бонус кланового досвіду</span>
        <strong>100%</strong>
      </div>

      <div style={styles.xpBlock}>
        <div style={styles.xpText}>
          <span>⬆️ {level} ур.</span>
          <span>Досвід: {formatNumber(experience)}</span>
        </div>

        <div style={styles.xpBar}>
          <div
            style={{
              ...styles.xpProgress,
              width: `${Math.min(100, experience % 100)}%`,
            }}
          />
        </div>
      </div>

      <div style={styles.rankingBlock}>
        <div
          style={styles.rankingRow}
          onClick={() => showPlaceholder("Рейтинг Колізею")}
        >
          <span>🏆 Рейтинг Колізею</span>
          <span>—</span>
        </div>

        <div
          style={styles.rankingRow}
          onClick={() => showPlaceholder("Ліга обраних")}
        >
          <span>🏅 Ліга обраних</span>
          <span>Місце: —</span>
        </div>
      </div>

      <div style={styles.resources}>
        <span>🪙 {formatNumber(gold)}</span>
        <span>💎 {formatNumber(crystals)}</span>
      </div>

      {message && (
        <div style={styles.overlay} onClick={() => setMessage(null)}>
          <div
            style={styles.placeholderCard}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.placeholderIcon}>🚧</div>
            <div style={styles.placeholderTitle}>{message}</div>
            <div style={styles.placeholderText}>
              Цей розділ поки що є заглушкою. Функціонал буде доданий пізніше.
            </div>
            <button
              style={styles.closeButton}
              onClick={() => setMessage(null)}
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EquipmentSlot({ slot, row, loading, onClick }) {
  const item = row?.item;
  const rarity = item?.rarity || "empty";

  return (
    <button
      type="button"
      style={{
        ...styles.equipmentSlot,
        ...(item ? styles.equippedSlot : {}),
        ...(rarity !== "empty" ? styles[`rarity_${rarity}`] || {} : {}),
      }}
      onClick={onClick}
      title={item ? `${slot.label}: ${item.name}` : slot.label}
    >
      {item?.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          style={styles.equipmentImage}
          onError={(event) => {
            event.currentTarget.style.display = "none";
            const fallback =
              event.currentTarget.parentElement?.querySelector(
                ".equipment-fallback"
              );
            if (fallback) fallback.style.display = "flex";
          }}
        />
      ) : null}

      <span
        className="equipment-fallback"
        style={{
          ...styles.slotFallback,
          display: item?.image_url ? "none" : "flex",
        }}
      >
        {loading ? "…" : slot.icon}
      </span>

      {item && (
        <span style={styles.itemBonus}>
          {Number(item.attack_bonus || 0) > 0
            ? `+${item.attack_bonus}`
            : Number(item.defense_bonus || 0) > 0
              ? `+${item.defense_bonus}`
              : Number(item.hp_bonus || 0) > 0
                ? `+${item.hp_bonus}`
                : Number(item.luck_bonus || 0) > 0
                  ? `+${item.luck_bonus}`
                  : item.level
                    ? `Р${item.level}`
                    : "✓"}
        </span>
      )}
    </button>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div style={styles.statRow}>
      <span>
        {icon} {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0d0906 0%, #140d08 100%)",
    color: "#d4a359",
    fontFamily: "Arial, sans-serif",
    fontSize: 14,
    paddingBottom: 80,
    boxSizing: "border-box",
  },
  heroHeader: {
    padding: 12,
    textAlign: "center",
    borderBottom: "1px solid #3d2a1a",
    background: "linear-gradient(180deg, #1c120b, #140d08)",
  },
  heroName: { fontSize: 18, fontWeight: 700, color: "#72b043" },
  heroLevel: { marginTop: 4, fontSize: 13 },
  heroClan: { marginTop: 4, fontSize: 12, color: "#887055" },
  power: { marginTop: 8, color: "#ffaa00", fontSize: 17, fontWeight: 700 },
  equipmentArea: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: "14px 6px 8px",
    borderBottom: "1px solid #2a1c10",
  },
  equipmentColumn: { display: "flex", flexDirection: "column", gap: 6 },
  equipmentSlot: {
    position: "relative",
    width: 48,
    height: 48,
    flexShrink: 0,
    overflow: "hidden",
    border: "1px solid #594027",
    borderRadius: 5,
    background: "linear-gradient(145deg, #24170e, #110a06)",
    color: "#d4a359",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 2,
    boxSizing: "border-box",
  },
  equippedSlot: {
    borderColor: "#b98b43",
    boxShadow: "0 0 8px #6b482633",
  },
  rarity_rare: { borderColor: "#478ed1" },
  rarity_epic: { borderColor: "#a16bd7" },
  rarity_legendary: { borderColor: "#e7a638" },
  rarity_mythic: { borderColor: "#e85a56" },
  equipmentImage: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: 2,
    boxSizing: "border-box",
  },
  slotFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  },
  itemBonus: {
    position: "absolute",
    right: 1,
    bottom: 1,
    background: "#120b07dd",
    borderRadius: 2,
    padding: "1px 3px",
    color: "#e7bd67",
    fontSize: 9,
  },
  heroImage: {
    width: "min(145px, 38vw)",
    height: 210,
    flexShrink: 1,
    overflow: "hidden",
    border: "1px solid #594027",
    borderRadius: 6,
    background:
      "radial-gradient(circle, #382313 0%, #170d08 65%, #0d0906 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  heroAvatar: { width: "100%", height: "100%", objectFit: "cover" },
  heroImageGlow: {
    fontSize: 74,
    filter: "drop-shadow(0 0 15px rgba(255,170,0,0.25))",
  },
  heroImageText: {
    marginTop: 8,
    padding: "0 4px",
    fontWeight: 700,
    color: "#d4a359",
    overflowWrap: "anywhere",
  },
  heroLevelBadge: { marginTop: 5, color: "#a98b64", fontSize: 11 },
  amuletRow: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    padding: 8,
    borderBottom: "1px solid #2a1c10",
  },
  statsBlock: {
 margin: 10,
    padding: 12,
    border: "1px solid #3d2a1a",
    borderRadius: 5,
    background: "#160e09",
  },
  statsTitle: {
    fontWeight: 700,
    marginBottom: 8,
    color: "#e1bd7c",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 0",
    borderBottom: "1px solid #28190e",
    color: "#b99a70",
  },
  equippedCount: {
    marginTop: 10,
    fontSize: 12,
    color: "#887055",
  },
  errorNotice: {
    margin: 10,
    padding: 10,
    background: "#3b1712",
    color: "#ffb7a8",
  },
  retryButton: {
    marginLeft: 10,
    padding: 5,
    background: "#28190e",
    color: "#d4a359",
    border: "1px solid #594027",
  },
  quickBar: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 5,
    padding: 7,
    borderBottom: "1px solid #3d2a1a",
    background: "#110a06",
  },
  quickButton: {
    minHeight: 48,
    border: "1px solid #392718",
    background: "#1b1009",
    color: "#d4a359",
    cursor: "pointer",
    borderRadius: 3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    fontSize: 18,
  },
  list: { borderBottom: "1px solid #3d2a1a" },
  menuItem: {
    minHeight: 44,
    padding: "7px 10px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #28190e",
    cursor: "pointer",
    background: "linear-gradient(90deg, #160d08, #120a06)",
  },
  menuLeft: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  menuIcon: {
    width: 28,
    fontSize: 18,
    textAlign: "center",
    marginRight: 5,
  },
  menuTitle: { color: "#d4a359", fontWeight: 600 },
  menuValue: { color: "#887055", fontSize: 12, marginRight: 5 },
  plus: { color: "#72b043", fontWeight: 700 },
  arrow: { color: "#6f573c", fontSize: 20 },
  infoBlock: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #3d2a1a",
  },
  xpBlock: { padding: 10, borderBottom: "1px solid #3d2a1a" },
  xpText: {
    display: "flex",
    justifyContent: "space-between",
    color: "#d4a359",
    fontSize: 12,
  },
  xpBar: {
    marginTop: 7,
    height: 8,
    background: "#28190e",
    border: "1px solid #4a321c",
    borderRadius: 2,
    overflow: "hidden",
  },
  xpProgress: {
    height: "100%",
    background: "linear-gradient(90deg, #557d32, #72b043)",
  },
  rankingBlock: { borderBottom: "1px solid #3d2a1a" },
  rankingRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #28190e",
    color: "#d4a359",
    cursor: "pointer",
  },
  resources: {
    display: "flex",
    justifyContent: "center",
    gap: 30,
    padding: 10,
    fontWeight: 700,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },
  placeholderCard: {
    width: "100%",
    maxWidth: 330,
    padding: 24,
    boxSizing: "border-box",
    background: "linear-gradient(145deg, #24150e, #120a06)",
    border: "1px solid #594027",
    borderRadius: 8,
    textAlign: "center",
  },
  placeholderIcon: { fontSize: 40, marginBottom: 10 },
  placeholderTitle: {
    color: "#d4a359",
    fontSize: 18,
    fontWeight: 700,
  },
  placeholderText: {
    marginTop: 10,
    color: "#887055",
    fontSize: 13,
    lineHeight: 1.5,
  },
  closeButton: {
    marginTop: 18,
    padding: "9px 25px",
    border: "1px solid #594027",
    borderRadius: 4,
    background: "#1b1009",
    color: "#d4a359",
    cursor: "pointer",
    fontWeight: 700,
  },
};
    
