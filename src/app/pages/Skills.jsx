import { useMemo, useState } from "react";

const QUALITIES = [
  { name: "Обычное", color: "#b8b8b8" },
  { name: "Обычное+", color: "#d7e0d8" },
  { name: "Редкое", color: "#4e9cff" },
  { name: "Редкое+", color: "#4ed7df" },
  { name: "Эпическое", color: "#b76cff" },
  { name: "Эпическое+", color: "#e27cff" },
  { name: "Легендарное", color: "#ffbd45" },
];

const SKILL_DATA = [
  {
    id: "titan_rage",
    icon: "🔥",
    name: "Ярость титана",
    description: "Увеличивает наносимый тобой урон.",
    stat: "damage",
    values: [33, 41, 49, 57, 65, 73, 81],
    chances: [5, 8, 11, 14, 17, 20, 23],
    unit: "%",
    sign: "+",
  },
  {
    id: "strong_armor",
    icon: "🛡️",
    name: "Крепкая броня",
    description: "Снижает урон, получаемый от противника.",
    stat: "damage_reduction",
    values: [33, 41, 49, 57, 65, 73, 81],
    chances: [5, 8, 11, 14, 17, 20, 23],
    unit: "%",
    sign: "−",
  },
  {
    id: "crit_whirlwind",
    icon: "🌪️",
    name: "Вихрь критов",
    description: "Увеличивает дополнительный критический урон.",
    stat: "critical_damage",
    values: [9, 13, 17, 21, 25, 29, 33],
    chances: [20, 25, 30, 35, 40, 45, 50],
    unit: "%",
    sign: "+",
  },
  {
    id: "defensive_stance",
    icon: "🛡️",
    name: "Защитная стойка",
    description: "Снижает урон, получаемый от критических ударов.",
    stat: "critical_reduction",
    values: [24, 28, 32, 36, 40, 44, 48],
    chances: [5, 10, 15, 20, 25, 30, 35],
    unit: "%",
    sign: "−",
  },
  {
    id: "vampirism",
    icon: "🩸",
    name: "Вампиризм",
    description: "Похищает часть здоровья противника. Работает на Арене, в Пещере и Долине бессмертных.",
    stat: "life_steal",
    values: [4, 6, 8, 10, 12, 14, 16],
    chances: [5, 6.5, 8, 9.5, 11, 12.5, 14],
    unit: "%",
    sign: "+",
  },
  {
    id: "fortune",
    icon: "🍀",
    name: "Фортуна",
    description: "Повышает награду при срабатывании. Действует в доступных игровых активностях.",
    stat: "rewards",
    values: [14, 20, 26, 32, 38, 44, 50],
    chances: [10, 12.5, 15, 17.5, 20, 22.5, 25],
    unit: "%",
    sign: "+",
  },
];

// Стоимость улучшения Фортуны по уровням 1–30, в золоте.
const FORTUNE_GOLD_COSTS = [
  10, 20, 30, 40, 50, 30, 60, 90, 120, 150,
  90, 180, 270, 360, 450, 330, 670, 1010, 1350, 1680,
  1000, 2000, 3000, 4000, 5000, 3000, 6000, 9000, 12000, 15000,
];

// Для остальных умений пока задана временная цена в серебре.
// Заменим её на точную таблицу, когда согласуем неоднозначные значения.
function getSilverCost(nextLevel) {
  const silverCosts = [
    100, 2000, 4000, 6000, 8000,
    300, 10000, 12000, 14000, 16000,
    900, 18000, 20000, 22000, 24000,
    2000, 26000, 28000, 30000, 32000,
    5000, 34000, 36000, 38000, 40000,
    20000, 30000, 40000, 50000, 60000,
  ];
  return silverCosts[nextLevel - 1] ?? 60000;
}

function getQualityIndex(level) {
  if (level <= 0) return 0;
  if (level >= 30) return 6;
  if (level >= 26) return 5;
  return Math.min(4, Math.floor((level - 1) / 5));
}

function formatNumber(value) {
  return Number(value).toLocaleString("ru-RU");
}

