
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const EQUIPMENT_SLOTS = [
  { type: "helmet", label: "Шолом", icon: "👑", stat: "strength" },
  { type: "weapon", label: "Права рука", icon: "⚔️", stat: "strength" },
  { type: "shield", label: "Ліва рука", icon: "🛡️", stat: "strength" },
  { type: "shoulders", label: "Наплічники", icon: "🛡️", stat: "health" },
  { type: "armor", label: "Броня", icon: "🦺", stat: "armor" },
  { type: "gloves", label: "Рукавиці", icon: "🧤", stat: "luck" },
  { type: "pants", label: "Штани", icon: "👖", stat: "armor" },
  { type: "boots", label: "Чоботи", icon: "🥾", stat: "health" },
  { type: "ring_1", label: "Перше кільце", icon: "💍", stat: "health" },
  { type: "ring_2", label: "Друге кільце", icon: "💍", stat: "armor" },
];

const SLOT_ALIASES = {
  helmet: ["helmet", "шолом", "шлем"],
  weapon: ["weapon", "зброя", "меч", "клинок"],
  shield: ["shield", "щит"],
  shoulders: ["shoulders", "наплічники", "наплечники"],
  armor: ["armor", "броня", "обладунок"],
  gloves: ["gloves", "рукавиці", "рукавицы", "перчатки"],
  pants: ["pants", "штани", "штаны"],
  boots: ["boots", "чоботи", "сапоги"],
};

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

