import React, { useEffect, useState } from "react";

const MENU_ITEMS = [
  {
    id: "arena",
    icon: "🛡️",
    title: "Арена",
    route: "arena",
    arrow: true,
  },
  {
    id: "career",
    icon: "⚔️",
    title: "Кар'єра",
    route: "adventures",
    plus: true,
  },
  {
    id: "cave",
    icon: "🏰",
    title: "Печера",
    route: "mine",
    plus: true,
  },
  {
    id: "sage",
    icon: "🛖",
    title: "Хатина мудреця",
    unavailable: true,
    plus: true,
  },
  {
    id: "immortal",
    icon: "🦁",
    title: "Король Безсмертних",
    timer: true,
  },
  {
    id: "battles",
    icon: "⚔️",
    title: "Сраження",
    route: "battle",
    plus: true,
  },
  {
    id: "colosseum",
    icon: "📜",
    title: "Колізей",
    unavailable: true,
    plus: true,
  },
  {
    id: "campaign",
    icon: "🏰",
    title: "Похід",
    route: "adventures",
    plus: true,
  },
  {
    id: "gold",
    icon: "🪙",
    title: "Отримати золото",
    unavailable: true,
    plus: true,
  },
  {
    id: "equipment-shop",
    icon: "🛡️",
    title: "Магазин спорядження",
    route: "shop",
    arrow: true,
  },
  {
    id: "forge",
    icon: "⚒️",
    title: "Кузня",
    route: "forge",
    subtitle: "Руни • заточка • бонус • зірки",
    arrow: true,
  },
  {
    id: "laboratory",
    icon: "🧪",
    title: "Лабораторія",
    route: "laboratory",
    subtitle: "Посилення • еліксири • камінь • трава",
    arrow: true,
  },
  {
    id: "ranking",
    icon: "📜",
    title: "Рейтинг",
    route: "ranking",
    arrow: true,
  },
  {
    id: "personal-records",
    icon: "🏆",
    title: "Найкращі особисті рекорди",
    unavailable: true,
    arrow: true,
  },
  {
    id: "clan-records",
    icon: "🛡️",
    title: "Найкращі рекорди кланів",
    unavailable: true,
    arrow: true,
  },
  {
    id: "hero",
    icon: "🧙",
    title: "Мій герой",
    route: "hero",
    arrow: true,
  },
  {
    id: "clan",
    icon: "🧙",
    title: "Мій клан",
    route: "clan",
    plus: true,
  },
];

