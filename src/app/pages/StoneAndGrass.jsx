import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Gem,
  Leaf,
  Hammer,
  Shield,
  Sword,
  CheckCircle,
  Coins,
  Package,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const BOOSTS = [
  {
    type: "stone",
    title: "Камінь",
    description: "Збільшує завдану шкоду на 35%.",
    duration: "60 секунд у бою",
    icon: Gem,
    color: "#65a9c9",
    effect: "+35% шкоди",
  },
  {
    type: "grass",
    title: "Трава",
    description: "Поглинає 35% отриманої шкоди.",
    duration: "60 секунд у бою",
    icon: Leaf,
    color: "#79b85a",
    effect: "−35% отриманої шкоди",
  },
];

const RESOURCE_NAMES = {
  diamond: "Алмаз",
  corundum: "Корунд",
  obsidian: "Обсидіан",
  graphite: "Графіт",
  onyx: "Онікс",
  ambrosia: "Амброзія",
  mint: "М'ята",
  calamus: "Аїр",
  rowan: "Горобина",
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("uk-UA");

export default function StoneAndGrass({
  profile,
  player,
  onProfileUpdate,
}) {
  const [quantities, setQuantities] = useState({
    stone: 0,
    grass: 0,
  });

  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingRecipe, setPendingRecipe] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const notify = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) {
        throw new Error("Увійди в гру, щоб користуватися лабораторією.");
      }

      const [
        { data: boostRows, error: boostError },
        { data: profileData, error: profileError },
      ] = await Promise.all([
        supabase
          .from("player_combat_boosts")
          .select("boost_type, quantity")
          .eq("user_id", user.id),

        supabase
          .from("profiles")
          .select("gold")
          .eq("id", user.id)
          .single(),
      ]);

      if (boostError) throw boostError;
      if (profileError) throw profileError;

      const nextQuantities = {
        stone: 0,
        grass: 0,
      };

      for (const row of boostRows || []) {
        if (row.boost_type in nextQuantities) {
          nextQuantities[row.boost_type] = Number(row.quantity || 0);
        }
      }

      setQuantities(nextQuantities);
      setGold(Number(profileData?.gold || 0));
    } catch (error) {
      notify(error.message || "Не вдалося завантажити дані.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Підготовка рецепта. Нічого не списує.
  const prepareCraft = async (boostType) => {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "prepare_combat_boost_craft",
        { p_boost_type: boostType }
      );

      if (error) throw error;

      const recipe = Array.isArray(data) ? data[0] : data;

      if (!recipe?.success) {
        throw new Error("Не вдалося підготувати рецепт.");
      }

      // Завжди показуємо вибраний ресурс перед виготовленням.
      setPendingRecipe(recipe);
    } catch (error) {
      notify(error.message || "Помилка підготовки рецепта.", "error");
    } finally {
      setBusy(false);
    }
  };

  // Підтвердження виготовлення.
  const confirmCraft = async (sessionId, confirmPurchase) => {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "confirm_combat_boost_craft",
        {
          p_session_id: sessionId,
          p_confirm_purchase: confirmPurchase,
        }
      );

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (result?.needs_confirmation) {
        setPendingRecipe((current) =>
          current
            ? {
                ...current,
                missing: result.missing,
                gold_cost: result.gold_cost,
              }
            : current
        );
        return;
      }

      if (!result?.success) {
        throw new Error("Не вдалося виготовити посилення.");
      }

      setPendingRecipe(null);

      const title =
        result.boost_type === "stone" ? "Камінь" : "Трава";

      notify(
        `${title} успішно виготовлено! У запасі: ${result.boost_quantity}.`,
        "success"
      );

      await loadData();
      onProfileUpdate?.();
    } catch (error) {
      notify(error.message || "Помилка виготовлення.", "error");
    } finally {
      setBusy(false);
    }
  };

  const cancelRecipe = () => {
    setPendingRecipe(null);
    notify("Виготовлення скасовано. Ресурси та золото не списані.");
  };

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerIcon}>
            <Sparkles size={27} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={styles.eyebrow}>ЛАБОРАТОРІЯ</div>
            <h1 style={styles.title}>Камінь і трава</h1>
            <p style={styles.subtitle}>
              Створи бойові посилення для свого героя
            </p>
          </div>
        </header>

        <div style={styles.wallet}>
          <Coins size={19} color="#e8b84f" />
          <span>Золото:</span>
          <strong>{formatNumber(gold)}</strong>

          <button
            type="button"
            style={styles.refreshButton}
            onClick={loadData}
            disabled={loading || busy}
            title="Оновити"
          >
            ↻
          </button>
        </div>

        {message && (
          <div
            style={{
              ...styles.notice,
              ...(messageType === "error" ? styles.error : {}),
              ...(messageType === "success" ? styles.success : {}),
            }}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div style={styles.loading}>
            <Loader2 size={25} />
            Завантаження посилень...
          </div>
        ) : (
          <div style={styles.boostList}>
            {BOOSTS.map((boost) => {
              const Icon = boost.icon;

              return (
                <section
                  key={boost.type}
                  style={{
                    ...styles.card,
                    borderColor: `${boost.color}66`,
                  }}
                >
                  <div
                    style={{
                      ...styles.cardIcon,
                      color: boost.color,
                      borderColor: `${boost.color}66`,
                    }}
                  >
                    <Icon size={38} />
                  </div>

                  <div style={styles.cardContent}>
                    <div style={styles.cardHeading}>
                      <h2 style={styles.cardTitle}>{boost.title}</h2>

                      <span style={styles.stock}>
                        ×{formatNumber(quantities[boost.type])}
                      </span>
                    </div>

                    <p style={styles.description}>
                      {boost.description}
                    </p>

                    <div style={styles.effect}>
                      <Sword size={15} />
                      {boost.effect}
                    </div>

                    <div style={styles.duration}>
                      <Shield size={14} />
                      {boost.duration}
                    </div>

                    <button
                      type="button"
                      style={{
                        ...styles.craftButton,
                        background: boost.color,
                      }}
                      disabled={busy}
                      onClick={() => prepareCraft(boost.type)}
                    >
                      {busy ? (
                        <Loader2 size={18} />
                      ) : (
                        <Hammer size={18} />
                      )}
                      Виготовити
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <div style={styles.info}>
          <Package size={19} style={{ flexShrink: 0 }} />
          <div>
            <strong>Як працює виготовлення?</strong>
            <p>
              Для кожного рецепта випадково вибирається один ресурс.
              Потрібно 4 одиниці. Якщо їх не вистачає, можна
              докупити відсутню кількість за 15 золота за одиницю.
              Покупка відбувається тільки після твого підтвердження.
            </p>
          </div>
        </div>

        <div style={styles.footer}>
          <ArrowLeft size={15} />
          Бойове використання посилень підключимо окремо.
        </div>
      </div>

      {pendingRecipe && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <button
              type="button"
              style={styles.close}
              onClick={cancelRecipe}
              disabled={busy}
              aria-label="Закрити"
            >
              <X size={21} />
            </button>

            <div style={styles.modalIcon}>
              {pendingRecipe.boost_type === "stone" ? (
                <Gem size={38} />
              ) : (
                <Leaf size={38} />
              )}
            </div>

            <h2 style={styles.modalTitle}>
              Підтвердження виготовлення
            </h2>

            <p style={styles.modalText}>
              Для виготовлення{" "}
              <strong>
                {pendingRecipe.boost_type === "stone"
                  ? "Каменя"
                  : "Трави"}
              </strong>{" "}
              випадково вибрано такий ресурс:
            </p>

            <div style={styles.recipeResource}>
              {RESOURCE_NAMES[pendingRecipe.resource_key] ||
                pendingRecipe.resource_key}
            </div>

            <div style={styles.recipeDetails}>
              <div style={styles.detailRow}>
                <span>Потрібно для рецепта</span>
                <strong>4 шт.</strong>
              </div>

              <div style={styles.detailRow}>
                <span>Є в наявності</span>
                <strong>{pendingRecipe.available} шт.</strong>
              </div>

              <div style={styles.detailRow}>
                <span>Буде витрачено з запасу</span>
                <strong>
                  {Math.min(
                    Number(pendingRecipe.available || 0),
                    4
                  )}{" "}
                  шт.
                </strong>
              </div>

              <div style={styles.detailRow}>
                <span>Потрібно докупити</span>
                <strong>{pendingRecipe.missing} шт.</strong>
              </div>

              <div style={styles.detailRow}>
                <span>Ціна за одиницю</span>
                <strong>15 золота</strong>
              </div>
            </div>

            <div style={styles.totalCost}>
              <Coins size={22} />
              <span>До сплати</span>
              <strong>
                {formatNumber(pendingRecipe.gold_cost)}
              </strong>
            </div>

            {Number(pendingRecipe.gold_balance) <
              Number(pendingRecipe.gold_cost) && (
              <div style={styles.warning}>
                Недостатньо золота для покупки.
                Потрібно: {formatNumber(pendingRecipe.gold_cost)},
                у наявності: {formatNumber(pendingRecipe.gold_balance)}.
              </div>
            )}

            <button
              type="button"
              style={styles.confirmButton}
              disabled={
                busy ||
                Number(pendingRecipe.gold_balance) <
                  Number(pendingRecipe.gold_cost)
              }
              onClick={() =>
                confirmCraft(
                  pendingRecipe.session_id,
                  Number(pendingRecipe.missing) > 0
                )
              }
            >
              {busy ? (
                <Loader2 size={19} />
              ) : (
                <CheckCircle size={19} />
              )}

              {Number(pendingRecipe.missing) > 0
                ? "Підтвердити покупку і виготовити"
                : "Підтвердити виготовлення"}
            </button>

            <button
              type="button"
              style={styles.cancelButton}
              onClick={cancelRecipe}
              disabled={busy}
            >
              Скасувати
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100%",
    padding: "14px 12px 90px",
    boxSizing: "border-box",
    background: "#120E0B",
    color: "#D4B382",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    padding: "12px 4px 20px",
    borderBottom: "1px solid #38291d",
  },
  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#DDB66D",
    background: "#241b13",
    border: "1px solid #61482d",
  },
  eyebrow: {
    color: "#a58a63",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 700,
  },
  title: {
    margin: "4px 0",
    fontSize: 23,
    color: "#e8c995",
  },
  subtitle: {
    margin: 0,
    fontSize: 12,
    color: "#927b5d",
  },
  wallet: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "14px 0",
    padding: 12,
    background: "#1d1711",
    border: "1px solid #403020",
    borderRadius: 9,
  },
  refreshButton: {
    marginLeft: "auto",
    border: 0,
    background: "transparent",
    color: "#d4b382",
    fontSize: 23,
    cursor: "pointer",
  },
  notice: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    background: "#282219",
    border: "1px solid #705d3b",
    color: "#e5ca93",
    fontSize: 13,
  },
  error: {
    background: "#351a17",
    borderColor: "#85443c",
    color: "#ffb7a8",
  },
  success: {
    background: "#172b1a",
    borderColor: "#47794b",
    color: "#a8e3a8",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 45,
    color: "#c9ae83",
  },
  boostList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: 15,
    background: "linear-gradient(145deg, #211a14, #17110d)",
    border: "1px solid #51402d",
    borderRadius: 12,
  },
  cardIcon: {
    width: 62,
    height: 62,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    borderRadius: 10,
    background: "#120e0b",
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    margin: 0,
    color: "#e8c995",
    fontSize: 19,
  },
  stock: {
    color: "#e8c477",
    fontWeight: 700,
    fontSize: 17,
    whiteSpace: "nowrap",
  },
  description: {
    margin: "8px 0",
    color: "#c3a77e",
    fontSize: 13,
    lineHeight: 1.45,
  },
  effect: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#e4bd77",
    fontWeight: 700,
    fontSize: 12,
  },
  duration: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    color: "#938064",
    fontSize: 12,
  },
  craftButton: {
    width: "100%",
    minHeight: 42,
    marginTop: 13,
    border: 0,
    borderRadius: 7,
    color: "#17110b",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  },
  info: {
    display: "flex",
    gap: 10,
    padding: 13,
    marginTop: 18,
    background: "#1b1711",
    border: "1px solid #403020",
    borderRadius: 9,
    color: "#bba27e",
    fontSize: 12,
    lineHeight: 1.5,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 18,
    color: "#77664e",
    fontSize: 11,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "rgba(0,0,0,0.82)",
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: 390,
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: 22,
    borderRadius: 13,
    border: "1px solid #725433",
    background: "linear-gradient(145deg, #261c13, #120e0b)",
    textAlign: "center",
  },
  close: {
    position: "absolute",
    top: 12,
    right: 12,
    border: 0,
    background: "transparent",
    color: "#bba27e",
    cursor: "pointer",
  },
  modalIcon: {
    color: "#e2bb75",
    margin: "5px auto 12px",
  },
  modalTitle: {
    margin: "0 0 10px",
    color: "#e8c995",
    fontSize: 20,
  },
  modalText: {
    color: "#bba27e",
    fontSize: 13,
    lineHeight: 1.5,
  },
  recipeResource: {
    padding: 12,
    margin: "12px 0",
    borderRadius: 8,
    background: "#120e0b",
    border: "1px solid #57432c",
    color: "#e7c17f",
    fontSize: 18,
    fontWeight: 700,
  },
  recipeDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    padding: 12,
    background: "#17120e",
    borderRadius: 8,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    textAlign: "left",
    color: "#bba27e",
    fontSize: 12,
  },
  totalCost: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    padding: 13,
    margin: "12px 0",
    color: "#e8bd68",
    background: "#2a2115",
    borderRadius: 8,
    fontWeight: 700,
  },
  warning: {
    padding: 10,
    marginBottom: 10,
    background: "#3a1c17",
    color: "#ffb5a5",
    borderRadius: 7,
    fontSize: 12,
  },
  confirmButton: {
    width: "100%",
    minHeight: 45,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: 0,
    borderRadius: 7,
    background: "#8caa54",
    color: "#15130d",
    fontWeight: 700,
    cursor: "pointer",
  },
  cancelButton: {
    width: "100%",
    minHeight: 40,
    marginTop: 9,
    border: "1px solid #59432c",
    borderRadius: 7,
    background: "transparent",
    color: "#c5a982",
    cursor: "pointer",
  },
};
