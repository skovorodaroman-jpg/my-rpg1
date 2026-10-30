
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const SLOTS = [
  { type: "helmet", name: "Шолом", icon: "👑" },
  { type: "weapon", name: "Права рука", icon: "⚔️" },
  { type: "shoulders", name: "Наплічники", icon: "🛡️" },
  { type: "armor", name: "Броня", icon: "🦺" },
  { type: "gloves", name: "Рукавиці", icon: "🧤" },
  { type: "shield", name: "Ліва рука", icon: "🛡️" },
  { type: "pants", name: "Штани", icon: "👖" },
  { type: "boots", name: "Чоботи", icon: "🥾" },
];

const STAR_COSTS = [10, 100, 500, 800, 1200];
const STAR_POWER = [100, 300, 600, 1100, 2000];

const formatNumber = (value) =>
  Math.floor(Number(value) || 0).toLocaleString("uk-UA");

export default function Stars({ profile, player, onBack, onNavigate }) {
  const hero = player || profile || {};
  const userId = hero.id;

  const [stardust, setStardust] = useState(
    Number(hero.stardust || 0)
  );
  const [stars, setStars] = useState({});
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError("Не вдалося визначити профіль гравця.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [profileResult, starsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("stardust")
          .eq("id", userId)
          .single(),

        supabase
          .from("player_slot_stars")
          .select("slot_type, star_level")
          .eq("user_id", userId),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (starsResult.error) throw starsResult.error;

      setStardust(Number(profileResult.data?.stardust || 0));

      const result = {};
      for (const row of starsResult.data || []) {
        result[row.slot_type] = Number(row.star_level || 0);
      }

      setStars(result);
    } catch (err) {
      console.error("Помилка завантаження зірок:", err);
      setError("Не вдалося завантажити дані. Спробуй ще раз.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const upgrade = async (slot) => {
    const currentLevel = Number(stars[slot.type] || 0);

    if (currentLevel >= 5 || upgrading) return;

    const cost = STAR_COSTS[currentLevel];

    if (stardust < cost) {
      setNotice(
        `Не вистачає ${formatNumber(cost - stardust)} зоряного пилу.`
      );
      return;
    }

    setUpgrading(slot.type);
    setNotice("");
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "upgrade_slot_star",
        { p_slot_type: slot.type }
      );

      if (rpcError) throw rpcError;

      if (!data?.success) {
        throw new Error("Не вдалося підвищити рівень зірки.");
      }

      setStars((previous) => ({
        ...previous,
        [slot.type]: Number(data.star_level),
      }));

      setStardust(Number(data.remaining_stardust));

      setNotice(
        `${slot.name}: отримано ${data.star_level}-у зірку! ⭐`
      );

      // Оновлюємо актуальні дані профілю
      await loadData();
    } catch (err) {
      console.error("Помилка прокачування зірки:", err);
      setError(
        err.message || "Не вдалося підвищити зірку. Спробуй ще раз."
      );
      await loadData();
    } finally {
      setUpgrading(null);
    }
  };

  const totalStars = Object.values(stars).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const totalPower = SLOTS.reduce((sum, slot) => {
    const level = Number(stars[slot.type] || 0);
    return sum + (level > 0 ? STAR_POWER[level - 1] : 0);
  }, 0);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => {
            if (onBack) onBack();
            else if (onNavigate) onNavigate("forge");
          }}
        >
          ‹ Назад
        </button>

        <div style={styles.title}>⭐ ЗІРКИ КУЗНІ</div>
        <div style={styles.subtitle}>
          Посилюй слоти свого спорядження
        </div>
      </header>

      <section style={styles.balanceCard}>
        <div style={styles.balanceIcon}>✨</div>
        <div style={styles.balanceLabel}>Твій зоряний пил</div>
        <div style={styles.balanceValue}>
          {loading ? "..." : formatNumber(stardust)}
        </div>
        <div style={styles.balanceCaption}>
          Рідкісний ресурс для прокачування зірок
        </div>

        <div style={styles.summary}>
          <div style={styles.summaryItem}>
            <strong>{totalStars} / 40</strong>
            <span>Зібрано зірок</span>
          </div>
          <div style={styles.summaryDivider} />
          <div style={styles.summaryItem}>
            <strong>+{formatNumber(totalPower)}</strong>
            <span>Додаткова міць</span>
          </div>
        </div>
      </section>

      {notice && (
        <div style={styles.notice}>
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={loadData}>Повторити</button>
        </div>
      )}

      <div style={styles.sectionHeading}>
        <span>⚒️</span>
        <div>
          <strong>Прокачування слотів</strong>
          <small>Кожен слот прокачується окремо</small>
        </div>
      </div>

      <div style={styles.slotList}>
        {SLOTS.map((slot) => {
          const level = Number(stars[slot.type] || 0);
          const maxed = level >= 5;
          const cost = maxed ? 0 : STAR_COSTS[level];
          const missing = Math.max(0, cost - stardust);
          const canUpgrade = !loading && !maxed && missing === 0;
          const power = level > 0 ? STAR_POWER[level - 1] : 0;
          const nextPower = maxed ? 0 : STAR_POWER[level];

          return (
            <div key={slot.type} style={styles.slotCard}>
              <div style={styles.slotTop}>
                <div style={styles.slotIcon}>{slot.icon}</div>

                <div style={styles.slotInfo}>
                  <strong>{slot.name}</strong>
                  <div style={styles.starLine}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        style={{
                          color: index < level ? "#ffc44d" : "#594832",
                        }}
                      >
                        ★
                      </span>
                    ))}
                    <small>{level}/5</small>
                  </div>
                </div>

                <div style={styles.slotPower}>
                  <strong>+{formatNumber(power)}</strong>
                  <small>Міць</small>
                </div>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${level * 20}%`,
                  }}
                />
              </div>

              {maxed ? (
                <div style={styles.maxed}>
                  <span>⭐</span> Максимальний рівень
                </div>
              ) : (
                <>
                  <div style={styles.upgradeDetails}>
                    <div>
                      <span>Наступна зірка</span>
                      <strong>+{formatNumber(nextPower)} могутності</strong>
                    </div>
                    <div style={styles.cost}>
                      <span>Ціна</span>
                      <strong>✨ {formatNumber(cost)}</strong>
                    </div>
                  </div>

                  <button
                    style={{
                      ...styles.upgradeButton,
                      ...(canUpgrade ? {} : styles.disabledButton),
                    }}
                    disabled={!canUpgrade || upgrading !== null}
                    onClick={() => upgrade(slot)}
                  >
                    {upgrading === slot.type
                      ? "Прокачування..."
                      : canUpgrade
                        ? "⭐ ПІДВИЩИТИ"
                        : "НЕДОСТАТНЬО ПИЛУ"}
                  </button>

                  {missing > 0 && (
                    <div style={styles.missing}>
                      Не вистачає:{" "}
                      <strong>{formatNumber(missing)} ✨</strong>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <section style={styles.infoCard}>
        <div style={styles.infoTitle}>✨ Як отримати зоряний пил?</div>
        <p>
          Зоряний пил можна отримувати з щоденних скринь,
          які знаходяться в особистих та кланових щоденних завданнях.
        </p>
      </section>

      <div style={styles.footer}>
        Максимум: 5 зірок на кожному слоті · 8 слотів · +16 000 могутності
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    paddingBottom: 90,
    boxSizing: "border-box",
    background: "linear-gradient(180deg, #100b08 0%, #1b1009 100%)",
    color: "#e4c18a",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    padding: "16px 14px 18px",
    textAlign: "center",
    borderBottom: "1px solid #49321d",
    background: "linear-gradient(180deg, #24170e, #160e09)",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 12,
    top: 17,
    border: "1px solid #594027",
    background: "#1a1009",
    color: "#d4a359",
    padding: "7px 10px",
    borderRadius: 5,
    cursor: "pointer",
  },
  title: {
    fontSize: 20,
    fontWeight: 900,
    color: "#f1bd58",
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 7,
    color: "#9b8060",
    fontSize: 12,
  },
  balanceCard: {
    margin: 12,
    padding: "20px 12px 14px",
    textAlign: "center",
    border: "1px solid #8b642d",
    borderRadius: 9,
    background:
      "radial-gradient(circle at 50% 0%, #503319 0%, #24170d 50%, #170e08 100%)",
    boxShadow: "0 0 20px #b47b291c",
  },
  balanceIcon: { fontSize: 34 },
  balanceLabel: {
    marginTop: 5,
    fontSize: 13,
    color: "#c9a574",
  },
  balanceValue: {
    marginTop: 5,
    fontSize: 36,
    fontWeight: 900,
    color: "#ffd16b",
    textShadow: "0 0 12px #f0a52b55",
  },
  balanceCaption: {
    marginTop: 4,
    fontSize: 11,
    color: "#927653",
  },
  summary: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 13,
    borderTop: "1px solid #5c4024",
  },
  summaryItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  summaryDivider: {
    width: 1,
    height: 34,
    background: "#634728",
  },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    color: "#f0c47c",
  },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    color: "#f0c47c",
  },
  sectionHeadingSmall: { color: "#947b5b" },
  slotList: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    padding: "0 10px",
  },
  slotCard: {
    padding: 12,
    border: "1px solid #49321e",
    borderRadius: 7,
    background: "linear-gradient(135deg, #24170e, #170e09)",
  },
  slotTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  slotIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #70502c",
    borderRadius: 6,
    background: "#130c07",
    fontSize: 24,
  },
  slotInfo: { flex: 1, minWidth: 0 },
  starLine: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    marginTop: 5,
    fontSize: 17,
  },
  slotPower: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
    color: "#f2c16c",
  },
  progressTrack: {
    height: 5,
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 5,
    background: "#392719",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    background: "linear-gradient(90deg, #a56b24, #ffd16b)",
    transition: "width 0.3s",
  },
  upgradeDetails: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
    fontSize: 11,
    color: "#947b5b",
  },
  upgradeDetails div: { display: "flex", flexDirection: "column", gap: 4 },
  cost: { textAlign: "right" },
  upgradeButton: {
    width: "100%",
    marginTop: 12,
    padding: 11,
    border: "1px solid #d39a3e",
    borderRadius: 5,
    background: "linear-gradient(180deg, #a96e25, #70451a)",
    color: "#fff0cf",
    fontWeight: 900,
    letterSpacing: 0.5,
    cursor: "pointer",
  },
  disabledButton: {
    borderColor: "#51402b",
    background: "#302317",
    color: "#8a765b",
    cursor: "not-allowed",
  },
  missing: {
    marginTop: 8,
    textAlign: "center",
    color: "#d28c6c",
    fontSize: 12,
  },
  maxed: {
    marginTop: 13,
    padding: 9,
    textAlign: "center",
    borderRadius: 4,
    background: "#27301b",
    color: "#a9cb70",
    fontWeight: 700,
  },
  notice: {
    margin: "10px 12px",
    padding: 11,
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    background: "#26301b",
    border: "1px solid #526c34",
    borderRadius: 5,
    color: "#c2df8a",
    fontSize: 12,
  },
  error: {
    margin: 12,
    padding: 11,
    background: "#401d16",
    border: "1px solid #854332",
    borderRadius: 5,
    color: "#ffb5a2",
    fontSize: 12,
  },
  infoCard: {
    margin: 12,
    padding: 14,
    border: "1px solid #49321e",
    borderRadius: 7,
    background: "#1c120b",
  },
  infoTitle: {
    color: "#f0c47c",
    fontWeight: 700,
  },
  infoCardText: {
    color: "#a68b68",
    fontSize: 12,
    lineHeight: 1.6,
  },
  footer: {
    padding: "10px 15px",
    textAlign: "center",
    color: "#80694d",
    fontSize: 11,
  },
};
