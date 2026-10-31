
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const TRAINING_PRICES = [
  100, 200, 300, 400, 500, 1,
  800, 1600, 2400, 3200, 4000, 5,
  1200, 2400, 3600, 4800, 6000, 10,
  1600, 3200, 4800, 6400, 8000, 15,
  2000, 4000, 6000, 8000, 10000, 20,
  2400, 4800, 7200, 9600, 12000, 25,
  2800, 5600, 8400, 11200, 14000, 30,
  3200, 6400, 9600, 12800, 16000, 35,
  3600, 7200, 10800, 14400, 18000, 40,
  4000, 8000, 12000, 16000, 20000, 45,
  25000, 30000, 35000, 40000, 45000, 50,
  52500, 60000, 67500, 75000, 82500, 55,
  92500, 102500, 112500, 122500, 132500, 60,
  147500, 162500, 177500, 192500, 200000, 100,
  200000, 250000, 275000, 300000, 325000, 150,
  350000, 400000, 450000, 500000, 550000, 250,
  1000000, 1200000, 1400000, 1600000, 1900000, 500,
  2000000, 2200000, 2400000, 2600000, 2900000, 1000,
  3000000, 3200000, 3400000, 3600000, 3900000, 1500,
];

const INITIAL_STATS = {
  strength: {
    name: "Сила",
    icon: "🛡️",
    value: 0,
    description: "Чем больше сила, тем больше урона нанесешь врагу!",
  },
  health: {
    name: "Жизни",
    icon: "🔴",
    value: 0,
    description: "Здоровья много не бывает.",
  },
  luck: {
    name: "Удача",
    icon: "🎯",
    value: 0,
    description: "Увеличивает шанс на крит. удар.",
  },
  armor: {
    name: "Броня",
    icon: "🛡️",
    value: 0,
    description: "Поглощает урон врага.",
  },
  energy: {
    name: "Энергия",
    icon: "🔮",
    value: 0,
    description: "Увеличивает запас энергии.",
  },
};

