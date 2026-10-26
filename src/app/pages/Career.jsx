
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
  Gift,
  LockKeyhole,
} from "lucide-react";

const C = {
  bg: "#120E0B",
  panel: "#1D1714",
  panel2: "#211811",
  border: "#493729",
  gold: "#E8A23B",
  goldLight: "#F0C37C",
  text: "#F0DFCA",
  muted: "#A99A89",
  green: "#8BCB8B",
  red: "#E78C78",
};

function formatRemaining(value, now = Date.now()) {
  if (!value) return "";
  const ms = new Date(value).getTime() - now;
  if (ms <= 0) return "Доступно зараз";

  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return `${hours}г ${minutes}хв ${seconds}с`;
}

function Panel({ children, style = {} }) {
  return (
    <section style={{ ...S.panel, ...style }}>
      {children}
    </section>
  );
}

function Button({
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
        ...S.button,
        border: `1px solid ${secondary ? C.border : "#A87331"}`,
        background: disabled
          ? "#29231D"
          : secondary
            ? "linear-gradient(135deg, #30241A, #211811)"
            : "linear-gradient(135deg, #B97827, #75451C)",
        color: disabled ? "#817364" : C.text,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={S.sectionTitle}>
      <Icon size={19} color={C.gold} />
      <h2 style={S.sectionHeading}>{children}</h2>
    </div>
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
    let timeoutId;

    try {
      const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              "Запит триває понад 15 секунд. Перевір з'єднання та RPC career_get_state."
            )
          );
        }, 15000);
      });

      const request = supabase.rpc("career_get_state");
      const { data, error } = await Promise.race([
        request,
        timeout,
      ]);

      if (error) throw error;

      if (!data || typeof data !== "object" || !data.career) {
        throw new Error(
          "Supabase не повернув поле career. Перевір SQL-функцію career_get_state."
        );
      }

      setCareer(data.career);
      setProfile(data.profile ?? null);

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        setLoading(true);
        setMessage(null);
        await loadCareer();
      } catch (error) {
        if (alive) {
          setCareer(null);
          setMessage({
            type: "error",
            text: error?.message || "Не вдалося завантажити кар’єру.",
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
  }, [loadCareer]);

  async function perform(action, successText) {
    if (busy) return null;

    try {
      setBusy(true);
      setMessage(null);

      const { data, error } = await supabase.rpc(
        action.name,
        action.args || {}
      );

      if (error) throw error;

      await loadCareer();

      setMessage({
        type: "success",
        text:
          typeof successText === "function"
            ? successText(data)
            : successText,
      });

      return data;
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Сталася помилка.",
      });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function retryLoad() {
    try {
      setLoading(true);
      setMessage(null);
      await loadCareer();
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.message || "Помилка завантаження.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main style={S.page}>
        <div style={S.center}>
          <RefreshCw size={28} color={C.gold} />
          <p>Завантажуємо кар’єру…</p>
          <span style={S.smallNote}>
            Якщо запит зависне, з’явиться повідомлення про помилку.
          </span>
        </div>
      </main>
    );
  }

  if (!career) {
    return (
      <main style={S.page}>
        <Panel>
          <AlertCircle size={26} color={C.red} />
          <h2 style={S.boxTitle}>Кар’єра не завантажилась</h2>

          {message && (
            <p style={S.errorText}>{message.text}</p>
          )}

          <Button onClick={retryLoad} disabled={loading}>
            <RefreshCw size={17} />
            Спробувати ще раз
          </Button>
        </Panel>
      </main>
    );
  }

  const chapter = Number(career.chapter ?? 1);
  const rank = Number(career.place ?? career.current_rank ?? 100);
  const fightsUsed = Number(
    career.battles_used ?? career.fights_used ?? 0
  );
  const fightsLeft = Math.max(0, 5 - fightsUsed);
  const won = rank === 1 || Boolean(career.chapter_won);

  const retryAt = career.locked_until ?? career.retry_at ?? null;
  const retryLocked =
    Boolean(retryAt) && new Date(retryAt).getTime() > now;

  const earlyUnlocks = Number(
    career.early_unlocks_today ?? career.attempts_today ?? 0
  );

  const retryCost = retryLocked ? (earlyUnlocks + 1) * 10 : 0;
  const canFight = !won && fightsUsed < 5 && !busy;
  const canRetry = !won && fightsUsed >= 5 && !busy;

  const claimed = Array.isArray(career.banners_claimed)
    ? career.banners_claimed.map(Number)
    : [];

  const stardust = Number(
    profile?.stardust ?? career.stardust ?? 0
  );
  const gold = Number(profile?.gold ?? 0);

  return (
    <main style={S.page}>
      <header style={S.header}>
        <div style={S.eyebrow}>ШЛЯХ ДО ВЕРШИНИ</div>
        <h1 style={S.title}>Кар’єра</h1>
        <p style={S.subtitle}>
          Пройди турнір глави, здобудь перше місце та відкрий
          нові випробування Ельдари.
        </p>
      </header>

      {message && (
        <div
          role="status"
          style={{
            ...S.message,
            borderColor:
              message.type === "error" ? "#75443A" : "#45643D",
            color:
              message.type === "error" ? C.red : C.green,
          }}
        >
          {message.type === "error" ? (
            <AlertCircle size={19} />
          ) : (
            <CheckCircle2 size={19} />
          )}

          <span style={{ flex: 1, overflowWrap: "anywhere" }}>
            {message.text}
          </span>

          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Закрити повідомлення"
            style={S.closeMessage}
          >
            ×
          </button>
        </div>
      )}

      <Panel style={S.heroPanel}>
        <div style={S.heroTop}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.eyebrow}>ПОТОЧНИЙ ТУРНІР</div>
            <h2 style={S.chapterTitle}>Глава {chapter}</h2>
            <p style={S.subtitle}>
              {won
                ? "Перше місце здобуто. Наступна глава чекає!"
                : "Використай п’ять боїв, щоб посісти перше місце."}
            </p>
          </div>

          <div style={S.rankBadge}>
            <Trophy size={25} color={C.gold} />
            <strong style={S.rankNumber}>{rank}</strong>
            <span style={S.rankLabel}>МІСЦЕ</span>
          </div>
        </div>

        <div style={S.progressHeader}>
          <span>Прогрес турніру</span>
          <strong>{fightsUsed} / 5 боїв</strong>
        </div>

        <div style={S.fightProgress}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              style={{
                ...S.progressSegment,
                background: n <= fightsUsed ? C.gold : "#493729",
              }}
            />
          ))}
        </div>

        <div style={S.statsRow}>
          <div style={S.statBox}>
            <Swords size={20} color={C.gold} />
            <strong style={S.statNumber}>{fightsLeft}</strong>
            <span style={S.statLabel}>боїв залишилось</span>
          </div>

          <div style={S.statBox}>
            <Shield size={20} color={C.gold} />
            <strong style={S.statNumber}>{chapter}</strong>
            <span style={S.statLabel}>поточна глава</span>
          </div>

          <div style={S.statBox}>
            <Sparkles size={20} color={C.gold} />
            <strong style={S.statNumber}>
              {stardust.toLocaleString("uk-UA")}
            </strong>
            <span style={S.statLabel}>зоряний пил</span>
          </div>
        </div>

        <div style={S.balanceBar}>
          <Coins size={17} color={C.gold} />
          <span>Твоє золото</span>
          <strong style={{ marginLeft: "auto", color: C.goldLight }}>
            {gold.toLocaleString("uk-UA")}
          </strong>
        </div>

        {won ? (
          <div style={S.victoryBox}>
            <Trophy size={30} color={C.gold} />
            <h3 style={S.boxTitle}>Перше місце здобуто!</h3>
            <p style={S.subtitle}>
              Відкрий наступну главу. Новий турнір розпочнеться
              зі 100-го місця.
            </p>

            <Button
              disabled={busy}
              onClick={() =>
                perform(
                  { name: "career_next_chapter" },
                  `Главу ${chapter + 1} відкрито!`
                )
              }
            >
              {busy ? "Зачекай..." : `Відкрити главу ${chapter + 1}`}
              <ChevronRight size={18} />
            </Button>
          </div>
        ) : fightsUsed >= 5 ? (
          <div style={S.retryBox}>
            <Clock3 size={25} color={C.gold} />
            <h3 style={S.boxTitle}>Турнір завершено</h3>

            <p style={S.subtitle}>
              {retryLocked
                ? `Безкоштовне відкриття буде доступне через ${formatRemaining(
                    retryAt,
                    now
                  )}.`
                : "Можна розпочати нову спробу безкоштовно."}
            </p>

            <Button
              disabled={!canRetry}
              onClick={() =>
                perform(
                  { name: "career_open_retry" },
                  (data) =>
                    data?.paid
                      ? `Спробу відкрито достроково. Витрачено ${
                          data.cost ?? 0
                        } золота.`
                      : "Нову спробу відкрито безкоштовно!"
                )
              }
            >
              {retryLocked ? (
                <Coins size={18} />
              ) : (
                <RefreshCw size={18} />
              )}
              {retryLocked
                ? `Достроково відкрити за ${retryCost} золота`
                : "Відкрити безкоштовно"}
            </Button>

            {retryLocked && (
              <p style={S.smallNote}>
                Кожне платне відкриття коштує на 10 золота більше
                за попереднє протягом ігрової доби.
              </p>
            )}
          </div>
        ) : (
          <div>
            <Button
              disabled={!canFight}
              onClick={() =>
                perform(
                  { name: "career_fight" },
                  (data) => {
                    const newRank = data?.place ?? data?.rank ?? rank;
                    const battleWon = Boolean(data?.won);

                    if (data?.chapter_won || Number(newRank) === 1) {
                      return "Перше місце здобуто! Тепер можеш відкрити наступну главу.";
                    }

                    return `${
                      battleWon ? "Перемога в бою!" : "Бій завершено."
                    } Місце: ${newRank}. Отримано ${
                      data?.silver_reward ?? data?.silver ?? 0
                    } срібла та ${
                      data?.experience_reward ?? data?.experience ?? 0
                    } досвіду.`;
                  }
                )
              }
            >
              <Swords size={19} />
              {busy ? "Бій триває..." : "Провести бій"}
            </Button>

            <p style={S.smallNote}>
              Після п’ятого бою без першого місця доведеться
              чекати 8 годин або відкрити спробу достроково.
            </p>
          </div>
        )}
      </Panel>

      <section style={S.section}>
        <SectionTitle icon={Flag}>Щоденні вимпели</SectionTitle>

        <p style={S.subtitle}>
          Отримуй срібло, досвід і зоряний пил. Нагороди
          збільшуються з кожною главою. Вимпели оновлюються
          щодня о 10:00 за київським часом.
        </p>

        <div style={S.bannerGrid}>
          {[1, 2, 3].map((number) => {
            const isClaimed = claimed.includes(number);
            const cost = won
              ? 0
              : number === 1
                ? 0
                : number === 2
                  ? 10
                  : 50;

            return (
              <Panel key={number} style={S.bannerCard}>
                <div style={S.bannerIcon}>
                  <Flag size={28} color={C.gold} />
                  <span style={S.bannerNumber}>{number}</span>
                </div>

                <h3 style={S.bannerTitle}>Вимпел {number}</h3>

                <div
                  style={{
                    ...S.bannerCost,
                    color: isClaimed ? C.green : C.gold,
                  }}
                >
                  {isClaimed
                    ? "Отримано"
                    : cost === 0
                      ? "Безкоштовно"
                      : `${cost} золота`}
                </div>

                <p style={S.bannerDescription}>
                  Срібло · досвід · зоряний пил
                </p>

                <Button
                  secondary
                  disabled={busy || isClaimed}
                  onClick={() =>
                    perform(
                      {
                        name: "career_claim_banner",
                        args: { p_banner: number },
                      },
                      (data) =>
                        `Вимпел отримано: +${data?.silver ?? 0} срібла, +${
                          data?.experience ?? 0
                        } досвіду, +${
                          data?.stardust ?? 0
                        } зоряного пилу.`
                    )
                  }
                >
                  {isClaimed ? (
                    <>
                      <CheckCircle2 size={16} />
                      Отримано
                    </>
                  ) : (
                    <>
                      <Gift size={16} />
                      {busy ? "Зачекай..." : "Забрати"}
                    </>
                  )}
                </Button>
              </Panel>
            );
          })}
        </div>

        {won && (
          <div style={S.freeBannerNote}>
            <Trophy size={17} color={C.gold} />
            Перше місце дає право забрати всі три вимпели безкоштовно.
          </div>
        )}
      </section>

      <Panel>
        <SectionTitle icon={LockKeyhole}>Правила кар’єри</SectionTitle>
        <ul style={S.rules}>
          <li>Кожна нова глава починається зі 100-го місця.</li>
          <li>На один турнір дається п’ять боїв.</li>
          <li>Перше місце дозволяє перейти до наступної глави.</li>
          <li>Якщо п’ять боїв завершено без перемоги, починається очікування 8 годин.</li>
          <li>Дострокове відкриття коштує 10, 20, 30 золота й далі.</li>
          <li>Перший вимпел безкоштовний; другий коштує 10, третій — 50 золота.</li>
          <li>Після першого місця всі три вимпели безкоштовні.</li>
          <li>Щоденні вимпели оновлюються о 10:00 за київським часом.</li>
        </ul>
      </Panel>

      <div style={S.footer}>
        Глава {chapter} · Прогрес зберігається на сервері
      </div>
    </main>
  );
}

