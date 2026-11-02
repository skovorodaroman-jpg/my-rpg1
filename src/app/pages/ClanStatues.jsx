import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Crown,
  Coins,
  Shield,
  Sparkles,
  Clock,
  TrendingUp,
  Lock,
  RefreshCw,
  Landmark,
  Zap,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const formatNumber = (value) =>
  Math.floor(Number(value) || 0).toLocaleString("uk-UA");

function getTimeLeft(date) {
  if (!date) return "";

  const milliseconds = new Date(date).getTime() - Date.now();

  if (milliseconds <= 0) return "Завершено";

  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} д. ${hours % 24} год.`;
  }

  return `${hours} год. ${minutes} хв.`;
}

export default function ClanStatues({
  clan,
  membership,
  onBack,
}) {
  const [statue, setStatue] = useState(null);
  const [buff, setBuff] = useState(null);
  const [treasury, setTreasury] = useState({
    gold: 0,
    silver: 0,
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const clanId = clan?.id;
  const clanLevel = Number(clan?.level || 1);
  const statueLevel = Number(clan?.statue_level ?? 0);

  const role = String(membership?.role || "").toLowerCase();
  const canManage = ["leader", "deputy"].includes(role);

  const loadData = useCallback(async () => {
    if (!clanId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        statueResult,
        buffResult,
        treasuryResult,
      ] = await Promise.all([
        supabase
          .from("clan_statue_levels")
          .select("level, resource_type, upgrade_cost, bonus_power")
          .order("level", { ascending: true }),

        supabase
          .from("clan_statue_buffs")
          .select("*")
          .eq("clan_id", clanId)
          .maybeSingle(),

        supabase
          .from("clan_treasury_transactions")
          .select("resource_type, transaction_type, amount")
          .eq("clan_id", clanId),
      ]);

      if (statueResult.error) throw statueResult.error;
      if (buffResult.error) throw buffResult.error;
      if (treasuryResult.error) throw treasuryResult.error;

      setStatue(statueResult.data || []);
      setBuff(buffResult.data || null);

      const totals = { gold: 0, silver: 0 };

      for (const transaction of treasuryResult.data || []) {
        if (!["gold", "silver"].includes(transaction.resource_type)) {
          continue;
        }

        const amount = Number(transaction.amount || 0);

        if (transaction.transaction_type === "deposit") {
          totals[transaction.resource_type] += amount;
        } else if (transaction.transaction_type === "withdrawal") {
          totals[transaction.resource_type] -= amount;
        }
      }

      setTreasury(totals);
    } catch (err) {
      console.error("Помилка завантаження статуї:", err);
      setError(err.message || "Не вдалося завантажити статую клану.");
    } finally {
      setLoading(false);
    }
  }, [clanId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const nextUpgrade = useMemo(
    () => statue?.find((item) => Number(item.level) === statueLevel + 1),
    [statue, statueLevel]
  );

  const currentStatue = useMemo(
    () => statue?.find((item) => Number(item.level) === statueLevel),
    [statue, statueLevel]
  );

  const permanentBonus = Number(currentStatue?.bonus_power || 0);

  const buffActive =
    buff && new Date(buff.expires_at).getTime() > now;

  const buffTimeLeft = buffActive
    ? getTimeLeft(buff.expires_at)
    : "";

  const canUpgrade =
    canManage &&
    nextUpgrade &&
    statueLevel < clanLevel &&
    statueLevel < 101;

  async function upgradeStatue() {
    if (!canUpgrade || busy) return;

    setBusy(true);
    setNotice("");
    setError("");

    try {
      const { data, error: rpcError } =
        await supabase.rpc("upgrade_clan_statue");

      if (rpcError) throw rpcError;

      const result = Array.isArray(data) ? data[0] : data;

      if (result?.success === false) {
        throw new Error(result.message || "Не вдалося прокачати статую.");
      }

      setNotice(
        `Статую покращено до рівня ${result?.new_level ?? statueLevel + 1}! Бонус: +${formatNumber(result?.bonus_power ?? nextUpgrade.bonus_power)} могутності.`
      );

      await loadData();
    } catch (err) {
      setError(err.message || "Помилка прокачування статуї.");
    } finally {
      setBusy(false);
    }
  }

  async function activateBuff(type) {
    if (!canManage || busy || statueLevel <= 0) return;

    setBusy(true);
    setNotice("");
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "activate_clan_statue_buff",
        { p_buff_type: type }
      );

      if (rpcError) throw rpcError;

      const result = Array.isArray(data) ? data[0] : data;

      if (result?.success === false) {
        throw new Error(result.message || "Не вдалося активувати баф.");
      }

      setNotice(
        `${type === "gold" ? "Золотий" : "Срібний"} баф активовано на 72 години!`
      );

      await loadData();
    } catch (err) {
      setError(err.message || "Помилка активації бафа.");
    } finally {
      setBusy(false);
    }
  }

  const goldBuffCost = statueLevel * 2;
  const silverBuffCost = statueLevel * 6000;

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Завантаження статуї...</div>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <button style={styles.backButton} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>

          <div>
            <div style={styles.eyebrow}>РОЗВИТОК КЛАНУ</div>
            <h1 style={styles.title}>Статуя клану</h1>
            <p style={styles.subtitle}>{clan?.name || "Клан"}</p>
          </div>

          <div style={styles.headerIcon}>
            <Landmark size={28} />
          </div>
        </header>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.statueCard}>
          <div style={styles.statueGlow}>
            <Crown size={62} />
          </div>

          <div style={styles.statueName}>Статуя могутності</div>

          <div style={styles.level}>
            Рівень {statueLevel}
            <span> / {clanLevel}</span>
          </div>

          <div style={styles.levelTrack}>
            <div
              style={{
                ...styles.levelProgress,
                width: `${Math.min(
                  100,
                  clanLevel > 0 ? (statueLevel / clanLevel) * 100 : 0
                )}%`,
              }}
            />
          </div>

          <div style={styles.permanentBonus}>
            <Zap size={20} />
            <span>Постійний бонус усім учасникам</span>
            <strong>+{formatNumber(permanentBonus)}</strong>
          </div>

          <div style={styles.description}>
            Статуя посилює могутність кожного учасника клану.
            Покращення діють постійно.
          </div>
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionTitle}>
            <TrendingUp size={20} />
            Прокачування статуї
          </div>

          {nextUpgrade && statueLevel < clanLevel && statueLevel < 101 ? (
            <>
              <div style={styles.upgradeInfo}>
                <div>
                  <span style={styles.muted}>Наступний рівень</span>
                  <strong style={styles.upgradeLevel}>
                    {nextUpgrade.level}
                  </strong>
                </div>

                <div style={styles.bonusBox}>
                  <span style={styles.muted}>Новий постійний бонус</span>
                  <strong>+{formatNumber(nextUpgrade.bonus_power)}</strong>
                </div>
              </div>

              <div style={styles.costRow}>
                <span>Вартість покращення</span>
                <strong>
                  {formatNumber(nextUpgrade.upgrade_cost)}{" "}
                  {nextUpgrade.resource_type === "gold" ? "золота" : "срібла"}
                </strong>
              </div>

              <div style={styles.costRow}>
                <span>У казні клану</span>
                <strong>
                  {formatNumber(treasury[nextUpgrade.resource_type])}{" "}
                  {nextUpgrade.resource_type === "gold" ? "золота" : "срібла"}
                </strong>
              </div>

              {canManage ? (
                <button
                  style={{
                    ...styles.mainButton,
                    opacity: busy ? 0.6 : 1,
                  }}
                  disabled={busy}
                  onClick={upgradeStatue}
                >
                  <Sparkles size={19} />
                  {busy
                    ? "Виконується..."
                    : `Покращити до ${nextUpgrade.level} рівня`}
                </button>
              ) : (
                <div style={styles.permissionNote}>
                  <Lock size={16} />
                  Покращувати статую можуть Лідер і Заступник.
                </div>
              )}
            </>
          ) : (
            <div style={styles.maxLevel}>
              <Crown size={28} />
              <strong>
                {statueLevel >= 101
                  ? "Досягнуто максимального рівня!"
                  : "Статуя досягла рівня клану"}
              </strong>
              <span>
                Щоб покращити статую далі, спочатку підвищте рівень клану.
              </span>
            </div>
          )}
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionTitle}>
            <Shield size={20} />
            Тимчасові посилення
          </div>

          <div style={styles.buffNotice}>
            <Clock size={17} />
            Кожне активоване посилення діє 72 години.
          </div>

          {buffActive ? (
            <div style={styles.activeBuff}>
              <div style={styles.activeBuffTitle}>
                <Sparkles size={20} />
                Активне посилення
              </div>

              <strong>
                {buff.buff_type === "gold"
                  ? "Золотий баф"
                  : "Срібний баф"}
              </strong>

              <div style={styles.activeBuffBonus}>
                +{formatNumber(buff.buff_power)} могутності
              </div>

              <div style={styles.timer}>
                <Clock size={16} />
                Залишилося: {buffTimeLeft}
              </div>
            </div>
          ) : (
            <div style={styles.noBuff}>
              Наразі тимчасових посилень немає.
            </div>
          )}

          <div style={styles.buffGrid}>
            <div style={styles.buffCard}>
              <div style={styles.buffIconGold}>🪙</div>
              <strong>Золотий баф</strong>
              <span style={styles.buffDescription}>
                Тимчасове посилення могутності всіх учасників.
              </span>

              <div style={styles.buffPrice}>
                <Coins size={16} />
                {formatNumber(goldBuffCost)} золота
              </div>

              <button
                style={styles.goldButton}
                disabled={!canManage || busy || statueLevel <= 0 || buffActive}
                onClick={() => activateBuff("gold")}
              >
                {buffActive
                  ? "Недоступно"
                  : busy
                    ? "Зачекай..."
                    : "Активувати"}
              </button>
            </div>

            <div style={styles.buffCard}>
              <div style={styles.buffIconSilver}>⚪</div>
              <strong>Срібний баф</strong>
              <span style={styles.buffDescription}>
                Тимчасове посилення могутності всіх учасників.
              </span>

              <div style={styles.buffPrice}>
                <Coins size={16} />
                {formatNumber(silverBuffCost)} срібла
              </div>

              <button
                style={styles.silverButton}
                disabled={!canManage || busy || statueLevel <= 0 || buffActive}
                onClick={() => activateBuff("silver")}
              >
                {buffActive
                  ? "Недоступно"
                  : busy
                    ? "Зачекай..."
                    : "Активувати"}
              </button>
            </div>
          </div>

          {!canManage && (
            <div style={styles.permissionNote}>
              <Lock size={16} />
              Активувати бафи можуть Лідер і Заступник.
            </div>
          )}
        </section>

        <section style={styles.panel}>
          <div style={styles.sectionTitle}>
            <Zap size={20} />
            Правила статуї
          </div>

          <div style={styles.rule}>
            <span>🏛️</span>
            Постійний бонус отримують усі учасники клану.
          </div>

          <div style={styles.rule}>
            <span>⚔️</span>
            Рівень статуї не може перевищувати рівень клану.
          </div>

          <div style={styles.rule}>
            <span>🪙</span>
            Покращення та бафи оплачуються з казни клану.
          </div>

          <div style={styles.rule}>
            <span>⏳</span>
            Тимчасові бафи діють 72 години.
          </div>
        </section>

        <button
          style={styles.refreshButton}
          onClick={loadData}
          disabled={busy}
        >
          <RefreshCw size={17} />
          Оновити дані
        </button>

        <button style={styles.backBottom} onClick={onBack}>
          <ArrowLeft size={18} />
          Повернутися до клану
        </button>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#120E0B",
    color: "#D4B382",
    padding: "14px 12px 90px",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: 520,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0 18px",
    borderBottom: "1px solid #38291C",
  },
  backButton: {
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    background: "#211811",
    border: "1px solid #59432C",
    borderRadius: 8,
    color: "#D4B382",
  },
  eyebrow: {
    color: "#A27A43",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 700,
  },
  title: {
    margin: "3px 0",
    fontSize: 23,
    color: "#E8C58D",
  },
  subtitle: {
    margin: 0,
    color: "#947B5D",
    fontSize: 12,
  },
  headerIcon: {
    marginLeft: "auto",
    color: "#E8A23B",
  },
  loading: {
    textAlign: "center",
    padding: 40,
  },
  notice: {
    padding: 12,
    marginTop: 12,
    border: "1px solid #537A38",
    borderRadius: 8,
    background: "#1B2A16",
    color: "#A8D783",
    fontSize: 13,
  },
  error: {
    padding: 12,
    marginTop: 12,
    border: "1px solid #853D32",
    borderRadius: 8,
    background: "#321713",
    color: "#FFB2A5",
    fontSize: 13,
  },
  statueCard: {
    marginTop: 16,
    padding: 20,
    textAlign: "center",
    border: "1px solid #76552F",
    borderRadius: 12,
    background:
      "radial-gradient(circle at 50% 25%, #493019 0%, #21160F 48%, #17100C 100%)",
  },
  statueGlow: {
    width: 112,
    height: 112,
    margin: "0 auto 12px",
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    color: "#F3BD58",
    background: "radial-gradient(circle, #76512A, #2B1B10)",
    boxShadow: "0 0 35px #D78A2933",
  },
  statueName: {
    fontSize: 19,
    fontWeight: 700,
    color: "#F0D3A1",
  },
  level: {
    marginTop: 8,
    fontSize: 27,
    fontWeight: 800,
    color: "#F4B64D",
  },
  levelTrack: {
    height: 9,
    marginTop: 13,
    overflow: "hidden",
    borderRadius: 10,
    background: "#100B08",
  },
  levelProgress: {
    height: "100%",
    borderRadius: 10,
    background: "linear-gradient(90deg, #A76A24, #F5C15C)",
  },
  permanentBonus: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
    padding: 12,
    borderRadius: 8,
    background: "#302116",
    color: "#E8C58D",
    fontSize: 12,
  },
  permanentBonus: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
    padding: 12,
    borderRadius: 8,
    background: "#302116",
    color: "#E8C58D",
    fontSize: 12,
  },
  description: {
    marginTop: 13,
    color: "#A58A68",
    fontSize: 12,
    lineHeight: 1.6,
  },
  panel: {
    marginTop: 14,
    padding: 15,
    border: "1px solid #463322",
    borderRadius: 10,
    background: "#1D1714",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 15,
    fontWeight: 700,
    color: "#E8C58D",
    fontSize: 16,
  },
  upgradeInfo: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    background: "#17110D",
    borderRadius: 8,
  },
  muted: {
    display: "block",
    color: "#9C8261",
    fontSize: 11,
  },
  upgradeLevel: {
    display: "block",
    marginTop: 5,
    fontSize: 25,
    color: "#E8A23B",
  },
  bonusBox: {
    textAlign: "right",
  },
  costRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "12px 2px",
    borderBottom: "1px solid #35271D",
    fontSize: 12,
  },
  mainButton: {
    width: "100%",
    minHeight: 48,
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    border: "1px solid #E8A23B",
    borderRadius: 8,
    background: "linear-gradient(135deg, #A66A24, #D99432)",
    color: "#1B1008",
    fontWeight: 800,
    fontSize: 14,
  },
  permissionNote: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 13,
    color: "#A58A68",
    fontSize: 12,
  },
  maxLevel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 9,
    padding: 15,
    textAlign: "center",
    color: "#E8B85C",
  },
  buffNotice: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    color: "#A58A68",
    fontSize: 12,
  },
  activeBuff: {
    padding: 13,
    marginBottom: 14,
    border: "1px solid #527A3B",
    borderRadius: 8,
    background: "#1C2B17",
    color: "#B9E29A",
  },
  activeBuffTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    fontSize: 12,
  },
  activeBuffBonus: {
    marginTop: 7,
    fontSize: 20,
    fontWeight: 800,
  },
  timer: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginTop: 9,
    fontSize: 12,
  },
  noBuff: {
    padding: 12,
    marginBottom: 14,
    borderRadius: 8,
    background: "#17110D",
    color: "#9C8261",
    fontSize: 12,
  },
  buffGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  buffCard: {
    minWidth: 0,
    padding: 11,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    border: "1px solid #493625",
    borderRadius: 8,
    background: "#17110D",
  },
  buffIconGold: {
    fontSize: 28,
    marginBottom: 8,
  },
  buffIconSilver: {
    fontSize: 28,
    marginBottom: 8,
  },
  buffDescription: {
    minHeight: 48,
    marginTop: 7,
    color: "#9C8261",
    fontSize: 11,
    lineHeight: 1.4,
  },
  buffPrice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
    fontSize: 11,
    fontWeight: 700,
  },
  goldButton: {
    width: "100%",
    minHeight: 38,
    marginTop: 12,
    border: "1px solid #C78C30",
    borderRadius: 6,
    background: "#80501C",
    color: "#FFE0A2",
    fontWeight: 700,
  },
  silverButton: {
    width: "100%",
    minHeight: 38,
    marginTop: 12,
    border: "1px solid #A6A6A6",
    borderRadius: 6,
    background: "#57534E",
    color: "#FFFFFF",
    fontWeight: 700,
  },
  rule: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #35271D",
    color: "#B9A080",
    fontSize: 12,
    lineHeight: 1.5,
  },
  refreshButton: {
    width: "100%",
    minHeight: 42,
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "1px solid #59432C",
    borderRadius: 7,
    background: "#211811",
    color: "#D4B382",
  },
  backBottom: {
    width: "100%",
    minHeight: 44,
    marginTop: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "1px solid #463322",
    borderRadius: 7,
    background: "transparent",
    color: "#B99A70",
  },
};