function formatNumber(value) {
  return new Intl.NumberFormat("uk-UA").format(Number(value) || 0);
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
  const hero = player || profile || {};
  const userId = hero.id;

  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [busyStat, setBusyStat] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTraining = useCallback(async () => {
    if (!userId) {
      setError("Не вдалося визначити гравця. Перезайди в гру.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        profileResult,
        trainingResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("silver, gold")
          .eq("id", userId)
          .single(),

        supabase
          .from("player_training")
          .select(
            "strength_steps, health_steps, luck_steps, armor_steps, energy_steps"
          )
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (trainingResult.error) throw trainingResult.error;

      const training = trainingResult.data || {};

      setSilver(Number(profileResult.data?.silver || 0));
      setGold(Number(profileResult.data?.gold || 0));

      setStats({
        strength: {
          ...INITIAL_STATS.strength,
          value: Number(training.strength_steps || 0),
        },
        health: {
          ...INITIAL_STATS.health,
          value: Number(training.health_steps || 0),
        },
        luck: {
          ...INITIAL_STATS.luck,
          value: Number(training.luck_steps || 0),
        },
        armor: {
          ...INITIAL_STATS.armor,
          value: Number(training.armor_steps || 0),
        },
        energy: {
          ...INITIAL_STATS.energy,
          value: Number(training.energy_steps || 0),
        },
      });
    } catch (err) {
      console.error("Помилка завантаження тренувань:", err);
      setError(err.message || "Не вдалося завантажити тренування.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTraining();
  }, [loadTraining]);

  const mastery = useMemo(
    () => Object.values(stats).reduce(
      (sum, stat) => sum + stat.value,
      0
    ),
    [stats]
  );

  const upgrade = async (statKey) => {
    if (busyStat || loading) return;

    const stat = stats[statKey];
    if (!stat || stat.value >= 114) return;

    setBusyStat(statKey);
    setError("");
    setNotice("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "train_player_stat",
        { p_stat_key: statKey }
      );

      if (rpcError) throw rpcError;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result?.success) {
        throw new Error("Сервер не підтвердив покращення.");
      }

      await loadTraining();

      const currencyName =
        result.currency === "gold" ? "золота" : "срібла";

      setNotice(
        `${stat.name}: крок ${result.step}/114 успішно покращено. Списано ${formatNumber(result.price)} ${currencyName}.`
      );
    } catch (err) {
      console.error("Помилка тренування:", err);
      setError(err.message || "Не вдалося покращити характеристику.");
    } finally {
      setBusyStat(null);
    }
  };

  const trainingCards = Object.entries(stats);
  const heroLevel = Number(hero.level || 1);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>🏋️ ТРЕНИРОВКА 🏋️</div>

        <div style={styles.resources}>
          <span>⚪ {formatNumber(silver)}</span>
          <span>🟡 {formatNumber(gold)}</span>
          <span>🏆 Мастерство: {formatNumber(mastery)}</span>
        </div>
        <div style={styles.heroLevel}>Рівень героя: {heroLevel}</div>
      </div>

      <button
        style={styles.backButton}
        onClick={() => onNavigate?.("hero")}
      >
        ← Мой герой
      </button>

      {error && (
        <div style={styles.errorNotice}>
          {error}
          <button
            style={styles.retryButton}
            onClick={loadTraining}
            disabled={loading || Boolean(busyStat)}
          >
            Повторити
          </button>
        </div>
      )}

      {notice && (
        <div style={styles.successNotice}>
          {notice}
        </div>
      )}

      <div style={styles.intro}>
        <div style={styles.introTitle}>
          Улучшай параметры своего героя!
        </div>

        <div style={styles.arena}>
          <div style={styles.arenaIcon}>⚔️</div>
          <div style={styles.arenaText}>
            АРЕНА
            <span style={styles.arenaTextSpan}>
              Бойцы на тренировке
            </span>
          </div>
          <div style={styles.arenaIcon}>🛡️</div>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>
          Завантаження тренувань...
        </div>
      ) : (
        <div style={styles.trainingList}>
          {trainingCards.map(([key, stat]) => {
            const step = stat.value;
            const nextStep = step + 1;
            const completed = step >= 114;

            const price = completed
              ? 0
              : getCurrencyCost(nextStep);

            const goldStep = !completed && isGoldStep(nextStep);
            const progress = Math.round((step / 114) * 100);
            const currentValue = getStatTotal(key, step);

            const bonus = completed
              ? 0
              : getStepBonus(key, nextStep);

            const insufficient = !completed && (
              goldStep ? gold < price : silver < price
            );

            return (
              <div key={key} style={styles.card}>
                <div style={styles.statHeader}>
                  <div>
                    <div style={styles.statName}>
                      {stat.icon} {stat.name}
                    </div>

                    <div style={styles.statValue}>
                      {formatNumber(currentValue)}
                      {getStatDisplay(key, currentValue) && (
                        <span style={styles.statValueSpan}>
                          {" "}({getStatDisplay(key, currentValue)})
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
                      ...(goldStep ? styles.goldButton : {}),
                      ...(insufficient ? styles.disabledButton : {}),
                    }}
                    disabled={Boolean(busyStat) || insufficient}
                    onClick={() => upgrade(key)}
                  >
                    <span>
                      {busyStat === key ? "Збереження..." : "Улучшить"}
                    </span>

                    <span>
                      {formatPrice(price, goldStep)}
                    </span>
                  </button>
                ) : (
                  <div style={styles.completed}>
                    🏆 МАКСИМАЛЬНЫЙ УРОВЕНЬ
                  </div>
                )}

                <div style={styles.stepInfo}>
                  {completed
                    ? "Усі кроки завершено"
                    : `Наступний крок: ${goldStep ? "🟡 золото" : "⚪ срібло"}`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.masteryBlock}>
        <div style={styles.masteryTitle}>
          🏆 Мастерство: {formatNumber(mastery)} / 570
        </div>

        <div style={styles.masteryText}>
          • Прокачивая параметры, вы увеличиваете мастерство.
        </div>

        <div style={styles.masteryText}>
          • Чем выше мастерство, тем более крутые вещи доступны в 🛒 Магазине снаряжения.
        </div>

        <div style={styles.masteryText}>
          • Чем выше мастерство, тем больше параметров дают 🧪 Эликсиры.
        </div>

        <div style={styles.masteryTrack}>
          <div
            style={{
              ...styles.masteryProgress,
              width: `${(mastery / 570) * 100}%`,
            }}
          />
        </div>
      </div>

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

      <div style={styles.bottomNav}>
        <button onClick={() => onNavigate?.("hero")}>
          ⚔️
          <span>Мій герой</span>
        </button>

        <button onClick={() => onNavigate?.("home")}>
          🏰
          <span>Головна</span>
        </button>

        <button onClick={() => onNavigate?.("clan")}>
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
    background: "linear-gradient(180deg, #0d0906, #140d08)",
    color: "#d4a359",
    fontFamily: "Arial, sans-serif",
    paddingBottom: "85px",
  },
  header: {
    textAlign: "center",
    padding: "12px 8px",
    borderBottom: "1px solid #3d2a1a",
    background: "linear-gradient(180deg, #1d120a, #140c07)",
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
  heroLevel: {
    marginTop: 6,
    fontSize: 11,
    color: "#887055",
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
    background: "radial-gradient(circle, #382313, #110906)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    boxShadow: "inset 0 0 30px rgba(0,0,0,.7)",
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
    fontWeight: 400,
  },
  trainingList: {
    borderTop: "1px solid #3d2a1a",
  },
  card: {
    padding: "12px 10px",
    borderBottom: "1px solid #3d2a1a",
    background: "linear-gradient(90deg, #160d08, #120a06)",
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
    background: "linear-gradient(90deg, #557d32, #72b043)",
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
    background: "linear-gradient(180deg, #302013, #1b1009)",
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
    background: "linear-gradient(180deg, #35290e, #1c1407)",
  },
  disabledButton: {
    opacity: 0.45,
    cursor: "not-allowed",
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
  masteryTrack: {
    height: 8,
    marginTop: 10,
    background: "#291a0e",
    border: "1px solid #49311b",
    overflow: "hidden",
  },
  masteryProgress: {
    height: "100%",
    background: "linear-gradient(90deg, #557d32, #72b043)",
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
  loading: {
    padding: 30,
    textAlign: "center",
    color: "#b99a70",
  },
  errorNotice: {
    margin: 10,
    padding: 10,
    background: "#3b1712",
    color: "#ffb7a8",
    fontSize: 12,
  },
  retryButton: {
    marginLeft: 10,
    padding: 5,
    background: "#28190e",
    color: "#d4a359",
    border: "1px solid #594027",
  },
  successNotice: {
    margin: 10,
    padding: 10,
    background: "#172313",
    border: "1px solid #557d32",
    color: "#a9d889",
    fontSize: 12,
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
};
  
