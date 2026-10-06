import { useMemo, useState } from "react";

export default function Home({ profile, navigateTo }) {
  const [selectedRing, setSelectedRing] = useState("fury");

  const player = {
    name:
      profile?.display_name ||
      profile?.username ||
      "Світлоносець",

    level: profile?.level ?? 1,

    experience: profile?.experience ?? 0,

    gold: profile?.gold ?? 0,

    crystals: profile?.crystals ?? 0,

    energy: profile?.energy ?? 0,

    maxEnergy: profile?.max_energy ?? 100,

    avatar: profile?.avatar_url || null,
  };

  /*
   * Пізніше ці характеристики будемо брати
   * безпосередньо з player_heroes / heroes.
   */
  const hero = {
    name: player.name,
    level: player.level,
    type: "Воїн",
    power: 1250,

    hp: 860,
    maxHp: 1000,

    energy: player.energy,
    maxEnergy: player.maxEnergy,

    strength: 120,
    life: 180,
    armor: 95,
    luck: 40,
  };

  /*
   * Тимчасова XP-система.
   * Пізніше замінимо на реальні параметри героя.
   */
  const xpPercent = useMemo(() => {
    const levelXp = 1000;
    return Math.min(
      100,
      Math.max(
        0,
        ((player.experience % levelXp) / levelXp) * 100
      )
    );
  }, [player.experience]);

  const hpPercent = Math.min(
    100,
    Math.max(0, (hero.hp / hero.maxHp) * 100)
  );

  const energyPercent = Math.min(
    100,
    Math.max(0, (hero.energy / hero.maxEnergy) * 100)
  );

  const rings = [
    {
      id: "fury",
      name: "Кільце Ярості",
      icon: "🔥",
      bonus: "+10% атаки",
    },
    {
      id: "defense",
      name: "Кільце Захисту",
      icon: "🛡️",
      bonus: "+10% броні",
    },
    {
      id: "resurrection",
      name: "Кільце Відродження",
      icon: "💠",
      bonus: "Шанс воскресіння",
    },
  ];

  const panels = [
    {
      id: "trophies",
      icon: "🏆",
      title: "Трофеї",
      value: "12",
      description: "Особисті трофеї",
    },
    {
      id: "achievements",
      icon: "🏅",
      title: "Досягнення",
      value: "8/50",
      description: "Виконані досягнення",
    },
    {
      id: "collection",
      icon: "📚",
      title: "Колекція",
      value: "24",
      description: "Зібрані предмети",
    },
    {
      id: "equipment",
      icon: "⚔️",
      title: "Спорядження",
      value: "8/8",
      description: "Руни • Заточки • Бонус • Амулет",
    },
    {
      id: "pet",
      icon: "🐺",
      title: "Пет",
      value: "Lv. 3",
      description: "+85 до мощі",
      action: "pets",
    },
    {
      id: "skills",
      icon: "🔥",
      title: "Навички",
      value: "6/6",
      description: "Купівля та покращення навичок",
    },
    {
      id: "bag",
      icon: "🎒",
      title: "Сумка",
      value: "18/40",
      description: "Спорядження • Продаж",
      action: "inventory",
    },
    {
      id: "chest",
      icon: "📦",
      title: "Скриня",
      value: "14",
      description: "Зілля • Ресурси",
    },
    {
      id: "training",
      icon: "💪",
      title: "Тренування",
      value: "Майстерність 4",
      description: "Сила • Життя • Броня • Удача • Енергія",
    },
    {
      id: "boosts",
      icon: "✨",
      title: "Посилення",
      value: "3 активні",
      description: "Благословення • Еліксири • Бонуси",
    },
    {
      id: "xp",
      icon: "⭐",
      title: "Рівень",
      value: `Рівень ${hero.level}`,
      description: "Досвід героя",
    },
    {
      id: "colosseum",
      icon: "🏟️",
      title: "Колізей",
      value: "1250",
      description: "Рейтинг Колізею",
      action: "arena",
    },
    {
      id: "league",
      icon: "🏆",
      title: "Ліга",
      value: "Бронза III",
      description: "Поточна ліга",
    },
    {
      id: "tournaments",
      icon: "⚡",
      title: "Турніри",
      value: "2",
      description: "Доступні події",
      action: "arena",
    },
  ];

  function handlePanelClick(panel) {
    if (panel.action) {
      navigateTo?.(panel.action);
      return;
    }

    /*
     * Поки окремі сторінки ще не готові,
     * показуємо невелике повідомлення.
     */
    alert(`${panel.title}: розділ буде відкрито після його створення.`);
  }

  return (
    <div style={styles.page}>
      {/* ================= TOP HERO STATUS ================= */}

      <section style={styles.topStatus}>
        <div style={styles.statusHero}>
          <div style={styles.miniAvatar}>
            {player.avatar ? (
              <img
                src={player.avatar}
                alt={player.name}
                style={styles.avatarImage}
              />
            ) : (
              "⚔️"
            )}
          </div>

          <div style={styles.statusBars}>
            <div style={styles.statusRow}>
              <span>❤️</span>

              <div style={styles.bar}>
                <div
                  style={{
                    ...styles.hpBar,
                    width: `${hpPercent}%`,
                  }}
                />
              </div>

              <span style={styles.statusNumber}>
                {hero.hp}/{hero.maxHp}
              </span>
            </div>

            <div style={styles.statusRow}>
              <span>⚡</span>

              <div style={styles.bar}>
                <div
                  style={{
                    ...styles.energyBar,
                    width: `${energyPercent}%`,
                  }}
                />
              </div>

              <span style={styles.statusNumber}>
                {hero.energy}/{hero.maxEnergy}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= XP ================= */}

      <div style={styles.xpWrapper}>
        <div style={styles.xpBar}>
          <div
            style={{
              ...styles.xpFill,
              width: `${xpPercent}%`,
            }}
          />
        </div>
      </div>

      {/* ================= HERO HEADER ================= */}

      <section style={styles.heroHeader}>
        <h1 style={styles.heroName}>{hero.name}</h1>

        <div style={styles.heroMeta}>
          Рівень {hero.level} • {hero.type}
        </div>

        <div style={styles.powerBox}>
          <span style={styles.powerIcon}>⚔️</span>
          <span>Мощь героя</span>
          <strong>{hero.power.toLocaleString("uk-UA")}</strong>
        </div>
      </section>

      {/* ================= HERO EQUIPMENT ================= */}

      <section style={styles.heroStage}>
        <div style={styles.equipmentLayout}>
          {/* LEFT */}

          <div style={styles.equipmentColumn}>
            <EquipmentSlot icon="🪖" label="Шолом" />
            <EquipmentSlot icon="⚔️" label="Права рука" />
            <EquipmentSlot icon="🛡️" label="Броня" />
            <EquipmentSlot icon="👖" label="Штани" />
          </div>

          {/* CENTER HERO */}

          <div style={styles.heroImageWrapper}>
            <div style={styles.heroGlow} />

            <div style={styles.heroImage}>
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={hero.name}
                  style={styles.heroAvatarImage}
                />
              ) : (
                <div style={styles.heroPlaceholder}>
                  ⚔️
                </div>
              )}
            </div>

            <div style={styles.heroBadge}>
              {hero.type}
            </div>
          </div>

          {/* RIGHT */}

          <div style={styles.equipmentColumn}>
            <EquipmentSlot icon="🛡️" label="Наплічники" />
            <EquipmentSlot icon="⚔️" label="Ліва рука" />
            <EquipmentSlot icon="🧤" label="Рукавички" />
            <EquipmentSlot icon="🥾" label="Чоботи" />
          </div>
        </div>

        {/* RINGS */}

        <div style={styles.ringsTitle}>
          КІЛЬЦЯ
        </div>

        <div style={styles.ringsRow}>
          {rings.map((ring) => {
            const active = selectedRing === ring.id;

            return (
              <button
                key={ring.id}
                onClick={() => setSelectedRing(ring.id)}
                style={{
                  ...styles.ring,
                  ...(active ? styles.ringActive : {}),
                }}
              >
                <span style={styles.ringIcon}>
                  {ring.icon}
                </span>

                <span style={styles.ringName}>
                  {ring.name.replace("Кільце ", "")}
                </span>

                {active && (
                  <span style={styles.ringSelected}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={styles.ringInfo}>
          <strong>
            {rings.find(
              (ring) => ring.id === selectedRing
            )?.name}
          </strong>

          <span>
            {
              rings.find(
                (ring) => ring.id === selectedRing
              )?.bonus
            }
          </span>
        </div>
      </section>

      {/* ================= QUICK STATS ================= */}

      <section style={styles.statsCard}>
        <div style={styles.stat}>
          <span>💪</span>
          <small>Сила</small>
          <strong>{hero.strength}</strong>
        </div>

        <div style={styles.stat}>
          <span>❤️</span>
          <small>Життя</small>
          <strong>{hero.life}</strong>
        </div>

        <div style={styles.stat}>
          <span>🛡️</span>
          <small>Броня</small>
          <strong>{hero.armor}</strong>
        </div>

        <div style={styles.stat}>
          <span>🍀</span>
          <small>Удача</small>
          <strong>{hero.luck}</strong>
        </div>
      </section>

      {/* ================= PET ================= */}

      <section style={styles.petCard}>
        <div style={styles.petImage}>
          🐺
        </div>

        <div style={styles.petInfo}>
          <div style={styles.petTitle}>
            Вірний супутник
          </div>

          <strong>Тіньовий вовк</strong>

          <div style={styles.petMeta}>
            Рівень 3 • +85 мощі
          </div>
        </div>

        <button
          style={styles.smallButton}
          onClick={() => navigateTo?.("pets")}
        >
          Пети
        </button>
      </section>

      {/* ================= PANELS ================= */}

      <section style={styles.panelsSection}>
        <div style={styles.sectionTitle}>
          МОЇ СИСТЕМИ
        </div>

        <div style={styles.panelGrid}>
          {panels.map((panel) => (
            <button
              key={panel.id}
              style={styles.panel}
              onClick={() => handlePanelClick(panel)}
            >
              <div style={styles.panelIcon}>
                {panel.icon}
              </div>

              <div style={styles.panelContent}>
                <div style={styles.panelTitle}>
                  {panel.title}
                </div>

                <strong style={styles.panelValue}>
                  {panel.value}
                </strong>

                <span style={styles.panelDescription}>
                  {panel.description}
                </span>
              </div>

              <span style={styles.panelArrow}>
                ›
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ================= RESOURCES ================= */}

      <section style={styles.resourcesCard}>
        <div style={styles.resource}>
          <span>🪙</span>
          <small>Золото</small>
          <strong>
            {player.gold.toLocaleString("uk-UA")}
          </strong>
        </div>

        <div style={styles.resource}>
          <span>💎</span>
          <small>Кристали</small>
          <strong>
            {player.crystals.toLocaleString("uk-UA")}
          </strong>
        </div>

        <div style={styles.resource}>
          <span>⭐</span>
          <small>Рівень</small>
          <strong>{player.level}</strong>
        </div>
      </section>

      {/* ================= BOTTOM GAME LINKS ================= */}

      <section style={styles.linksCard}>
        <button onClick={() => alert("Форум буде додано.")}>
          💬 Форум
        </button>

        <button onClick={() => alert("Чат буде додано.")}>
          🗨️ Чат
        </button>

        <button onClick={() => navigateTo?.("ranking")}>
          🏆 Рейтинг
        </button>
      </section>
    </div>
  );
}

/* ============================================================
   EQUIPMENT SLOT
============================================================ */

function EquipmentSlot({ icon, label }) {
  return (
    <button
      style={styles.equipmentSlot}
      onClick={() =>
        alert(`${label}: слот спорядження`)
      }
    >
      <span style={styles.equipmentIcon}>
        {icon}
      </span>

      <span style={styles.equipmentLabel}>
        {label}
      </span>
    </button>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = {
  page: {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
    paddingBottom: "25px",
  },

  topStatus: {
    background: "#170d1a",
    border: "1px solid #42243e",
    borderRadius: "12px",
    padding: "8px",
  },

  statusHero: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  miniAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "8px",
    background: "#28101f",
    border: "1px solid #6e3155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    fontSize: "20px",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  statusBars: {
    flex: 1,
  },

  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    margin: "3px 0",
    fontSize: "11px",
  },

  bar: {
    flex: 1,
    height: "6px",
    background: "#271923",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid #42243e",
  },

  hpBar: {
    height: "100%",
    background:
      "linear-gradient(90deg, #8d1e45, #e84c82)",
    borderRadius: "20px",
    transition: "width .3s",
  },

  energyBar: {
    height: "100%",
    background:
      "linear-gradient(90deg, #246b9b, #56c7ff)",
    borderRadius: "20px",
    transition: "width .3s",
  },

  statusNumber: {
    width: "65px",
    textAlign: "right",
    fontSize: "9px",
    opacity: 0.7,
  },

  xpWrapper: {
    padding: "5px 2px",
  },

  xpBar: {
    width: "100%",
    height: "3px",
    background: "#2c1928",
    borderRadius: "10px",
    overflow: "hidden",
  },

  xpFill: {
    height: "100%",
    background:
      "linear-gradient(90deg, #9b2c68, #e84c82)",
    borderRadius: "10px",
  },

  heroHeader: {
    textAlign: "center",
    padding: "8px 0 12px",
  },

  heroName: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 900,
    letterSpacing: ".3px",
  },

  heroMeta: {
    marginTop: "3px",
    fontSize: "11px",
    opacity: 0.55,
  },

  powerBox: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    marginTop: "8px",
    padding: "6px 12px",
    borderRadius: "20px",
    background: "#26111e",
    border: "1px solid #5a2848",
    fontSize: "11px",
  },

  powerIcon: {
    fontSize: "14px",
  },

  heroStage: {
    background:
      "radial-gradient(circle at center, #3a162c 0%, #1b0c18 48%, #120811 100%)",
    border: "1px solid #42243e",
    borderRadius: "15px",
    padding: "12px",
    boxShadow:
      "inset 0 0 50px rgba(232,76,130,.05)",
  },

  equipmentLayout: {
    display: "grid",
    gridTemplateColumns: "72px 1fr 72px",
    gap: "8px",
    alignItems: "center",
  },

  equipmentColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  equipmentSlot: {
    minHeight: "58px",
    borderRadius: "10px",
    border: "1px solid #513047",
    background: "#21101d",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: "4px",
  },

  equipmentIcon: {
    fontSize: "24px",
    lineHeight: 1,
  },

  equipmentLabel: {
    fontSize: "7px",
    opacity: 0.6,
    marginTop: "4px",
    textAlign: "center",
  },

  heroImageWrapper: {
    position: "relative",
    height: "310px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  heroGlow: {
    position: "absolute",
    width: "210px",
    height: "260px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(232,76,130,.20), transparent 70%)",
    filter: "blur(10px)",
  },

  heroImage: {
    position: "relative",
    width: "190px",
    height: "270px",
    borderRadius: "18px",
    border: "1px solid #713558",
    background:
      "linear-gradient(180deg, #35162b, #170b15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow:
      "0 15px 40px rgba(0,0,0,.45)",
  },

  heroAvatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  heroPlaceholder: {
    fontSize: "100px",
    filter: "drop-shadow(0 10px 15px rgba(0,0,0,.5))",
  },

  heroBadge: {
    position: "absolute",
    bottom: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(10,5,10,.85)",
    border: "1px solid #6e3155",
    borderRadius: "20px",
    padding: "5px 12px",
    fontSize: "9px",
    fontWeight: 800,
  },

  ringsTitle: {
    textAlign: "center",
    fontSize: "9px",
    letterSpacing: "2px",
    opacity: 0.5,
    marginTop: "8px",
  },

  ringsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "6px",
  },

  ring: {
    position: "relative",
    width: "76px",
    height: "65px",
    borderRadius: "10px",
    border: "1px solid #4a2a43",
    background: "#1d0d19",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  ringActive: {
    border: "1px solid #e84c82",
    background: "rgba(232,76,130,.13)",
    boxShadow:
      "0 0 15px rgba(232,76,130,.15)",
  },

  ringIcon: {
    fontSize: "23px",
  },

  ringName: {
    fontSize: "8px",
    opacity: 0.75,
    marginTop: "3px",
  },

  ringSelected: {
    position: "absolute",
    right: "4px",
    top: "3px",
    color: "#e84c82",
    fontWeight: 900,
  },

  ringInfo: {
    marginTop: "8px",
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    fontSize: "10px",
    opacity: 0.8,
  },

  statsCard: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "5px",
    marginTop: "10px",
    padding: "8px",
    borderRadius: "12px",
    background: "#170d1a",
    border: "1px solid #42243e",
  },

  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    padding: "5px 2px",
  },

  petCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "10px",
    padding: "10px",
    borderRadius: "12px",
    background: "#170d1a",
    border: "1px solid #42243e",
  },

  petImage: {
    width: "52px",
    height: "52px",
    borderRadius: "10px",
    background: "#291321",
    border: "1px solid #61304d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
  },

  petInfo: {
    flex: 1,
    minWidth: 0,
  },

  petTitle: {
    fontSize: "9px",
    opacity: 0.5,
  },

  petMeta: {
    fontSize: "9px",
    opacity: 0.6,
    marginTop: "3px",
  },

    smallButton: {
    border: "1px solid #6d3155",
    background: "#291321",
    color: "#fff",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "10px",
    cursor: "pointer",
  },

  panelsSection: {
    marginTop: "14px",
  },

  sectionTitle: {
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1.5px",
    opacity: 0.5,
    marginBottom: "7px",
  },

  panelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "7px",
  },

  panel: {
    minHeight: "72px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    borderRadius: "11px",
    border: "1px solid #42243e",
    background: "#170d1a",
    color: "#fff",
    textAlign: "left",
    cursor: "pointer",
  },

  panelIcon: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    borderRadius: "9px",
    background: "#28101f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  panelContent: {
    flex: 1,
    minWidth: 0,
  },

  panelTitle: {
    fontSize: "10px",
    fontWeight: 800,
  },

  panelValue: {
    display: "block",
    fontSize: "11px",
    color: "#e84c82",
    marginTop: "2px",
  },

  panelDescription: {
    display: "block",
    fontSize: "7px",
    opacity: 0.45,
    marginTop: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  panelArrow: {
    fontSize: "20px",
    opacity: 0.3,
  },

  resourcesCard: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    marginTop: "10px",
    borderRadius: "12px",
    background: "#170d1a",
    border: "1px solid #42243e",
    overflow: "hidden",
  },

  resource: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 5px",
    borderRight: "1px solid #42243e",
    gap: "2px",
  },

  linksCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "14px",
    marginTop: "10px",
    borderTop: "1px solid #42243e",
    background: "#170d1a",
    borderRadius: "10px",
  },
};