function getCost(skill, nextLevel) {
  if (skill.id === "fortune") {
    return { amount: FORTUNE_GOLD_COSTS[nextLevel - 1], currency: "золота", icon: "🪙" };
  }
  return { amount: getSilverCost(nextLevel), currency: "серебра", icon: "⚪" };
}

export default function Skills({ profile, player, onNavigate }) {
  const [levels, setLevels] = useState({
    titan_rage: 0,
    strong_armor: 0,
    crit_whirlwind: 0,
    defensive_stance: 0,
    vampirism: 0,
    fortune: 0,
  });
  const [notice, setNotice] = useState("");

  const currentPlayer = player || profile || {};
  const playerLevel = Number(currentPlayer.level || 1);
  const gold = Number(currentPlayer.gold || 0);

  const skills = useMemo(
    () =>
      SKILL_DATA.map((skill) => {
        const level = Math.max(0, Math.min(30, levels[skill.id] || 0));
        const qualityIndex = level === 0 ? 0 : getQualityIndex(level);
        const currentQuality = QUALITIES[qualityIndex];
        const nextLevel = Math.min(30, level + 1);
        const cost = level < 30 ? getCost(skill, nextLevel) : null;

        return {
          ...skill,
          level,
          qualityIndex,
          currentQuality,
          nextLevel,
          cost,
          value: skill.values[qualityIndex],
          chance: skill.chances[qualityIndex],
        };
      }),
    [levels]
  );

  function handleUpgrade(skill) {
    if (playerLevel < 5) {
      setNotice("Умения открываются с 5-го уровня героя.");
      return;
    }
    if (skill.level >= 30) {
      setNotice(`${skill.name}: максимальный уровень уже достигнут.`);
      return;
    }

    setNotice(
      `Показан следующий уровень «${skill.name}». Реальное списание ресурсов и сохранение подключим через Supabase.`
    );
    // Не повышаем уровень локально: до интеграции с сервером это выглядело бы
    // как сохранённое улучшение, хотя покупка ещё не проведена.
  }

  return (
    <main style={styles.page}>
      <div style={styles.topLine}>
        <button type="button" style={styles.backButton} onClick={() => onNavigate?.("hero")}>
          ‹ Герой
        </button>
        <span style={styles.pageTag}>РАЗВИТИЕ</span>
      </div>

      <header style={styles.header}>
        <div style={styles.headerIcon}>⚔️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={styles.title}>Умения</h1>
          <p style={styles.subtitle}>Умения помогают побеждать в боях</p>
        </div>
      </header>

      <section style={styles.resourceBar}>
        <div style={styles.resource}>
          <span style={styles.resourceIcon}>🪙</span>
          <div>
            <small style={styles.resourceLabel}>Золото</small>
            <strong>{formatNumber(gold)}</strong>
          </div>
        </div>
        <div style={styles.resourceDivider} />
        <div style={styles.resource}>
          <span style={styles.resourceIcon}>⚔️</span>
          <div>
            <small style={styles.resourceLabel}>Умений</small>
            <strong>6 навыков</strong>
          </div>
        </div>
      </section>

      {playerLevel < 5 && (
        <div style={styles.lockNotice}>
          🔒 Умения откроются на 5-м уровне героя. Текущий уровень: {playerLevel}.
        </div>
      )}

      {notice && (
        <div role="status" style={styles.notice}>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} style={styles.noticeClose}>×</button>
        </div>
      )}

      <div style={styles.sectionHeading}>
        <span>ТВОИ УМЕНИЯ</span>
        <span style={styles.headingCount}>6 / 6</span>
      </div>

      <div style={styles.skillList}>
        {skills.map((skill) => {
          const maxed = skill.level >= 30;
          const progress = (skill.level / 30) * 100;
          const nextQualityIndex = maxed
            ? skill.qualityIndex
            : getQualityIndex(skill.nextLevel);
          const nextQuality = QUALITIES[nextQualityIndex];

          return (
            <article key={skill.id} style={styles.skillCard}>
              <div style={styles.cardTop}>
                <div style={{ ...styles.skillIcon, borderColor: skill.currentQuality.color }}>
                  <span>{skill.icon}</span>
                  <i style={{ ...styles.rarityDot, background: skill.currentQuality.color }} />
                </div>
                <div style={styles.skillInfo}>
                  <div style={styles.skillTitleRow}>
                    <h2 style={styles.skillName}>{skill.name}</h2>
                    <span style={{ ...styles.qualityBadge, color: skill.currentQuality.color, borderColor: skill.currentQuality.color }}>
                      {skill.currentQuality.name}
                    </span>
                  </div>
                  <p style={styles.description}>{skill.description}</p>
                </div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>ЭФФЕКТ</span>
                  <strong style={{ ...styles.statValue, color: skill.currentQuality.color }}>
                    {skill.sign}{skill.value}{skill.unit}
                  </strong>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>ШАНС СРАБАТЫВАНИЯ</span>
                  <strong style={styles.chanceValue}>{skill.chance}%</strong>
                </div>
                <div style={styles.statBox}>
                  <span style={styles.statLabel}>УРОВЕНЬ</span>
                  <strong style={styles.levelValue}>{skill.level}<span>/30</span></strong>
                </div>
              </div>

              <div style={styles.progressArea}>
                <div style={styles.progressLabels}>
                  <span>Прогресс умения</span>
                  <span>{skill.level} из 30</span>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${progress}%`, background: `linear-gradient(90deg, ${skill.currentQuality.color}, #f3c86a)` }} />
                </div>
                <div style={styles.qualitySteps}>
                  {QUALITIES.map((quality, index) => (
                    <span
                      key={quality.name}
                      title={quality.name}
                      style={{
                        ...styles.qualityStep,
                        background: index <= skill.qualityIndex ? quality.color : "#342e28",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={styles.cardBottom}>
                <div style={styles.nextInfo}>
                  {maxed ? (
                    <>
                      <span style={styles.maxedIcon}>✦</span>
                      <span style={styles.maxedText}>Максимальный уровень</span>
                    </>
                  ) : (
                    <>
                      <span style={styles.nextLabel}>Следующее улучшение</span>
                      <strong style={{ ...styles.nextQuality, color: nextQuality.color }}>
                        {nextQuality.name} · ур. {skill.nextLevel}
                      </strong>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  disabled={maxed || playerLevel < 5}
                  onClick={() => handleUpgrade(skill)}
                  style={{
                    ...styles.upgradeButton,
                    ...(maxed || playerLevel < 5 ? styles.upgradeDisabled : {}),
                  }}
                >
                  <span>{maxed ? "МАКС." : "Улучшить"}</span>
                  {!maxed && (
                    <strong>
                      {skill.cost.icon} {formatNumber(skill.cost.amount)}
                    </strong>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div style={styles.footerNote}>
        <span>✧</span>
        Все умения срабатывают автоматически в подходящих боях. Шанс и сила эффекта зависят от качества умения.
      </div>
    </main>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    padding: "12px 12px 26px",
    boxSizing: "border-box",
    color: "#eee4d2",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  topLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    color: "#d8b777",
    background: "transparent",
    border: "1px solid #493a2b",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  pageTag: {
    color: "#8f8068",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 13px",
    background: "linear-gradient(135deg, #2b2118, #1b1713)",
    border: "1px solid #59432b",
    borderRadius: 12,
    marginBottom: 10,
  },
  headerIcon: {
    width: 46,
    height: 46,
    flex: "0 0 46px",
    display: "grid",
    placeItems: "center",
    borderRadius: 12,
    fontSize: 25,
    background: "linear-gradient(145deg, #62451f, #2b2117)",
    border: "1px solid #99723b",
  },
  title: {
    fontSize: 22,
    lineHeight: 1.1,
    margin: "0 0 5px",
    color: "#f2d39a",
  },
  subtitle: {
    margin: 0,
    color: "#b7a993",
    fontSize: 12,
    lineHeight: 1.4,
  },
  resourceBar: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "11px 13px",
    marginBottom: 15,
    background: "#191612",
    border: "1px solid #3d3226",
    borderRadius: 10,
  },
  resource: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  resourceIcon: { fontSize: 21 },
  resourceLabel: {
    display: "block",
    color: "#91836e",
    fontSize: 10,
    marginBottom: 3,
  },
  resourceDivider: { height: 30, width: 1, background: "#403428" },
  lockNotice: {
    padding: 12,
    borderRadius: 9,
    border: "1px solid #75572a",
    background: "#2c2113",
    color: "#edc780",
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  notice: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    padding: 11,
    borderRadius: 9,
    border: "1px solid #6b532c",
    background: "#2a2116",
    color: "#f0d49a",
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  noticeClose: {
    color: "#f0d49a",
    background: "transparent",
    border: 0,
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
  },
  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#b5a17e",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.7,
    padding: "0 3px 9px",
  },
  headingCount: {
    letterSpacing: 0,
    color: "#7e705d",
    fontSize: 11,
  },
  skillList: { display: "flex", flexDirection: "column", gap: 10 },
  skillCard: {
    background: "linear-gradient(160deg, #211c17, #171411)",
    border: "1px solid #403326",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,.12)",
  },
  cardTop: { display: "flex", alignItems: "flex-start", gap: 10 },
  skillIcon: {
    position: "relative",
    width: 47,
    height: 47,
    flex: "0 0 47px",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(145deg, #393025, #211b15)",
    border: "1px solid",
    borderRadius: 10,
    fontSize: 25,
    boxSizing: "border-box",
  },
  rarityDot: {
    position: "absolute",
    width: 7,
    height: 7,
    right: 3,
    bottom: 3,
    borderRadius: "50%",
    border: "1px solid #171411",
  },
  skillInfo: { minWidth: 0, flex: 1 },
  skillTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
    flexWrap: "wrap",
  },
  skillName: {
    margin: "1px 0 3px",
    fontSize: 15,
    lineHeight: 1.25,
    color: "#f0e3cf",
  },
  qualityBadge: {
    border: "1px solid",
    borderRadius: 5,
    padding: "3px 5px",
    fontSize: 9,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  description: {
    margin: "3px 0 0",
    fontSize: 11,
    lineHeight: 1.45,
    color: "#a99c89",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1.3fr .7fr",
    gap: 6,
    marginTop: 12,
    padding: "9px 8px",
    borderRadius: 8,
    background: "#15120f",
    border: "1px solid #30271f",
  },
  statBox: { display: "flex", flexDirection: "column", gap: 5, minWidth: 0 },
  statLabel: {
    color: "#827562",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 0.6,
    lineHeight: 1.3,
  },
  statValue: { fontSize: 17, lineHeight: 1.1 },
  chanceValue: { fontSize: 15, color: "#e4d6bf", lineHeight: 1.1 },
  levelValue: { fontSize: 15, color: "#e4d6bf", lineHeight: 1.1 },
  progressArea: { marginTop: 11 },
  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    color: "#948570",
    fontSize: 10,
    marginBottom: 6,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    overflow: "hidden",
    borderRadius: 6,
    background: "#393027",
    border: "1px solid #46372a",
    boxSizing: "border-box",
  },
  progressFill: { height: "100%", borderRadius: 6, transition: "width .2s ease" },
  qualitySteps: { display: "flex", gap: 3, marginTop: 5 },
  qualityStep: { height: 3, flex: 1, borderRadius: 3 },
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTop: "1px solid #352a20",
  },
  nextInfo: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  nextLabel: { color: "#847561", fontSize: 9 },
  nextQuality: { fontSize: 11, lineHeight: 1.3 },
  maxedIcon: { color: "#ffca66", fontSize: 15 },
  maxedText: { color: "#ffca66", fontSize: 11, fontWeight: 700 },
  upgradeButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 108,
    padding: "9px 10px",
    color: "#271a0b",
    background: "linear-gradient(180deg, #f2ca76, #c18a36)",
    border: "1px solid #f6d995",
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "inset 0 1px rgba(255,255,255,.22)",
  },
  upgradeDisabled: {
    color: "#8b7e6c",
    background: "#302920",
    borderColor: "#494034",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  footerNote: {
    display: "flex",
    gap: 9,
    alignItems: "flex-start",
    marginTop: 14,
    padding: 12,
    color: "#9c8d76",
    fontSize: 11,
    lineHeight: 1.55,
    background: "#191612",
    border: "1px solid #342a20",
    borderRadius: 9,
  },
};
