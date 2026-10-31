
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  FlaskConical,
  Coins,
  Package,
  Sparkles,
  Shield,
  Heart,
  Swords,
  Zap,
  Lock,
  CheckCircle2,
  RefreshCw,
  Beaker,
} from "lucide-react";

const ELIXIRS = [
  {
    key: "strength",
    name: "Еліксир сили",
    description: "Тимчасово підвищує силу героя.",
    resource: "ambrosia",
    resourceName: "Амброзія",
    resourceIcon: "🌺",
    icon: Swords,
    color: "#d98b45",
  },
  {
    key: "defense",
    name: "Еліксир захисту",
    description: "Тимчасово підвищує захист героя.",
    resource: "calamus",
    resourceName: "Аїр",
    resourceIcon: "🌿",
    icon: Shield,
    color: "#6da7c9",
  },
  {
    key: "agility",
    name: "Еліксир спритності",
    description: "Тимчасово підвищує спритність героя.",
    resource: "mint",
    resourceName: "М'ята",
    resourceIcon: "🍃",
    icon: Zap,
    color: "#70bd83",
  },
  {
    key: "health",
    name: "Еліксир здоров'я",
    description: "Тимчасово підвищує здоров'я героя.",
    resource: "rowan",
    resourceName: "Горобина",
    resourceIcon: "🍒",
    icon: Heart,
    color: "#cf6870",
  },
];

const REQUIRED_RESOURCE = 10;
const RESOURCE_GOLD_PRICE = 15;
const CRAFT_GOLD_PRICE = 5;
const CRAFT_SILVER_PRICE = 5700;

const formatNumber = (value) =>
  Math.floor(Number(value) || 0).toLocaleString("uk-UA");