function getSlotType(row) {
  if (row?.equipped_slot) return row.equipped_slot;

  const item = row?.item || row || {};
  const type = String(item.item_type || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();

  for (const [slot, aliases] of Object.entries(SLOT_ALIASES)) {
    if (
      aliases.some((alias) => type === alias || name.includes(alias))
    ) {
      return slot;
    }
  }

  return null;
}

function getRuneStat(runeType) {
  const type = String(runeType || "").toLowerCase();

  const mapping = {
    strength: "strength",
    attack: "strength",
    health: "health",
    hp: "health",
    armor: "armor",
    defense: "armor",
    luck: "luck",
  };

  return mapping[type] || null;
}

function formatNumber(value) {
  return Math.floor(Number(value) || 0).toLocaleString("uk-UA");
}

const EXTRA_SLOTS = [
  { type: "amulet", label: "Амулет", icon: "📿" },
  { type: "ring", label: "Перстень", icon: "💍" },
];

const SLOT_ALIASES = {
  helmet: ["helmet", "шолом", "шлем"],
  weapon: ["weapon", "зброя", "меч", "клинок"],
  shoulders: ["shoulders", "наплічники", "наплечники"],
  armor: ["armor", "броня", "обладунок"],
  gloves: ["gloves", "рукавиці", "рукавицы", "перчатки"],
  shield: ["shield", "щит"],
  pants: ["pants", "штани", "штаны"],
  boots: ["boots", "чоботи", "сапоги"],
  amulet: ["amulet", "амулет"],
  ring: ["ring", "перстень", "кільце", "кольцо"],
};

function getSlotType(item) {
  const type = String(item?.item_type || "").toLowerCase();
  const name = String(item?.name || "").toLowerCase();

  for (const [slot, aliases] of Object.entries(SLOT_ALIASES)) {
    if (
      aliases.some(
        (alias) => type === alias || name.includes(alias)
      )
    ) {
      return slot;
    }
  }

  return null;
}

function formatNumber(value) {
  return Math.floor(Number(value) || 0).toLocaleString("uk-UA");
}

export default function Heroes({ profile, player, onNavigate }) {
  const hero = player || profile || {};
  const userId = hero.id;

  const [message, setMessage] = useState(null);
  const [equippedItems, setEquippedItems] = useState([]);
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
      setLoadingEquipment(false);
      return;
    }

    setLoadingEquipment(true);
    setEquipmentError("");

    try {
      const { data, error } = await supabase
        .from("player_items")
        .select("id, item_id, is_equipped, storage_location, item:items(*)")
        .eq("user_id", userId)
        .eq("is_equipped", true);

      if (error) throw error;

      setEquippedItems((data || []).filter((row) => row.item));
    } catch (err) {
      console.error("Не вдалося завантажити екіпірування:", err);
      setEquipmentError("Не вдалося завантажити екіпірування.");
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
      const slot = getSlotType(row.item);
      if (slot && !result[slot]) result[slot] = row;
    }

    return result;
  }, [equippedItems]);

  const bonuses = useMemo(() => {
    return equippedItems.reduce(
      (total, row) => {
        const item = row.item || {};

        total.attack += Number(item.attack_bonus || 0);
        total.defense += Number(item.defense_bonus || 0);
        total.hp += Number(item.hp_bonus || 0);
        total.speed += Number(item.speed_bonus || 0);

        return total;
      },
      { attack: 0, defense: 0, hp: 0, speed: 0 }
    );
  }, [equippedItems]);

  const showPlaceholder = (title) => setMessage(title);

  const menu = [
    { icon: "🏆", title: "Досягнення", value: "0 / 30" },
    { icon: "📦", title: "Колекції", value: "0 / 14" },
    {
      icon: "🛡️",
      title: "Спорядження",
      value: `${equippedItems.length} / 8`,
    },
    { icon: "🐉", title: "Вихованець", value: "Рівень 1" },
    { icon: "⚔️", title: "Уміння", value: "0 / 6" },
    { icon: "🎒", title: "Сумка", value: "Відкрити", action: "bag" },
    { icon: "📦", title: "Сундук", value: "Відкрити", action: "chest" },
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
          Мощь: <span>⚔️ {formatNumber(100 + bonuses.attack + bonuses.defense)}</span>
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
        <StatRow icon="❤️" label="Здоров’я" value={`+${formatNumber(bonuses.hp)}`} />
        <StatRow icon="⚔️" label="Атака" value={`+${formatNumber(bonuses.attack)}`} />
        <StatRow icon="🛡️" label="Захист" value={`+${formatNumber(bonuses.defense)}`} />
        <StatRow icon="⚡" label="Швидкість" value={`+${formatNumber(bonuses.speed)}`} />
        <div style={styles.equippedCount}>
          Надіто предметів: {equippedItems.length}
        </div>
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

      <div style={styles.detailsBlock}>
        {[
          ["🔮 Руны", "—"],
          ["⚒️ Заточка", "+0"],
          ["✨ Бонус", "0 / 900"],
          ["📿 Амулет", "+0%"],
        ].map(([title, value]) => (
          <div
            key={title}
            style={styles.detailRow}
            onClick={() => showPlaceholder(title.replace(/^[^\s]+\s/, ""))}
          >
            <span>{title}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div style={styles.infoBlock}>
        <span>🛡️ Бонус кланового опыта</span>
        <strong>100%</strong>
      </div>

      <div style={styles.xpBlock}>
        <div style={styles.xpText}>
          <span>⬆️ {level} ур.</span>
          <span>Опыт: {formatNumber(experience)} / 100</span>
        </div>
        <div style={styles.xpBar}>
          <div
            style={{
              ...styles.xpProgress,
              width: `${Math.min(100, (experience % 100))}%`,
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
            const fallback = event.currentTarget.parentElement?.querySelector(
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
      <span>{icon} {label}</span>
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
  equippedSlot: { borderColor: "#b98b43", boxShadow: "0 0 8px #6b482633" },
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
    background: "radial-gradient(circle, #382313 0%, #170d08 65%, #0d0906 100%)",
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
  statsTitle: { fontWeight: 700, marginBottom: 8, color: "#e1bd7c" },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 0",
    borderBottom: "1px solid #28190e",
    color: "#b99a70",
  },
  equippedCount: { marginTop: 10, fontSize: 12, color: "#887055" },
  errorNotice: { margin: 10, padding: 10, background: "#3b1712", color: "#ffb7a8" },
  retryButton: { marginLeft: 10, padding: 5, background: "#28190e", color: "#d4a359", border: "1px solid #594027" },
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
  menuLeft: { display: "flex", alignItems: "center", flex: 1, minWidth: 0 },
  menuIcon: { width: 28, fontSize: 18, textAlign: "center", marginRight: 5 },
  menuTitle: { color: "#d4a359", fontWeight: 600 },
  menuValue: { color: "#887055", fontSize: 12, marginRight: 5 },
  plus: { color: "#72b043", fontWeight: 700 },
  arrow: { color: "#6f573c", fontSize: 20 },
  detailsBlock: { borderBottom: "1px solid #3d2a1a" },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 14px 8px 18px",
    borderBottom: "1px solid #28190e",
    color: "#887055",
    cursor: "pointer",
  },
  infoBlock: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #3d2a1a",
  },
  xpBlock: { padding: 10, borderBottom: "1px solid #3d2a1a" },
  xpText: { display: "flex", justifyContent: "space-between", color: "#d4a359", fontSize: 12 },
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
  placeholderTitle: { color: "#d4a359", fontSize: 18, fontWeight: 700 },
  placeholderText: { marginTop: 10, color: "#887055", fontSize: 13, lineHeight: 1.5 },
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
                                                       