export default function Home({ profile, player, onNavigate }) {
  const currentPlayer = profile || player || {};

  const [immortalTime, setImmortalTime] = useState(41 * 60 + 29);

  useEffect(() => {
    const timer = setInterval(() => {
      setImmortalTime((value) => {
        if (value <= 0) return 41 * 60 + 29;
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours,
      minutes,
      secs,
    ]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  const handleMenuClick = (item) => {
    if (item.route && onNavigate) {
      onNavigate(item.route);
      return;
    }

    // Тимчасово показуємо повідомлення для розділів,
    // механіку яких додамо пізніше.
    if (item.unavailable) {
      window.alert(
        `${item.title}\n\nЦей розділ буде доступний після додавання його механіки.`
      );
    }
  };

  const level = currentPlayer.level ?? 1;
  const experience = currentPlayer.experience ?? 0;

  // Тимчасова система XP:
  // кожні 1000 XP — наступний рівень.
  const xpInLevel = experience % 1000;
  const xpPercent = Math.min(100, (xpInLevel / 1000) * 100);

  const health = currentPlayer.health ?? 100;
  const maxHealth = currentPlayer.max_health ?? 100;

  const energy = currentPlayer.energy ?? 100;
  const maxEnergy = currentPlayer.max_energy ?? 100;

  const healthPercent = Math.min(
    100,
    Math.max(0, (health / Math.max(maxHealth, 1)) * 100)
  );

  const energyPercent = Math.min(
    100,
    Math.max(0, (energy / Math.max(maxEnergy, 1)) * 100)
  );

  return (
    <div style={styles.page}>
      {/* =====================================================
          ВЕРХНЯ ПАНЕЛЬ
      ===================================================== */}

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.homeIcon}>⌂</div>

          <div>
            <div style={styles.headerTitle}>Головна</div>
            <div style={styles.levelText}>
              Рівень {level}
            </div>
          </div>
        </div>

        <div style={styles.headerStats}>
          <div style={styles.resource}>
            <span style={styles.resourceIcon}>❤️</span>

            <div style={styles.resourceInfo}>
              <span style={styles.resourceLabel}>Здоров'я</span>

              <div style={styles.miniBar}>
                <div
                  style={{
                    ...styles.healthFill,
                    width: `${healthPercent}%`,
                  }}
                />
              </div>

              <span style={styles.resourceValue}>
                {health}/{maxHealth}
              </span>
            </div>
          </div>

          <div style={styles.resource}>
            <span style={styles.resourceIcon}>⚡</span>

            <div style={styles.resourceInfo}>
              <span style={styles.resourceLabel}>Енергія</span>

              <div style={styles.miniBar}>
                <div
                  style={{
                    ...styles.energyFill,
                    width: `${energyPercent}%`,
                  }}
                />
              </div>

              <span style={styles.resourceValue}>
                {energy}/{maxEnergy}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          XP
      ===================================================== */}

      <section style={styles.xpSection}>
        <div style={styles.xpTop}>
          <span>Досвід</span>
          <span>
            {xpInLevel} / 1000
          </span>
        </div>

        <div style={styles.xpTrack}>
          <div
            style={{
              ...styles.xpFill,
              width: `${xpPercent}%`,
            }}
          />
        </div>
      </section>

      {/* =====================================================
          АКЦІЯ
      ===================================================== */}

      <button
        type="button"
        style={styles.promo}
        onClick={() => {
          window.alert(
            "Персональна акція\n\nЗнижка 50% на кільця!"
          );
        }}
      >
        <div style={styles.promoIcon}>💍</div>

        <div style={styles.promoText}>
          <div style={styles.promoTitle}>
            Знижка 50% на кільця!
          </div>

          <div style={styles.promoSubtitle}>
            Персональна акція
          </div>
        </div>

        <div style={styles.promoArrow}>›</div>
      </button>

      {/* =====================================================
          ОСНОВНЕ МЕНЮ
      ===================================================== */}

      <section style={styles.menuSection}>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleMenuClick(item)}
            style={styles.menuItem}
          >
            <div style={styles.menuIcon}>
              {item.icon}
            </div>

            <div style={styles.menuContent}>
              <div style={styles.menuTitle}>
                {item.title}

                {item.plus && (
                  <span style={styles.plus}>
                    +
                  </span>
                )}
              </div>

              {item.subtitle && (
                <div style={styles.menuSubtitle}>
                  {item.subtitle}
                </div>
              )}

              {item.timer && (
                <div style={styles.timer}>
                  {formatTimer(immortalTime)}
                </div>
              )}
            </div>

            <div style={styles.menuArrow}>
              {item.arrow
                ? "›"
                : item.plus
                  ? "+"
                  : item.timer
                    ? "›"
                    : ""}
            </div>
          </button>
        ))}

        {/* НА ГОЛОВНУ */}
        <button
          type="button"
          onClick={() => onNavigate?.("home")}
          style={{
            ...styles.menuItem,
            ...styles.homeMenuItem,
          }}
        >
          <div style={styles.menuIcon}>❯</div>

          <div style={styles.menuContent}>
            <div style={styles.menuTitle}>
              На головну
            </div>
          </div>

          <div style={styles.menuArrow}>
            ›
          </div>
        </button>
      </section>

      {/* =====================================================
          НИЖНЯ ПАНЕЛЬ
      ===================================================== */}

      <footer style={styles.bottomBar}>
        <button
          type="button"
          style={{
            ...styles.bottomButton,
            ...styles.bottomActive,
          }}
          onClick={() => onNavigate?.("home")}
        >
          <span style={styles.bottomIcon}>⌂</span>
          <span>Головна</span>
        </button>

        <button
          type="button"
          style={styles.bottomButton}
          onClick={() => onNavigate?.("hero")}
        >
          <span style={styles.bottomIcon}>🧙</span>
          <span>Герой</span>
        </button>

        <button
          type="button"
          style={styles.bottomButton}
          onClick={() => onNavigate?.("clan")}
        >
          <span style={styles.bottomIcon}>🛡️</span>
          <span>Клан</span>
        </button>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    boxSizing: "border-box",
    color: "#f4ead7",
    background:
      "radial-gradient(circle at 50% -20%, #28313c 0%, #10151c 35%, #070b10 100%)",
    fontFamily:
      "Georgia, 'Times New Roman', serif",
    overflowX: "hidden",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderBottom: "1px solid #8c6b32",
    background:
      "linear-gradient(180deg, #1b222b 0%, #0c1117 100%)",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.55)",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    minWidth: 0,
  },

  homeIcon: {
    width: 42,
    height: 42,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    border: "1px solid #9d7937",
    borderRadius: 8,
    background:
      "linear-gradient(145deg, #4a3920, #171c22)",
    color: "#e8b84e",
    fontSize: 28,
    boxShadow:
      "inset 0 0 12px rgba(0,0,0,0.6)",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f2d58e",
  },

  levelText: {
    marginTop: 2,
    fontSize: 11,
    color: "#a9aeb6",
  },

  headerStats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },

  resource: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    minWidth: 88,
  },

  resourceIcon: {
    fontSize: 20,
  },

  resourceInfo: {
    minWidth: 0,
  },

  resourceLabel: {
    display: "block",
    fontSize: 9,
    color: "#aeb4bd",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  resourceValue: {
    display: "block",
    marginTop: 2,
    fontSize: 9,
    color: "#eee2c9",
    textAlign: "right",
  },

  miniBar: {
    width: 58,
    height: 5,
    marginTop: 2,
    overflow: "hidden",
    borderRadius: 4,
    background: "#222832",
    border: "1px solid #11151b",
  },

  healthFill: {
    height: "100%",
    background:
      "linear-gradient(90deg, #8d141c, #e13c42)",
  },

  energyFill: {
    height: "100%",
    background:
      "linear-gradient(90deg, #a76b0b, #f0bd35)",
  },

  xpSection: {
    padding: "7px 12px 9px",
    background: "#090e14",
    borderBottom: "1px solid #2e3640",
  },

  xpTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 9,
    color: "#858c96",
  },

  xpTrack: {
    width: "100%",
    height: 4,
    overflow: "hidden",
    borderRadius: 4,
    background: "#252b34",
  },

  xpFill: {
    height: "100%",
    borderRadius: 4,
    background:
      "linear-gradient(90deg, #8d6420, #e4b64d)",
    boxShadow:
      "0 0 7px rgba(228,182,77,0.45)",
    transition: "width 0.3s ease",
  },

  promo: {
    width: "calc(100% - 20px)",
    minHeight: 72,
    margin: "12px 10px",
    padding: "10px 12px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "1px solid #a06f25",
    borderRadius: 8,
    background:
      "linear-gradient(100deg, #35130f 0%, #721a19 48%, #31120f 100%)",
    color: "#fff",
    textAlign: "left",
    cursor: "pointer",
    boxShadow:
      "inset 0 0 25px rgba(255,130,30,0.08), 0 3px 10px rgba(0,0,0,0.4)",
  },

  promoIcon: {
    width: 44,
    height: 44,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, #d89b35, #57210e)",
    border: "1px solid #d9a34a",
    fontSize: 24,
  },

  promoText: {
    flex: 1,
    minWidth: 0,
  },

  promoTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f8d888",
  },

  promoSubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: "#d9b6a0",
  },

  promoArrow: {
    fontSize: 30,
    color: "#e9bd55",
  },

  menuSection: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "2px 10px 16px",
  },

  menuItem: {
    width: "100%",
    minHeight: 58,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 9px",
    border: "1px solid #3c424a",
    borderRadius: 7,
    background:
      "linear-gradient(180deg, #1a2028 0%, #0f141b 100%)",
    color: "#eee8db",
    textAlign: "left",
    cursor: "pointer",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 5px rgba(0,0,0,0.35)",
    transition:
      "transform 0.12s ease, border-color 0.12s ease",
  },

  menuIcon: {
    width: 42,
    height: 42,
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    border: "1px solid #66502d",
    borderRadius: 7,
    background:
      "radial-gradient(circle at 50% 35%, #3b3c39, #141a21)",
    fontSize: 24,
  },

  menuContent: {
    flex: 1,
    minWidth: 0,
  },

  menuTitle: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.2,
    color: "#eee7d8",
  },

  menuSubtitle: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 1.25,
    color: "#8f969f",
  },

  plus: {
    color: "#e4b34e",
    fontSize: 20,
    lineHeight: 1,
  },

  timer: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: 700,
    color: "#e8b542",
    letterSpacing: 1,
  },

  menuArrow: {
    width: 24,
    flexShrink: 0,
    textAlign: "center",
    color: "#c99b43",
    fontSize: 25,
    fontFamily: "Arial, sans-serif",
  },

  homeMenuItem: {
    marginTop: 2,
    borderColor: "#6b542e",
    background:
      "linear-gradient(180deg, #24272a 0%, #11151a 100%)",
  },

  bottomBar: {
    position: "sticky",
    bottom: 0,
    zIndex: 20,
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    minHeight: 62,
    borderTop: "1px solid #80612e",
    background:
      "linear-gradient(180deg, #171d24, #090d12)",
    boxShadow:
      "0 -5px 15px rgba(0,0,0,0.5)",
  },

  bottomButton: {
    flex: 1,
    maxWidth: 130,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: "7px 4px",
    border: 0,
    background: "transparent",
    color: "#7e858e",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 10,
    cursor: "pointer",
  },

  bottomActive: {
    color: "#e5b94e",
  },

  bottomIcon: {
    fontSize: 22,
  },
};
