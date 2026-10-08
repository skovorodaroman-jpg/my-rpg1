import { useMemo, useState } from "react";

const TRAINING_PRICES = [
  100,
  200,
  300,
  400,
  500,
  1,
  800,
  1600,
  2400,
  3200,
  4000,
  5,
  1200,
  2400,
  3600,
  4800,
  6000,
  10,
  1600,
  3200,
  4800,
  6400,
  8000,
  15,
  2000,
  4000,
  6000,
  8000,
  10000,
  20,
  2400,
  4800,
  7200,
  9600,
  12800,
  16000,
  35,
  3600,
  7200,
  10800,
  14400,
  18000,
  40,
  4000,
  8000,
  12000,
  16000,
  20000,
  45,
  25000,
  30000,
  35000,
  40000,
  45000,
  50,
  52500,
  60000,
  67500,
  75000,
  82500,
  55,
  92500,
  102500,
  112500,
  122500,
  132500,
  60,
  147500,
  162500,
  177500,
  192500,
  200000,
  100,
  200000,
  250000,
  275000,
  300000,
  325000,
  150,
  350000,
  400000,
  450000,
  500000,
  550000,
  250,
  1000000,
  1200000,
  1400000,
  1600000,
  1900000,
  500,
  2000000,
  2200000,
  2400000,
  2600000,
  2900000,
  1000,
  3000000,
  3200000,
  3400000,
  3600000,
  3900000,
  1500,
];

const INITIAL_STATS = {
  strength: {
    name: "Сила",
    icon: "🛡️",
    value: 0,
    type: "silver",
    description: "Чем больше сила, тем больше урона нанесешь врагу!",
  },

  health: {
    name: "Жизни",
    icon: "🔴",
    value: 0,
    type: "silver",
    description: "Здоровья много не бывает.",
  },

  luck: {
    name: "Удача",
    icon: "🎯",
    value: 0,
    type: "silver",
    description: "Увеличивает шанс на крит. удар.",
  },

  armor: {
    name: "Броня",
    icon: "🛡️",
    value: 0,
    type: "silver",
    description: "Поглощает урон врага.",
  },

  energy: {
    name: "Энергия",
    icon: "🔮",
    value: 0,
    type: "silver",
    description: "Увеличивает запас энергии.",
  },
};

function formatNumber(value) {
  return new Intl.NumberFormat("uk-UA").format(value);
}

function formatPrice(value, isGold) {
  return `${isGold ? "🟡" : "⚪"} ${formatNumber(value)}`;
}

function getStepBonus(statKey, step) {
  if (step % 6 === 0) {
    return statKey === "energy" ? 10 : 3;
  }

  return statKey === "energy" ? 5 : 1;
}

function getStatTotal(statKey, steps) {
  let total = 0;

  for (let i = 1; i <= steps; i++) {
    total += getStepBonus(statKey, i);
  }

  return total;
}

function getMastery(stats) {
  return Object.values(stats).reduce(
    (sum, stat) => sum + stat.value,
    0
  );
}

function getCurrencyCost(step) {
  return TRAINING_PRICES[step - 1] || 0;
}

function isGoldStep(step) {
  return step % 6 === 0;
}

function getStatDisplay(statKey, value) {
  if (statKey === "strength") {
    const min = Math.round(value * 0.161);
    const max = Math.round(value * 0.23);

    return `урон ${formatNumber(min)} - ${formatNumber(max)}`;
  }

  if (statKey === "health") {
    return `${formatNumber(value * 2)}`;
  }

  if (statKey === "luck") {
    const crit = Math.min(100, Math.round(value * 0.005));

    return `${crit}% крит`;
  }

  if (statKey === "armor") {
    const absorption = Math.min(80, Math.round(value * 0.0028));

    return `поглощение урона ${absorption}%`;
  }

  return "";
}

