import { useState } from "react";

export default function Heroes({ profile, player, onNavigate }) {
  const [message, setMessage] = useState(null);

  const hero = player || profile || {};

  const heroName = hero.display_name || hero.username || "Аріан";
  const level = hero.level || 1;
  const experience = hero.experience || 0;
  const gold = hero.gold || 0;
  const crystals = hero.crystals || 0;

  const showPlaceholder = (title) => {
    setMessage(title);
  };

  const equipment = [
    { icon: "🛡️", value: "+0" },
    { icon: "🗡️", value: "+0" },
    { icon: "🛡️", value: "+0" },
    { icon: "🛡️", value: "+0" },
    { icon: "🛡️", value: "+0" },
    { icon: "🛡️", value: "+0" },
    { icon: "💍", value: "+0" },
    { icon: "💍", value: "+0" },
  ];

  const menu = [
    {
      icon: "🏆",
      title: "Досягнення",
      value: "0 / 30",
    },
    {
      icon: "📦",
      title: "Колекції",
      value: "0 / 14",
    },
    {
      icon: "🛡️",
      title: "Спорядження",
      value: "0 / 8",
    },
    {
      icon: "🐉",
      title: "Вихованець",
      value: "Рівень 1",
    },
    {
      icon: "⚔️",
      title: "Уміння",
      value: "0 / 6",
    },
    {
      icon: "🎒",
      title: "Сумка",
      value: "0 / 40",
    },
    {
      icon: "📦",
      title: "Сундук",
      value: "Порожньо",
    },
    {
      icon: "✉️",
      title: "Пошта",
      value: "0",
    },
    {
      icon: "🏋️",
      title: "Тренування",
      value: "(+)",
      plus: true,
    },
    {
      icon: "⚡",
      title: "Усиления",
      value: "(+)",
      plus: true,
    },
  ];

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.heroHeader}>
        <div style={styles.heroName}>
          ⚔️ <span>{heroName}</span>
        </div>

        <div style={styles.heroLevel}>
          ⬆️ {level} ур.
        </div>

        <div style={styles.heroClan}>
          🛡️ Без клана
        </div>

        <div style={styles.power}>
          Мощь: <span>⚔️ 100</span>
        </div>
      </div>

      {/* HERO + EQUIPMENT */}
      <div style={styles.equipmentArea}>

        <div style={styles.equipmentColumn}>
          {equipment.slice(0, 4).map((item, index) => (
            <EquipmentSlot
              key={index}
              item={item}
              onClick={() => showPlaceholder("Спорядження")}
            />
          ))}
        </div>

        <div style={styles.heroImage}>
          <div style={styles.heroImageGlow}>
            ⚔️
          </div>
          <div style={styles.heroImageText}>
            {heroName}
          </div>
        </div>

        <div style={styles.equipmentColumn}>
          {equipment.slice(4, 8).map((item, index) => (
            <EquipmentSlot
              key={index}
              item={item}
              onClick={() => showPlaceholder("Спорядження")}
            />
          ))}
        </div>
      </div>

      {/* AMULET */}
      <div style={styles.amuletRow}>
        <EquipmentSlot
          item={{ icon: "📿", value: "+0" }}
          onClick={() => showPlaceholder("Амулет")}
        />
      </div>

      {/* QUICK SYSTEMS */}
      <div style={styles.quickBar}>
        <QuickButton
          icon="🏆"
          title="Досягнення"
          onClick={() => showPlaceholder("Досягнення")}
        />

        <QuickButton
          icon="🪓"
          title="Колекції"
          onClick={() => showPlaceholder("Колекції")}
        />

        <QuickButton
          icon="📿"
          title="Амулет"
          onClick={() => showPlaceholder("Амулет")}
        />

        <QuickButton
          icon="👑"
          title="Бонус"
          onClick={() => showPlaceholder("Бонус")}
        />

        <QuickButton
          icon="🛡️"
          title="Заточка"
          onClick={() => showPlaceholder("Заточка")}
        />

        <QuickButton
          icon="🔥"
          title="Зірки"
          onClick={() => showPlaceholder("Зірки")}
        />
      </div>

      {/* MAIN LIST */}
      <div style={styles.list}>

        {menu.map((item, index) => (
          <div
            key={index}
            style={styles.menuItem}
            onClick={() => {
  if (item.title === "Тренування") {
    onNavigate?.("training");
  } else {
    showPlaceholder(item.title);
  }
}}
            >
          </div>
            <div style={styles.menuLeft}>
              <span style={styles.menuIcon}>
                {item.icon}
              </span>

              <span style={styles.menuTitle}>
                {item.title}
              </span>
            </div>

            <div
              style={{
                ...styles.menuValue,
                ...(item.plus ? styles.plus : {}),
              }}
            >
              {item.value}
            </div>

            {!item.plus && (
              <span style={styles.arrow}>›</span>
            )}
          </div>
        ))}

      </div>

      {/* EQUIPMENT DETAILS */}
      <div style={styles.detailsBlock}>
        <div
          style={styles.detailRow}
          onClick={() => showPlaceholder("Руни")}
        >
          <span>🔮 Руны</span>
          <span>—</span>
        </div>

        <div
          style={styles.detailRow}
          onClick={() => showPlaceholder("Заточка")}
        >
          <span>⚒️ Заточка</span>
          <span>+0</span>
        </div>

        <div
          style={styles.detailRow}
          onClick={() => showPlaceholder("Бонус")}
        >
          <span>✨ Бонус</span>
          <span>0 / 900</span>
        </div>

        <div
          style={styles.detailRow}
          onClick={() => showPlaceholder("Амулет")}
        >
          <span>📿 Амулет</span>
          <span>+0%</span>
        </div>
      </div>

      {/* CLAN EXPERIENCE */}
      <div style={styles.infoBlock}>
        <div style={styles.infoTitle}>
          🛡️ Бонус кланового опыта
        </div>

        <div style={styles.infoValue}>
          100%
        </div>
      </div>

      {/* XP */}
      <div style={styles.xpBlock}>
        <div style={styles.xpText}>
          ⬆️ {level} ур.
          <span>
            Опыт: {experience} / 100
          </span>
        </div>

        <div style={styles.xpBar}>
          <div style={styles.xpProgress} />
        </div>
      </div>

      {/* RANKINGS */}
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

      {/* RESOURCES */}
      <div style={styles.resources}>
        <span>🪙 {gold}</span>
        <span>💎 {crystals}</span>
      </div>

      {/* PLACEHOLDER MESSAGE */}
      {message && (
        <div
          style={styles.overlay}
          onClick={() => setMessage(null)}
        >
          <div
            style={styles.placeholderCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.placeholderIcon}>
              🚧
            </div>

            <div style={styles.placeholderTitle}>
              {message}
            </div>

            <div style={styles.placeholderText}>
              Цей розділ поки що є заглушкою.
              Функціонал буде доданий пізніше.
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


/* =========================
   COMPONENTS
========================= */

function EquipmentSlot({ item, onClick }) {
  return (
    <button
      style={styles.equipmentSlot}
      onClick={onClick}
    >
      <span>{item.icon}</span>
      <small>{item.value}</small>
    </button>
  );
}


function QuickButton({ icon, title, onClick }) {
  return (
    <button
      style={styles.quickButton}
      onClick={onClick}
      title={title}
    >
      {icon}
    </button>
  );
}


/* =========================
   STYLES
========================= */

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #0d0906 0%, #140d08 100%)",
    color: "#d4a359",
    fontFamily:
      "Arial, sans-serif",
    fontSize: "14px",
    paddingBottom: "80px",
    boxSizing: "border-box",
  },

  heroHeader: {
    padding: "12px",
    textAlign: "center",
    borderBottom:
      "1px solid #3d2a1a",
    background:
      "linear-gradient(180deg, #1c120b, #140d08)",
  },

  heroName: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#72b043",
  },

  heroLevel: {
    marginTop: "4px",
    color: "#d4a359",
    fontSize: "13px",
  },

  heroClan: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#887055",
  },

  power: {
    marginTop: "8px",
    color: "#ffaa00",
    fontSize: "17px",
    fontWeight: 700,
  },

  equipmentArea: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    padding: "14px 8px 5px",
    borderBottom:
      "1px solid #2a1c10",
  },

  equipmentColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  equipmentSlot: {
    width: "48px",
    height: "48px",
    border:
      "1px solid #594027",
    borderRadius: "5px",
    background:
      "linear-gradient(145deg, #24170e, #110a06)",
    color: "#d4a359",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: "2px",
    boxSizing: "border-box",
    boxShadow:
      "inset 0 0 8px rgba(0,0,0,0.6)",
  },

  heroImage: {
    width: "145px",
    height: "210px",
    border:
      "1px solid #594027",
    borderRadius: "6px",
    background:
      "radial-gradient(circle, #382313 0%, #170d08 65%, #0d0906 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  heroImageGlow: {
    fontSize: "74px",
    filter:
      "drop-shadow(0 0 15px rgba(255,170,0,0.25))",
  },

  heroImageText: {
    marginTop: "8px",
    fontWeight: 700,
    color: "#d4a359",
  },

  amuletRow: {
    display: "flex",
    justifyContent: "center",
    padding: "6px",
    borderBottom:
      "1px solid #2a1c10",
  },

  quickBar: {
    display: "grid",
    gridTemplateColumns:
      "repeat(6, 1fr)",
    gap: "4px",
    padding: "7px",
    borderBottom:
      "1px solid #3d2a1a",
    background: "#110a06",
  },

  quickButton: {
    height: "40px",
    border:
      "1px solid #392718",
    background:
      "#1b1009",
    color: "#d4a359",
    fontSize: "20px",
    cursor: "pointer",
    borderRadius: "3px",
  },

  list: {
    borderBottom:
      "1px solid #3d2a1a",
  },

  menuItem: {
    minHeight: "44px",
    padding: "7px 10px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    borderBottom:
      "1px solid #28190e",
    cursor: "pointer",
    background:
      "linear-gradient(90deg, #160d08, #120a06)",
  },

  menuLeft: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  menuIcon: {
    width: "28px",
    fontSize: "18px",
    textAlign: "center",
    marginRight: "5px",
  },

  menuTitle: {
    color: "#d4a359",
    fontWeight: 600,
  },

  menuValue: {
    color: "#887055",
    fontSize: "12px",
    marginRight: "5px",
  },

  plus: {
    color: "#72b043",
    fontWeight: 700,
  },

  arrow: {
    color: "#6f573c",
    fontSize: "20px",
  },

  detailsBlock: {
    borderBottom:
      "1px solid #3d2a1a",
  },

  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 14px 8px 38px",
    borderBottom:
      "1px solid #28190e",
    color: "#887055",
    cursor: "pointer",
  },

  infoBlock: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderBottom:
      "1px solid #3d2a1a",
  },

  infoTitle: {
    color: "#d4a359",
  },

  infoValue: {
    color: "#72b043",
    fontWeight: 700,
  },

  xpBlock: {
    padding: "10px 12px",
    borderBottom:
      "1px solid #3d2a1a",
  },

  xpText: {
    display: "flex",
    justifyContent: "space-between",
    color: "#d4a359",
    fontSize: "12px",
  },

  xpBar: {
    marginTop: "7px",
    height: "8px",
    background: "#28190e",
    border:
      "1px solid #4a321c",
    borderRadius: "2px",
    overflow: "hidden",
  },

  xpProgress: {
    width: "5%",
    height: "100%",
    background:
      "linear-gradient(90deg, #557d32, #72b043)",
  },

  rankingBlock: {
    borderBottom:
      "1px solid #3d2a1a",
  },

  rankingRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderBottom:
      "1px solid #28190e",
    color: "#d4a359",
    cursor: "pointer",
  },

  resources: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
    padding: "10px",
    color: "#d4a359",
    fontWeight: 700,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },

  placeholderCard: {
    width: "100%",
    maxWidth: "330px",
    padding: "24px",
    boxSizing: "border-box",
    background:
      "linear-gradient(145deg, #24150e, #120a06)",
    border:
      "1px solid #594027",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow:
      "0 15px 50px rgba(0,0,0,0.6)",
  },

  placeholderIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  placeholderTitle: {
    color: "#d4a359",
    fontSize: "18px",
    fontWeight: 700,
  },

  placeholderText: {
    marginTop: "10px",
    color: "#887055",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  closeButton: {
    marginTop: "18px",
    padding: "9px 25px",
    border:
      "1px solid #594027",
    borderRadius: "4px",
    background: "#1b1009",
    color: "#d4a359",
    cursor: "pointer",
    fontWeight: 700,
  },
};