export default function Elixirs({ profile, player, onProfileUpdate }) {
  const hero = player || profile || {};
  const userId = hero.id;

  const [gold, setGold] = useState(Number(hero.gold || 0));
  const [silver, setSilver] = useState(Number(hero.silver || 0));
  const [resources, setResources] = useState({});
  const [mastery, setMastery] = useState(0);
  const [chest, setChest] = useState({});
  const [activeElixirs, setActiveElixirs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [crafting, setCrafting] = useState(null);
  const [activating, setActivating] = useState(null);
  const [notice, setNotice] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Завантаження даних лабораторії
  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [
        profileResult,
        resourceResult,
        trainingResult,
        chestResult,
        activeResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("gold, silver")
          .eq("id", userId)
          .single(),

        supabase
          .from("player_cave_resources")
          .select("resource_key, quantity")
          .eq("user_id", userId),

        supabase
          .from("player_training")
          .select(
            "strength_steps, health_steps, luck_steps, armor_steps, energy_steps"
          )
          .eq("user_id", userId)
          .maybeSingle(),

        supabase
          .from("player_items")
          .select("quantity, item:items(id, effect)")
          .eq("user_id", userId)
          .eq("storage_location", "chest"),

        supabase
          .from("player_elixirs")
          .select("elixir_key, bonus, expires_at")
          .eq("user_id", userId)
          .gt("expires_at", new Date().toISOString()),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (resourceResult.error) throw resourceResult.error;
      if (trainingResult.error) throw trainingResult.error;
      if (chestResult.error) throw chestResult.error;
      if (activeResult.error) throw activeResult.error;

      setGold(Number(profileResult.data?.gold || 0));
      setSilver(Number(profileResult.data?.silver || 0));

      // Ресурси
      const resourceMap = {};

      for (const row of resourceResult.data || []) {
        resourceMap[row.resource_key] = Number(row.quantity || 0);
      }

      setResources(resourceMap);

      // Майстерність тренувань
      const training = trainingResult.data || {};

      const totalMastery =
        Number(training.strength_steps || 0) +
        Number(training.health_steps || 0) +
        Number(training.luck_steps || 0) +
        Number(training.armor_steps || 0) +
        Number(training.energy_steps || 0);

      setMastery(Math.min(570, Math.max(0, totalMastery)));

      // Еліксири у скрині
      const chestMap = {};

      for (const row of chestResult.data || []) {
        const item = Array.isArray(row.item) ? row.item[0] : row.item;
        const key = item?.effect?.elixir_key;

        if (key) {
          chestMap[key] =
            (chestMap[key] || 0) + Number(row.quantity || 0);
        }
      }

      setChest(chestMap);

      // Активні еліксири
      setActiveElixirs(activeResult.data || []);
    } catch (error) {
      console.error("Помилка завантаження еліксирів:", error);

      setNotice({
        type: "error",
        text:
          error.message ||
          "Не вдалося завантажити дані лабораторії.",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Оновлення таймера кожну секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Форматування залишку часу
  const formatRemaining = (expiresAt) => {
    const remaining = Math.max(
      0,
      new Date(expiresAt).getTime() - currentTime
    );

    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours} год ${String(minutes).padStart(2, "0")} хв ${String(
      seconds
    ).padStart(2, "0")} с`;
  };

  // Вартість виготовлення
  const getCraftCost = (elixir) => {
    const available = Number(resources[elixir.resource] || 0);
    const missing = Math.max(0, REQUIRED_RESOURCE - available);

    return {
      available,
      missing,
      gold: CRAFT_GOLD_PRICE + missing * RESOURCE_GOLD_PRICE,
      silver: CRAFT_SILVER_PRICE,
    };
  };

  // Виготовлення еліксиру
  const handleCraft = async (elixir) => {
    if (crafting || activating || loading) return;

    const cost = getCraftCost(elixir);

    if (gold < cost.gold || silver < cost.silver) {
      setNotice({
        type: "error",
        text: "Недостатньо золота або срібла для виготовлення.",
      });
      return;
    }

    setCrafting(elixir.key);
    setNotice(null);

    try {
      const { data, error } = await supabase.rpc(
        "craft_player_elixir",
        { p_elixir_key: elixir.key }
      );

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result || typeof result.success !== "boolean") {
        throw new Error("Сервер повернув невідому відповідь.");
      }

      await loadData();
      onProfileUpdate?.();

      if (result.success) {
        setNotice({
          type: "success",
          text: `${elixir.name} успішно виготовлено! Бонус: +${formatNumber(
            result.bonus
          )}. Еліксир додано до скрині.`,
        });
      } else {
        setNotice({
          type: "error",
          text:
            "Виготовлення не вдалося. Усі витрати списано. Спробуй ще раз!",
        });
      }
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Помилка виготовлення еліксиру.",
      });
    } finally {
      setCrafting(null);
    }
  };

  // Активація еліксиру зі скрині
  const handleActivate = async (elixir) => {
    if (activating || crafting || loading) return;

    if (Number(chest[elixir.key] || 0) < 1) {
      setNotice({
        type: "error",
        text: "У скрині немає цього еліксиру.",
      });
      return;
    }

    setActivating(elixir.key);
    setNotice(null);

    try {
      const { data, error } = await supabase.rpc(
        "activate_player_elixir",
        { p_elixir_key: elixir.key }
      );

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result?.success) {
        throw new Error("Не вдалося активувати еліксир.");
      }

      await loadData();
      onProfileUpdate?.();

      setNotice({
        type: "success",
        text: `${elixir.name} активовано! Бонус: +${formatNumber(
          result.bonus
        )}. Дія триває 4 години.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Помилка активації еліксиру.",
      });
    } finally {
      setActivating(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <RefreshCw size={22} />
        <span>Завантаження лабораторії...</span>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Гаманець */}
      <div style={styles.wallet}>
        <div style={styles.walletItem}>
          <Coins size={17} color="#e8b85c" />
          <span>Золото</span>
          <strong>{formatNumber(gold)}</strong>
        </div>

        <div style={styles.walletItem}>
          <span>⚪</span>
          <span>Срібло</span>
          <strong>{formatNumber(silver)}</strong>
        </div>
      </div>

      {/* Майстерність */}
      <section style={styles.masteryCard}>
        <div style={styles.masteryHeader}>
          <Sparkles size={21} color="#e8b85c" />
          <strong>Майстерність тренувань</strong>
        </div>

        <div style={styles.masteryValue}>
          +{formatNumber(mastery)}
          <small> / 570</small>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${(mastery / 570) * 100}%`,
            }}
          />
        </div>

        <p>
          Бонус кожного виготовленого еліксиру дорівнює твоїй майстерності.
        </p>
      </section>

      {/* Повідомлення */}
      {notice && (
        <div
          role="status"
          style={{
            ...styles.notice,
            ...(notice.type === "success"
              ? styles.successNotice
              : styles.errorNotice),
          }}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <Lock size={19} />
          )}

          <span>{notice.text}</span>
        </div>
      )}

      {/* Активні еліксири */}
      <section style={styles.activeSection}>
        <div style={styles.activeTitle}>
          <Sparkles size={21} color="#e8b85c" />
          <strong>Активні еліксири</strong>
          <span style={styles.activeCount}>
            {activeElixirs.length} / 4
          </span>
        </div>

        {activeElixirs.length === 0 ? (
          <p style={styles.emptyActive}>
            Наразі немає активних еліксирів.
          </p>
        ) : (
          activeElixirs.map((active) => {
            const elixir = ELIXIRS.find(
              (item) => item.key === active.elixir_key
            );

            if (!elixir) return null;

            const Icon = elixir.icon;

            return (
              <div key={active.elixir_key} style={styles.activeCard}>
                <div
                  style={{
                    ...styles.activeIcon,
                    color: elixir.color,
                    borderColor: `${elixir.color}77`,
                  }}
                >
                  <Icon size={23} />
                </div>

                <div style={styles.activeInfo}>
                  <strong>{elixir.name}</strong>

                  <span>
                    Бонус: +{formatNumber(active.bonus)}
                  </span>

                  <small>
                    Залишилося: {formatRemaining(active.expires_at)}
                  </small>
                </div>

                <CheckCircle2 size={20} color="#80c98b" />
              </div>
            );
          })
        )}
      </section>

      {/* Виготовлення */}
      <div style={styles.sectionTitle}>
        <FlaskConical size={21} />

        <div>
          <strong>Виготовлення еліксирів</strong>
          <small>Тривалість дії кожного еліксиру — 4 години</small>
        </div>
      </div>

      <div style={styles.cards}>
        {ELIXIRS.map((elixir) => {
          const Icon = elixir.icon;
          const cost = getCraftCost(elixir);

          const enoughGold = gold >= cost.gold;
          const enoughSilver = silver >= cost.silver;

          const canCraft =
            enoughGold &&
            enoughSilver &&
            !crafting &&
            !activating;

          const isCrafting = crafting === elixir.key;
          const isActivating = activating === elixir.key;

          const chestCount = Number(chest[elixir.key] || 0);

          const canActivate =
            chestCount > 0 &&
            !activating &&
            !crafting;

          return (
            <article key={elixir.key} style={styles.card}>
              <div style={styles.cardHeader}>
                <div
                  style={{
                    ...styles.elixirIcon,
                    borderColor: `${elixir.color}88`,
                    color: elixir.color,
                  }}
                >
                  <Icon size={29} />
                </div>

                <div style={styles.cardTitle}>
                  <strong>{elixir.name}</strong>
                  <small>{elixir.description}</small>
                </div>
              </div>

              {/* Кількість у скрині */}
              <div style={styles.stock}>
                <Package size={17} />
                <span>У скрині:</span>
                <strong>{formatNumber(chestCount)}</strong>
              </div>

              {/* Вартість */}
              <div style={styles.costTitle}>
                Ресурси для виготовлення
              </div>

              <div style={styles.resourceRow}>
                <span>
                  {elixir.resourceIcon} {elixir.resourceName}
                </span>

                <strong>
                  {formatNumber(cost.available)} / {REQUIRED_RESOURCE}
                </strong>
              </div>

              {cost.missing > 0 && (
                <div style={styles.goldCompensation}>
                  Не вистачає {cost.missing}. Доплата:{" "}
                  <strong>
                    {formatNumber(
                      cost.missing * RESOURCE_GOLD_PRICE
                    )}{" "}
                    золота
                  </strong>
                </div>
              )}

              <div style={styles.resourceRow}>
                <span>⚪ Срібло</span>
                <strong>{formatNumber(cost.silver)}</strong>
              </div>

              <div style={styles.resourceRow}>
                <span>🪙 Золото за виготовлення та нестачу</span>
                <strong>{formatNumber(cost.gold)}</strong>
              </div>

              <div style={styles.bonus}>
                <Sparkles size={16} />
                Бонус: <strong>+{formatNumber(mastery)}</strong>
              </div>

              {/* Кнопка виготовлення */}
              <button
                type="button"
                disabled={!canCraft || loading}
                onClick={() => handleCraft(elixir)}
                style={{
                  ...styles.craftButton,
                  opacity: canCraft ? 1 : 0.5,
                  cursor: canCraft ? "pointer" : "not-allowed",
                  background: isCrafting ? "#594326" : undefined,
                }}
              >
                {isCrafting ? (
                  <>
                    <RefreshCw size={18} />
                    Виготовлення...
                  </>
                ) : (
                  <>
                    <Beaker size={18} />
                    Виготовити
                  </>
                )}
              </button>

              {/* Кнопка активації */}
              <button
                type="button"
                disabled={!canActivate || loading}
                onClick={() => handleActivate(elixir)}
                style={{
                  ...styles.activateButton,
                  opacity: canActivate ? 1 : 0.5,
                  cursor: canActivate ? "pointer" : "not-allowed",
                }}
              >
                {isActivating ? (
                  <>
                    <RefreshCw size={18} />
                    Активація...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Активувати зі скрині
                  </>
                )}
              </button>

              {!enoughGold && (
                <small style={styles.missingText}>
                  Не вистачає золота.
                </small>
              )}

              {enoughGold && !enoughSilver && (
                <small style={styles.missingText}>
                  Не вистачає срібла.
                </small>
              )}

              {chestCount === 0 && (
                <small style={styles.chestHint}>
                  Спочатку виготов цей еліксир.
                </small>
              )}
            </article>
          );
        })}
      </div>

      <div style={styles.footer}>
        <Sparkles size={16} />
        Шанс успішного виготовлення — 80%. При невдачі всі витрати
        списуються.
      </div>
    </div>
  );
}

const styles = {
  page: {
    color: "#d4b382",
    padding: "12px 10px 30px",
    fontFamily: "Arial, sans-serif",
  },

  loading: {
    minHeight: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: "#d4b382",
  },

  wallet: {
    display: "flex",
    justifyContent: "space-around",
    gap: 10,
    padding: 13,
    background: "#1d1714",
    border: "1px solid #493626",
    borderRadius: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  walletItem: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },

  masteryCard: {
    padding: 15,
    background: "linear-gradient(145deg, #302317, #1d1714)",
    border: "1px solid #80613a",
    borderRadius: 9,
    marginBottom: 15,
  },

  masteryHeader: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: 14,
  },

  masteryValue: {
    fontSize: 29,
    fontWeight: 800,
    marginTop: 10,
    color: "#e8b85c",
  },

  progressTrack: {
    height: 9,
    background: "#100d0b",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },

  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #9b682f, #e8b85c)",
    borderRadius: 10,
  },

  notice: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    borderRadius: 7,
    marginBottom: 13,
    fontSize: 13,
    lineHeight: 1.5,
  },

  successNotice: {
    background: "#183122",
    border: "1px solid #477d56",
    color: "#a7e0b3",
  },

  errorNotice: {
    background: "#3b211c",
    border: "1px solid #8c4c3e",
    color: "#ffc0ae",
  },

  activeSection: {
    padding: 13,
    marginBottom: 16,
    background: "#1d1714",
    border: "1px solid #66502f",
    borderRadius: 8,
  },

  activeTitle: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
    color: "#e8b85c",
  },

  activeCount: {
    marginLeft: "auto",
    color: "#a88e6a",
    fontSize: 12,
  },

  emptyActive: {
    color: "#a88e6a",
    fontSize: 13,
    margin: 0,
  },

  activeCard: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: 10,
    marginTop: 8,
    background: "#120e0b",
    border: "1px solid #493626",
    borderRadius: 7,
  },

  activeIcon: {
    width: 42,
    height: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    borderRadius: 7,
    flexShrink: 0,
  },
  activeInfo: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: 4,
    fontSize: 13,
    minWidth: 0,
  },

  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "18px 2px 12px",
    color: "#e8b85c",
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },

  card: {
    background: "linear-gradient(145deg, #241c17, #17120f)",
    border: "1px solid #493626",
    borderRadius: 9,
    padding: 14,
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 13,
  },
  elixirIcon: {
    width: 52,
    height: 52,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    borderRadius: 8,
    background: "#100d0b",
  },

  cardTitle: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  stock: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 0",
    borderTop: "1px solid #493626",
    borderBottom: "1px solid #493626",
    fontSize: 13,
  },

  costTitle: {
    margin: "13px 0 7px",
    color: "#e8b85c",
    fontSize: 13,
    fontWeight: 700,
  },
  goldCompensation: {
    padding: 9,
    margin: "7px 0",
    background: "#332819",
    borderRadius: 5,
    color: "#eac47f",
    fontSize: 12,
  },

  bonus: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    color: "#e8b85c",
    fontSize: 13,
  },

  craftButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 13,
    padding: 12,
    border: "1px solid #a77b3c",
    borderRadius: 6,
    background: "linear-gradient(180deg, #8c602c, #62421f)",
    color: "#fff0d0",
    fontWeight: 700,
    fontSize: 14,
  },
activateButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    padding: 12,
    border: "1px solid #668b59",
    borderRadius: 6,
    background: "linear-gradient(180deg, #385b35, #263f27)",
    color: "#d9f3cf",
    fontWeight: 700,
    fontSize: 14,
  },

  missingText: {
    display: "block",
    marginTop: 8,
    color: "#e58b78",
    textAlign: "center",
  },

  chestHint: {
    display: "block",
    marginTop: 8,
    color: "#a88e6a",
    textAlign: "center",
    fontSize: 11,
  },
  
  footer: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 17,
    padding: 11,
    background: "#1d1714",
    borderRadius: 7,
    color: "#a88e6a",
    fontSize: 12,
    lineHeight: 1.5,
  },
};
