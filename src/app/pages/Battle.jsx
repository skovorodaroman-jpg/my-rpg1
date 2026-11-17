
import { useState } from "react";

const BATTLE_MODES = [
  {
    id: "ancientAltars",
    title: "Древні алтарі",
    description: "Випробуй свою силу біля стародавніх святинь",
    icon: "🗿",
    color: "#B58B52",
    label: "Стародавня сила",
  },
  {
    id: "immortalsValley",
    title: "Долина безсмертних",
    description: "Змагайся з могутніми безсмертними воїнами",
    icon: "🏔️",
    color: "#6796B8",
    label: "Випробування",
  },
  {
    id: "immortalKing",
    title: "Король безсмертних",
    description: "Кинь виклик наймогутнішому володарю",
    icon: "👑",
    color: "#D5A33D",
    label: "Битва з босом",
  },
  {
    id: "clanTournament",
    title: "Клановий турнір",
    description: "Представ свій клан у запеклому змаганні",
    icon: "⚔️",
    color: "#B66C53",
    label: "Командне змагання",
  },
  {
    id: "clanColiseum",
    title: "Клановий Колізей",
    description: "Об'єднай сили клану та здобудь перемогу",
    icon: "🏟️",
    color: "#A77BC2",
    label: "Кланова битва",
  },
  {
    id: "battleSchedule",
    title: "Розклад битв",
    description: "Переглядай майбутні та поточні битви",
    icon: "📜",
    color: "#6EAD8B",
    label: "Календар подій",
  },
];

export default function Battle({ onNavigate }) {
  const [selectedMode, setSelectedMode] = useState(null);

  const openPage = (page) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      setSelectedMode(page);
    }
  };

  const styles = {
    page: {
      minHeight: "100%",
      width: "100%",
      color: "#F0E4CF",
      padding: "16px 14px 28px",
      boxSizing: "border-box",
      fontFamily: "inherit",
    },
    header: {
      textAlign: "center",
      marginBottom: 22,
    },
    eyebrow: {
      color: "#B58B52",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: 3,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    title: {
      fontSize: 29,
      fontWeight: 900,
      letterSpacing: 1,
      margin: 0,
      color: "#E8C994",
      textShadow: "0 2px 12px rgba(213,163,61,0.2)",
    },
    subtitle: {
      color: "#9C8B77",
      fontSize: 12,
      lineHeight: 1.6,
      marginTop: 9,
    },
    divider: {
      height: 1,
      background:
        "linear-gradient(90deg, transparent, #795A36, transparent)",
      margin: "18px 0",
    },
    sectionTitle: {
      fontSize: 13,
      color: "#C7AD83",
      fontWeight: 800,
      letterSpacing: 1.5,
      marginBottom: 12,
      textTransform: "uppercase",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 11,
    },
    card: {
      position: "relative",
      minHeight: 166,
      padding: "15px 12px 13px",
      borderRadius: 15,
      border: "1px solid #493729",
      background:
        "linear-gradient(145deg, #292019 0%, #1C1713 65%, #17120F 100%)",
      textAlign: "left",
      color: "#F0E4CF",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      boxSizing: "border-box",
      overflow: "hidden",
      transition: "transform 0.15s ease, border-color 0.15s ease",
      WebkitTapHighlightColor: "transparent",
    },
    iconWrap: (color) => ({
      width: 43,
      height: 43,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 24,
      background: `${color}18`,
      border: `1px solid ${color}55`,
      marginBottom: 12,
    }),
    cardTitle: {
      fontSize: 14,
      lineHeight: 1.25,
      fontWeight: 900,
      marginBottom: 7,
      color: "#E8D4B4",
    },
    description: {
      fontSize: 10,
      lineHeight: 1.45,
      color: "#A99A87",
      flex: 1,
    },
    label: (color) => ({
      marginTop: 11,
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: 0.5,
      color,
      textTransform: "uppercase",
    }),
    arrow: {
      position: "absolute",
      right: 12,
      top: 15,
      color: "#806C55",
      fontSize: 17,
    },
    footer: {
      marginTop: 20,
      padding: 14,
      borderRadius: 13,
      border: "1px solid #3F3025",
      background: "rgba(35, 26, 20, 0.75)",
      textAlign: "center",
    },
    footerTitle: {
      color: "#D3B47E",
      fontSize: 12,
      fontWeight: 800,
      marginBottom: 5,
    },
    footerText: {
      color: "#988875",
      fontSize: 10,
      lineHeight: 1.5,
    },
    backButton: {
      background: "#35271D",
      border: "1px solid #795A36",
      color: "#E8C994",
      borderRadius: 10,
      padding: "10px 15px",
      fontWeight: 800,
      fontSize: 12,
      cursor: "pointer",
      marginBottom: 16,
    },
  };

  if (selectedMode) {
    const mode = BATTLE_MODES.find((item) => item.id === selectedMode);

    return (
      <div style={styles.page}>
        <button
          style={styles.backButton}
          onClick={() => setSelectedMode(null)}
        >
          ← Назад до битв
        </button>

        <div style={styles.header}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>
            {mode?.icon}
          </div>
          <h2 style={styles.title}>{mode?.title}</h2>
          <p style={styles.subtitle}>
            Сторінка підготовлена для підключення функціоналу.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.eyebrow}>Хроніки Згаслого Світанку</div>
        <h1 style={styles.title}>БИТВИ</h1>
        <div style={styles.subtitle}>
          Обирай випробування. Здобувай перемоги. Пиши власну легенду.
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.sectionTitle}>⚔ Обери свій шлях</div>

      <div style={styles.grid}>
        {BATTLE_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            style={styles.card}
            onClick={() => openPage(mode.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = mode.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#493729";
            }}
          >
            <span style={styles.arrow}>›</span>

            <div style={styles.iconWrap(mode.color)}>
              {mode.icon}
            </div>

            <div style={styles.cardTitle}>{mode.title}</div>

            <div style={styles.description}>
              {mode.description}
            </div>

            <div style={styles.label(mode.color)}>
              {mode.label}
            </div>
          </button>
        ))}
      </div>

      <div style={styles.footer}>
        <div style={styles.footerTitle}>⚔ Шлях воїна починається тут</div>
        <div style={styles.footerText}>
          Кожне випробування приховує власні небезпеки.
          Підготуй героя та будь готовий до битви.
        </div>
      </div>
    </div>
  );
      }