export default function Training({ profile, player, onNavigate }) {
  const [silver, setSilver] = useState(34224);
  const [gold, setGold] = useState(120);

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("chronicles_training");

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STATS;
      }
    }

    return INITIAL_STATS;
  });

  const mastery = useMemo(
    () => getMastery(stats),
    [stats]
  );

  const upgrade = (statKey) => {
    const stat = stats[statKey];

    if (stat.value >= 114) return;

    const nextStep = stat.value + 1;
    const price = getCurrencyCost(nextStep);
    const goldStep = isGoldStep(nextStep);

    if (goldStep && gold < price) {
      alert("Недостаточно золота!");
      return;
    }

    if (!goldStep && silver < price) {
      alert("Недостаточно серебра!");
      return;
    }

    const newStats = {
      ...stats,
      [statKey]: {
        ...stat,
        value: nextStep,
      },
    };

    setStats(newStats);

    localStorage.setItem(
      "chronicles_training",
      JSON.stringify(newStats)
    );

    if (goldStep) {
      setGold((current) => current - price);
    } else {
      setSilver((current) => current - price);
    }
  };

  const resetDemo = () => {
    setStats(INITIAL_STATS);
    localStorage.removeItem("chronicles_training");
  };

  const trainingCards = Object.entries(stats);

  const heroLevel = player?.level || profile?.level || 1;

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.title}>
          🏋️ ТРЕНИРОВКА 🏋️
        </div>

        <div style={styles.resources}>
          <span>⚪ {formatNumber(silver)}</span>
          <span>🟡 {formatNumber(gold)}</span>
          <span>🏆 Мастерство: {formatNumber(mastery)}</span>
        </div>
      </div>

      {/* BACK */}
      <button
        style={styles.backButton}
        onClick={() => onNavigate?.("hero")}
      >
        ← Мой герой
      </button>

      {/* INTRO */}
      <div style={styles.intro}>
        <div style={styles.introTitle}>
          Улучшай параметры своего героя!
        </div>

        <div style={styles.arena}>
          <div style={styles.arenaIcon}>
            ⚔️
          </div>

          <div style={styles.arenaText}>
            АРЕНА
            <span>Бойцы на тренировке</span>
          </div>

          <div style={styles.arenaIcon}>
            🛡️
          </div>
        </div>
      </div>

      {/* TRAINING */}
      <div style={styles.trainingList}>

        {trainingCards.map(([key, stat]) => {
          const step = stat.value;
          const nextStep = step + 1;
          const completed = step >= 114;

          const price = completed
            ? 0
            : getCurrencyCost(nextStep);

          const goldStep = !completed && isGoldStep(nextStep);

          const progress = Math.round(
            (step / 114) * 100
          );

          const currentValue = getStatTotal(
            key,
            step
          );

          const bonus = completed
            ? 0
            : getStepBonus(key, nextStep);

          return (
            <div
              key={key}
              style={styles.card}
            >

              <div style={styles.statHeader}>
                <div>
                  <div style={styles.statName}>
                    {stat.icon} {stat.name}
                  </div>

                  <div style={styles.statValue}>
                    {formatNumber(currentValue)}

                    {getStatDisplay(
                      key,
                      currentValue
                    ) && (
                      <span>
                        {" "}
                        (
                        {getStatDisplay(
                          key,
                          currentValue
                        )}
                        )
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.steps}>
                  {step}/114
                </div>
              </div>

              <div style={styles.bonus}>
                {completed
                  ? "✓ Параметр полностью улучшен"
                  : `+${bonus} к параметру`}
              </div>

              {/* PROGRESS */}
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progress,
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div style={styles.progressText}>
                {step} / 114 шагов
              </div>

              <div style={styles.description}>
                {stat.description}
              </div>

              {!completed ? (
                <button
                  style={{
                    ...styles.upgradeButton,
                    ...(goldStep
                      ? styles.goldButton
                      : {}),
                  }}
                  onClick={() => upgrade(key)}
                >
                  <span>
                    Улучшить
                  </span>

                  <span>
                    {formatPrice(
                      price,
                      goldStep
                    )}
                  </span>
                </button>
              ) : (
                <div style={styles.completed}>
                  🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ
                </div>
              )}

              <div style={styles.stepInfo}>
                Следующий шаг:{" "}
                {goldStep
                  ? "🟡 золото"
                  : "⚪ серебро"}
              </div>

            </div>
          );
        })}

      </div>

      {/* MASTERY */}
      <div style={styles.masteryBlock}>

        <div style={styles.masteryTitle}>
          🏆 Мастерство: {formatNumber(mastery)}
        </div>

        <div style={styles.masteryText}>
          • Прокачивая параметры, вы увеличиваете
          мастерство.
        </div>

        <div style={styles.masteryText}>
          • Чем выше мастерство, тем более крутые
          вещи доступны в 🛒 Магазине снаряжения.
        </div>

        <div style={styles.masteryText}>
          • Чем выше мастерство, тем больше
          параметров дают 🧪 Эликсиры.
        </div>

      </div>

      {/* TOTAL BONUS */}
      <div style={styles.totalBlock}>
        <div style={styles.totalTitle}>
          📊 Максимальный бонус тренировки
        </div>

        <div>⚔️ Сила: +152</div>
        <div>❤️ Жизни: +152</div>
        <div>🎯 Удача: +152</div>
        <div>🛡️ Броня: +152</div>
        <div>🔮 Энергия: +665</div>
      </div>

      {/* DEMO RESET */}
      <button
        style={styles.resetButton}
        onClick={resetDemo}
      >
        Сбросить тестовый прогресс
      </button>

      {/* BOTTOM NAV */}
      <div style={styles.bottomNav}>

        <button
          onClick={() => onNavigate?.("hero")}
        >
          ⚔️
          <span>Мій герой</span>
        </button>

        <button
          onClick={() => onNavigate?.("home")}
        >
          🏰
          <span>Головна</span>
        </button>

        <button
          onClick={() => onNavigate?.("clan")}
        >
          🛡️
          <span>Мій клан</span>
        </button>

      </div>

    </div>
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #0d0906, #140d08)",
    color: "#d4a359",
    fontFamily: "Arial, sans-serif",
    paddingBottom: "85px",
  },

  header: {
    textAlign: "center",
    padding: "12px 8px",
    borderBottom: "1px solid #3d2a1a",
    background:
      "linear-gradient(180deg, #1d120a, #140c07)",
  },

  title: {
    fontSize: "19px",
    fontWeight: 800,
    color: "#d4a359",
  },

  resources: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginTop: "8px",
    fontSize: "12px",
  },

  backButton: {
    width: "100%",
    padding: "9px 12px",
    border: "none",
    borderBottom: "1px solid #2a1c10",
    background: "#110a06",
    color: "#887055",
    textAlign: "left",
    cursor: "pointer",
  },

  intro: {
    padding: "10px",
    textAlign: "center",
  },

  introTitle: {
    fontSize: "13px",
    color: "#b99a6a",
    marginBottom: "10px",
  },

  arena: {
    height: "125px",
    border: "1px solid #594027",
    borderRadius: "5px",
    background:
      "radial-gradient(circle, #382313, #110906)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    boxShadow:
      "inset 0 0 30px rgba(0,0,0,.7)",
  },

  arenaIcon: {
    fontSize: "42px",
  },

  arenaText: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "18px",
    fontWeight: 800,
  },

  arenaTextSpan: {
    fontSize: "11px",
  },

  trainingList: {
    borderTop: "1px solid #3d2a1a",
  },

  card: {
    padding: "12px 10px",
    borderBottom: "1px solid #3d2a1a",
    background:
      "linear-gradient(90deg, #160d08, #120a06)",
  },

  statHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  statName: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#d4a359",
  },

  statValue: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#72b043",
    fontWeight: 700,
  },

  statValueSpan: {
    color: "#887055",
    fontWeight: 400,
  },

  steps: {
    color: "#887055",
    fontSize: "11px",
  },

  bonus: {
    marginTop: "6px",
    color: "#72b043",
    fontSize: "12px",
    fontWeight: 700,
  },

  progressTrack: {
    height: "10px",
    marginTop: "7px",
    background: "#291a0e",
    border: "1px solid #49311b",
    borderRadius: "2px",
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    background:
      "linear-gradient(90deg, #557d32, #72b043)",
    transition: "width .2s ease",
  },

  progressText: {
    marginTop: "3px",
    textAlign: "right",
    color: "#66513a",
    fontSize: "10px",
  },

  description: {
    marginTop: "7px",
    color: "#887055",
    fontSize: "11px",
    lineHeight: 1.4,
  },

  upgradeButton: {
    width: "100%",
    marginTop: "10px",
    padding: "10px",
    border: "1px solid #594027",
    borderRadius: "4px",
    background:
      "linear-gradient(180deg, #302013, #1b1009)",
    color: "#d4a359",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 700,
    cursor: "pointer",
  },

  goldButton: {
    borderColor: "#80631e",
    color: "#e0bd55",
    background:
      "linear-gradient(180deg, #35290e, #1c1407)",
  },

  completed: {
    marginTop: "10px",
    padding: "10px",
    textAlign: "center",
    border: "1px solid #557d32",
    color: "#72b043",
    fontWeight: 800,
    fontSize: "12px",
  },

  stepInfo: {
    marginTop: "6px",
    textAlign: "center",
    color: "#66513a",
    fontSize: "10px",
  },

  masteryBlock: {
    margin: "10px",
    padding: "12px",
    border: "1px solid #594027",
    background: "#160d08",
    lineHeight: 1.6,
  },

  masteryTitle: {
    fontSize: "15px",
    fontWeight: 800,
    color: "#ffaa00",
    marginBottom: "6px",
  },

  masteryText: {
    fontSize: "11px",
    color: "#887055",
  },

  totalBlock: {
    margin: "10px",
    padding: "12px",
    border: "1px solid #3d2a1a",
    background: "#110a06",
    lineHeight: 1.8,
    fontSize: "12px",
  },

  totalTitle: {
    color: "#d4a359",
    fontWeight: 800,
    marginBottom: "5px",
  },

  resetButton: {
    display: "block",
    margin: "15px auto",
    padding: "7px 12px",
    border: "1px solid #392718",
    background: "transparent",
    color: "#66513a",
    fontSize: "10px",
    cursor: "pointer",
  },

  bottomNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: "64px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    background: "#0b0705",
    borderTop: "1px solid #3d2a1a",
    zIndex: 100,
  },

  bottomNavButton: {
    border: "none",
  },
};
