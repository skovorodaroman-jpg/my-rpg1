import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const [loading, setLoading] = useState(true);
  const [crafting, setCrafting] = useState(null);
  const [notice, setNotice] = useState(null);

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
      ]);

      if (profileResult.error) throw profileResult.error;
      if (resourceResult.error) throw resourceResult.error;
      if (trainingResult.error) throw trainingResult.error;
      if (chestResult.error) throw chestResult.error;

      setGold(Number(profileResult.data?.gold || 0));
      setSilver(Number(profileResult.data?.silver || 0));

      const resourceMap = {};
      for (const row of resourceResult.data || []) {
        resourceMap[row.resource_key] = Number(row.quantity || 0);
      }
      setResources(resourceMap);

      const training = trainingResult.data || {};
      const totalMastery =
        Number(training.strength_steps || 0) +
        Number(training.health_steps || 0) +
        Number(training.luck_steps || 0) +
        Number(training.armor_steps || 0) +
        Number(training.energy_steps || 0);

      setMastery(Math.min(570, totalMastery));

      const chestMap = {};
      for (const row of chestResult.data || []) {
        const item = Array.isArray(row.item) ? row.item[0] : row.item;
        const key = item?.effect?.elixir_key;

        if (key) {
          chestMap[key] = (chestMap[key] || 0) + Number(row.quantity || 0);
        }
      }
      setChest(chestMap);
    } catch (error) {
      console.error("Помилка завантаження еліксирів:", error);
      setNotice({
        type: "error",
        text: error.message || "Не вдалося завантажити дані лабораторії.",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleCraft = async (elixir) => {
    if (crafting || loading) return;

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
          text: `Виготовлення не вдалося. Усі витрати списано. Спробуй ще раз!`,
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
      <div style={styles.wallet}>
        <div>
          <Coins size={17} color="#e8b85c" />
          <span>Золото</span>
          <strong>{formatNumber(gold)}</strong>
        </div>
        <div>
          <span>⚪</span>
          <span>Срібло</span>
          <strong>{formatNumber(silver)}</strong>
        </div>
      </div>

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
          const canCraft = enoughGold && enoughSilver && !crafting;
          const isCrafting = crafting === elixir.key;

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

              <div style={styles.stock}>
                <Package size={17} />
                <span>У скрині:</span>
                <strong>{formatNumber(chest[elixir.key] || 0)}</strong>
              </div>

              <div style={styles.costTitle}>Ресурси для виготовлення</div>

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
                    {formatNumber(cost.missing * RESOURCE_GOLD_PRICE)} золота
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
            </article>
          );
        })}
      </div>

      <div style={styles.footer}>
        <Sparkles size={16} />
        Шанс успішного виготовлення — 80%. При невдачі витрати не повертаються.
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
  masteryCard: {
    padding: 15,
    background: "linear-gradient(145deg, #302317, #1d1714)",
    border: "1px solid #80613a",
    borderRadius: 9,
    marginBottom: 15,
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
  resourceRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    padding: "7px 0",
    borderBottom: "1px solid #30251d",
    fontSize: 12,
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
  missingText: {
    display: "block",
    marginTop: 8,
    color: "#e58b78",
    textAlign: "center",
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