const S = {
  page: {
    width: "100%",
    maxWidth: 760,
    margin: "0 auto",
    padding: "8px 12px 28px",
    color: C.text,
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  panel: {
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    padding: 14,
    minWidth: 0,
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    minHeight: 45,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: "11px 12px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    boxSizing: "border-box",
  },
  center: {
    minHeight: 240,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    color: C.muted,
    textAlign: "center",
  },
  header: { marginBottom: 18 },
  eyebrow: {
    color: "#B99A70",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 29,
    margin: "6px 0",
    color: C.text,
    fontWeight: 900,
  },
  chapterTitle: {
    fontSize: 25,
    margin: "7px 0",
    color: C.goldLight,
    fontWeight: 900,
  },
  subtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 1.65,
    margin: "7px 0 12px",
  },
  heroPanel: {
    background: "linear-gradient(145deg, #261C13, #1D1714)",
    marginBottom: 22,
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  rankBadge: {
    flexShrink: 0,
    width: 84,
    minHeight: 100,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    padding: 8,
    border: "1px solid #80603A",
    borderRadius: 13,
    background: "#302116",
    boxSizing: "border-box",
  },
  rankNumber: {
    fontSize: 29,
    lineHeight: 1.1,
    color: C.goldLight,
    fontWeight: 900,
  },
  rankLabel: {
    fontSize: 9,
    letterSpacing: 1.3,
    color: C.muted,
    fontWeight: 800,
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
    marginBottom: 9,
    fontSize: 12,
    color: C.muted,
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
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "12px 4px",
    borderRadius: 10,
    background: C.panel2,
    textAlign: "center",
  },
  statNumber: {
    fontSize: 19,
    fontWeight: 900,
    overflowWrap: "anywhere",
  },
  statLabel: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 1.4,
  },
  balanceBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    marginBottom: 14,
    borderRadius: 9,
    background: "#19130F",
    color: C.muted,
    fontSize: 12,
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
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    background: C.panel2,
    textAlign: "center",
  },
  boxTitle: {
    fontSize: 16,
    margin: "9px 0",
    color: C.goldLight,
  },
  smallNote: {
    fontSize: 10,
    color: C.muted,
    lineHeight: 1.6,
    margin: "10px 2px 0",
  },
  section: {
    margin: "24px 0",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 7,
  },
  sectionHeading: {
    fontSize: 16,
    margin: 0,
    color: C.text,
  },
  bannerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  bannerCard: {
    padding: "12px 8px",
    textAlign: "center",
  },
  bannerIcon: {
    position: "relative",
    width: 54,
    height: 54,
    margin: "0 auto 10px",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #3A2A1B, #211710)",
    border: "1px solid #75532D",
  },
  bannerNumber: {
    position: "absolute",
    right: -5,
    top: -5,
    width: 21,
    height: 21,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: C.gold,
    color: "#1A1008",
    fontSize: 11,
    fontWeight: 900,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: C.text,
    margin: "0 0 7px",
  },
  bannerCost: {
    fontSize: 11,
    fontWeight: 800,
    marginBottom: 7,
  },
  bannerDescription: {
    fontSize: 10,
    color: C.muted,
    lineHeight: 1.5,
    minHeight: 30,
    margin: "5px 0 10px",
  },
  freeBannerNote: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: "#302116",
    color: C.goldLight,
    fontSize: 12,
    lineHeight: 1.5,
  },
  rules: {
    paddingLeft: 19,
    margin: "10px 0 0",
    color: C.muted,
    fontSize: 12,
    lineHeight: 1.9,
  },
  message: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    marginBottom: 14,
    border: "1px solid",
    borderRadius: 10,
    background: "#19130F",
    fontSize: 12,
    lineHeight: 1.6,
  },
  closeMessage: {
    border: 0,
    background: "transparent",
    color: C.muted,
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer",
  },
  errorText: {
    color: C.red,
    fontSize: 12,
    lineHeight: 1.7,
    overflowWrap: "anywhere",
  },
  footer: {
    padding: "18px 4px 0",
    textAlign: "center",
    fontSize: 10,
    color: C.muted,
  },
};
