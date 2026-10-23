
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Trophy,
  Swords,
  Flag,
  Clock3,
  Coins,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Shield,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const COLORS = {
  bg: "#120E0B",
  panel: "#1D1714",
  panel2: "#211811",
  border: "#493729",
  gold: "#E8A23B",
  text: "#F0DFCA",
  muted: "#A99A89",
  green: "#8BCB8B",
  red: "#E78C78",
};

function formatRemaining(value) {
  if (!value) return "";
  const ms = new Date(value).getTime() - Date.now();
  if (ms <= 0) return "Доступно зараз";

  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  return `${hours}г ${minutes}хв ${seconds}с`;
}

function Panel({ children, style = {} }) {
  return (
    <section
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 14,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function ActionButton({
  children,
  onClick,
  disabled = false,
  secondary = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        minHeight: 44,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 10,
        border: `1px solid ${secondary ? COLORS.border : "#9C6B2F"}`,
        background: secondary ? "#211811" : "#6E451F",
        color: disabled ? "#766858" : COLORS.text,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function Career() {
  const [career, setCareer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [now, setNow] = useState(Date.now());

  const loadCareer = useCallback(async () => {
    const { data, error } = await supabase.rpc("career_get_state");

    if (error) throw error;

    setCareer(data?.career ?? null);
    setProfile(data?.profile ?? null);
  }, []);

  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc("career_get_state");
        if (error) throw error;

        if (alive) {
          setCareer(data?.career ?? null);
          setProfile(data?.profile ?? null);
        }
      } catch (error) {
        if (alive) {
          setMessage({
            type: "error",
            text: error.message || "Не вдалося завантажити кар’єру.",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    init();

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  async function perform(action, successText) {
    try {
      setBusy(true);
      setMessage(null);

      const { data, error } = await supabase.rpc(action.name, action.args || {});
      if (error) throw error;

      await loadCareer();

      setMessage({
        type: "success",
        text: typeof successText === "function" ? successText(data) : successText,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Сталася помилка.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <RefreshCw size={26} color={COLORS.gold} />
        <p>Завантажуємо кар’єру…</p>
      </div>
    );
  }

  if (!career) {
    return (
      <div style={styles.page}>
        <Panel>Не вдалося отримати дані кар’єри. Онови сторінку.</Panel>
      </div>
    );
  }

  const chapter = Number(career.chapter || 1);
  const rank = Number(career.current_rank || 100);
  const fightsUsed = Number(career.fights_used || 0);
  const fightsLeft = Math.max(0, 5 - fightsUsed);
  const won = Boolean(career.chapter_won);
  const retryAt = career.retry_at;
  const retryRemaining =
    retryAt && new Date(retryAt).getTime() > now
      ? formatRemaining(retryAt)
      : null;

  const claimed = Array.isArray(career.banners_claimed)
    ? career.banners_claimed
    : [];

  const attemptsToday =
    career.attempts_date === new Date().toISOString().slice(0, 10)
      ? Number(career.attempts_today || 0)
      : 0;

  const retryCost = (attemptsToday + 1) * 10;
  const canFight = !won && fightsUsed < 5 && !busy;
  const canRetry = !won && fightsUsed >= 5 && !busy;

  return (
    <main style={styles.page}>
      <header style={styles.heading}>
        <div style={styles.eyebrow}>ШЛЯХ ДО ВЕРШИНИ</div>
        <h1 style={styles.title}>Кар’єра</h1>
        <p style={styles.subtitle}>
          Пройди турнір глави, посідай перше місце та відкривай нові випробування.
        </p>
      </header>

      {message && (
        <div
          role="status"
          style={{
            ...styles.message,
            borderColor: message.type === "error" ? "#75443A" : "#45643D",
            color: message.type === "error" ? COLORS.red : COLORS.green,
          }}
        >
          {message.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            style={styles.closeMessage}
            aria-label="Закрити"
          >
            ×
          </button>
        </div>
      )}

      <Panel style={styles.heroPanel}>
        <div style={styles.heroTop}>
          <div>
            <div style={styles.eyebrow}>ПОТОЧНИЙ ТУРНІР</div>
            <h2 style={styles.chapterTitle}>Глава {chapter}</h2>
            <p style={styles.subtitle}>
              {won
                ? "Перемога! Наступна глава чекає на тебе."
                : "П’ять боїв, щоб здобути перше місце."}
            </p>
          </div>

          <div style={styles.rankBadge}>
            <Trophy size={25} color={COLORS.gold} />
            <strong>{rank}</strong>
            <span>МІСЦЕ</span>
          </div>
        </div>

        <div style={styles.progressHeader}>
          <span>Прогрес турніру</span>
          <strong>{fightsUsed} / 5 боїв</strong>
        </div>

        <div style={styles.fightProgress}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              style={{
                ...styles.progressSegment,
                background: n <= fightsUsed ? COLORS.gold : "#493729",
              }}
            />
          ))}
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <Swords size={19} color={COLORS.gold} />
            <strong>{fightsLeft}</strong>
            <span>боїв залишилось</span>
          </div>
          <div style={styles.statBox}>
            <Shield size={19} color={COLORS.gold} />
            <strong>{chapter}</strong>
            <span>поточна глава</span>
          </div>
          <div style={styles.statBox}>
            <Sparkles size={19} color={COLORS.gold} />
            <strong>{Number(career.stardust || 0)}</strong>
            <span>зоряний пил</span>
          </div>
        </div>

        {won ? (
          <div style={styles.victoryBox}>
            <Trophy size={26} color={COLORS.gold} />
            <h3 style={{ margin: "8px 0" }}>Перше місце здобуто!</h3>
            <p style={styles.subtitle}>
              Усі три вимпели сьогодні можна забрати безкоштовно.
            </p>
            <ActionButton
              disabled={busy}
              onClick={() =>
                perform(
                  { name: "career_next_chapter" },
                  "Відкрито наступну главу!"
                )
              }
            >
              Відкрити главу {chapter + 1}
              <ChevronRight size={18} />
            </ActionButton>
          </div>
        ) : fightsUsed >= 5 ? (
          <div style={styles.retryBox}>
            <Clock3 size={22} color={COLORS.gold} />
            <h3 style={{ margin: "8px 0" }}>Турнір завершено</h3>
            <p style={styles.subtitle}>
              {retryRemaining
                ? `Безкоштовна спроба буде доступна через ${retryRemaining}.`
                : "Можна розпочати нову спробу."}
            </p>
            <ActionButton
              disabled={!canRetry}
              onClick={() =>
                perform(
                  { name: "career_open_retry" },
                  (data) => `Нову спробу відкрито. Витрачено ${data.cost} золота.`
                )
              }
            >
              <Coins size={18} />
              Відкрити за {retryCost} золота
            </ActionButton>
            <p style={styles.smallNote}>
              Ціна зростає на 10 золота з кожним платним відкриттям протягом доби.
            </p>
          </div>
        ) : (
          <ActionButton
            disabled={!canFight}
            onClick={() =>
              perform(
                { name: "career_fight" },
                (data) =>
                  data.chapter_won
                    ? "Перемога! Ти посів перше місце й відкрив наступну главу."
                    : `${data.won ? "Перемога в бою!" : "Бій програно."} Місце: ${data.rank}. Отримано ${data.silver_reward} срібла та ${data.experience_reward} досвіду.`
              )
            }
          >
            <Swords size={19} />
            Провести бій
          </ActionButton>
        )}
      </Panel>

      <section style={styles.section}>
        <div style={styles.sectionHeading}>
          <Flag size={19} color={COLORS.gold} />
          <h2>Щоденні вимпели</h2>
        </div>
        <p style={styles.subtitle}>
          Нагороди залежать від глави. Вимпели оновлюються щодня за часом,
          налаштованим на сервері.
        </p>

        <div style={styles.bannerGrid}>
          {[1, 2, 3].map((number) => {
            const isClaimed = claimed.includes(number);
            const cost = won ? 0 : number === 1 ? 0 : number === 2 ? 10 : 50;

            return (
              <Panel key={number} style={styles.bannerCard}>
                <div style={styles.bannerIcon}>
                  <Flag size={29} color={COLORS.gold} />
                </div>
                <h3 style={styles.bannerTitle}>Вимпел {number}</h3>
                <div style={styles.bannerCost}>
                  {isClaimed
                    ? "Отримано"
                    : cost === 0
                    ? "Безкоштовно"
                    : `${cost} золота`}
                </div>
                <p style={styles.bannerDescription}>
                  Випадкова нагорода
                </p>
                <ActionButton
                  secondary
                  disabled={busy || isClaimed}
                  onClick={() =>
                    perform(
                      {
                        name: "career_claim_banner",
                        args: { p_banner: number },
                      },
                      (data) =>
                        `Вимпел отримано: +${data.silver} срібла, +${data.experience} досвіду, +${data.stardust} зоряного пилу.`
                    )
                  }
                >
                  {isClaimed ? (
                    <>
                      <CheckCircle2 size={16} />
                      Отримано
                    </>
                  ) : (
                    "Відкрити"
                  )}
                </ActionButton>
              </Panel>
            );
          })}
        </div>
      </section>

      <Panel>
        <h2 style={styles.infoTitle}>Правила кар’єри</h2>
        <ul style={styles.rules}>
          <li>Нова глава починається зі 100-го місця.</li>
          <li>На турнір дається п’ять боїв.</li>
          <li>Перше місце відкриває наступну главу.</li>
          <li>Після п’яти боїв без перемоги повторна спроба доступна через 8 годин.</li>
          <li>Повторне відкриття коштує 10, 20, 30 золота й далі за зростанням.</li>
        </ul>
      </Panel>

      <div style={styles.footer}>
        Глава {chapter} · Прогрес зберігається на сервері
      </div>
    </main>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 760,
    margin: "0 auto",
    padding: "4px 0 28px",
    color: COLORS.text,
    boxSizing: "border-box",
  },
  center: {
    minHeight: 240,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    color: COLORS.muted,
  },
  heading: { marginBottom: 16 },
  eyebrow: {
    color: "#B99A70",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.8,
  },
  title: { fontSize: 28, margin: "5px 0", color: COLORS.text },
  chapterTitle: { fontSize: 24, margin: "7px 0", color: COLORS.text },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.6,
    margin: "6px 0 12px",
  },
  heroPanel: {
    background: "linear-gradient(145deg, #261C13, #1D1714)",
    marginBottom: 20,
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rankBadge: {
    minWidth: 82,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: 12,
    border: "1px solid #80603A",
    borderRadius: 12,
    background: "#302116",
  },
  rankBadgeStrong: { fontSize: 26 },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
    marginBottom: 9,
    fontSize: 12,
    color: COLORS.muted,
  },
  fightProgress: { display: "flex", gap: 5 },
  progressSegment: { height: 7, flex: 1, borderRadius: 10 },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 7,
    margin: "16px 0",
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    padding: "12px 4px",
    borderRadius: 10,
    background: COLORS.panel2,
    textAlign: "center",
  },
  victoryBox: {
    marginTop: 10,
    padding: 14,
    border: "1px solid #80603A",
    borderRadius: 12,
    background: "#302116",
    textAlign: "center",
  },
  retryBox: {
    marginTop: 10,
    padding: 14,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    background: COLORS.panel2,
    textAlign: "center",
  },
  smallNote: { fontSize: 10, color: COLORS.muted, lineHeight: 1.5 },
  section: { margin: "22px 0" },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 7,
  },
  bannerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  bannerCard: { padding: "12px 8px", textAlign: "center" },
  bannerIcon: {
    width: 52,
    height: 52,
    display: "grid",
    placeItems: "center",
    margin: "0 auto 7px",
    border: "1px solid #60472E",
    borderRadius: 12,
    background: "#302116",
  },
  bannerTitle: { fontSize: 13, margin: "6px 0", color: COLORS.text },
  bannerCost: { color: COLORS.gold, fontSize: 11, fontWeight: 800 },
  bannerDescription: { color: COLORS.muted, fontSize: 10, minHeight: 24 },
  infoTitle: { fontSize: 16, marginTop: 0 },
  rules: {
    paddingLeft: 18,
    marginBottom: 0,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 1.9,
  },
  message: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    padding: 11,
    border: "1px solid",
    borderRadius: 10,
    background: COLORS.panel2,
    fontSize: 12,
  },
  closeMessage: {
    marginLeft: "auto",
    border: 0,
    background: "transparent",
    color: COLORS.muted,
    fontSize: 20,
  },
  footer: {
    padding: 16,
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 10,
  },
};
    
