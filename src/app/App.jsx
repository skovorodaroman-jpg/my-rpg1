import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

import Home from "./pages/Home";
import Heroes from "./pages/Heroes";
import Inventory from "./pages/Inventory";
import Pets from "./pages/Pets";
import Battle from "./pages/Battle";
import Arena from "./pages/Arena";
import Mine from "./pages/Mine";
import Shop from "./pages/Shop";
import Forge from "./pages/Forge";
import Clan from "./pages/Clan";
import Ranking from "./pages/Ranking";
import Laboratory from "./pages/Laboratory";
import Adventures from "./pages/Adventures";
import Colosseum from "./pages/Colosseum";
import Cave from "./pages/Cave";

/* =========================================================
   ОСНОВНІ РОЗДІЛИ ГРИ
========================================================= */

const PAGES = [
  { id: "hero", label: "Мій герой", icon: "⚔️" },
  { id: "home", label: "Головна", icon: "🏰" },
  { id: "battle", label: "Бій", icon: "🗡️" },
  { id: "heroes", label: "Герої", icon: "🦸" },
  { id: "pets", label: "Пети", icon: "🐺" },
  { id: "inventory", label: "Інвентар", icon: "🎒" },
  { id: "arena", label: "Арена", icon: "🏆" },
  { id: "colosseum", label: "Колізей", icon: "⚔️" },
  { id: "cave", label: "Печера", icon: "🗿" },
  { id: "adventures", label: "Пригоди", icon: "🗺️" },
  { id: "mine", label: "Шахта", icon: "⛏️" },
  { id: "shop", label: "Магазин", icon: "🛒" },
  { id: "forge", label: "Кузня", icon: "⚒️" },
  { id: "laboratory", label: "Лабораторія", icon: "🧪" },
  { id: "clan", label: "Мій клан", icon: "🛡️" },
  { id: "ranking", label: "Рейтинг", icon: "📊" },
];

/* =========================================================
   ВНУТРІШНІ РОЗДІЛИ
   Поки що це ТІЛЬКИ структура навігації.
   Механіки додамо пізніше.
========================================================= */

const SUBSECTIONS = {
  forge: [
    {
      id: "runes",
      label: "Торговець рунами",
      icon: "🔮",
    },
    {
      id: "upgrade",
      label: "Заточка",
      icon: "⚔️",
    },
    {
      id: "bonus",
      label: "Бонус",
      icon: "✨",
    },
    {
      id: "amulet",
      label: "Амулет",
      icon: "📿",
    },
    {
      id: "stars",
      label: "Зірки",
      icon: "⭐",
    },
    {
      id: "rings",
      label: "Кільця",
      icon: "💍",
    },
  ],

  shop: [
    {
      id: "titanic",
      label: "Титанічні речі",
      icon: "🔱",
    },
    {
      id: "legendary",
      label: "Легендарні речі",
      icon: "👑",
    },
    {
      id: "epic_plus",
      label: "Епічні+ речі",
      icon: "🟣",
    },
    {
      id: "epic",
      label: "Епічні речі",
      icon: "🟪",
    },
    {
      id: "rare_plus",
      label: "Рідкі+ речі",
      icon: "🔵",
    },
    {
      id: "rare",
      label: "Рідкі речі",
      icon: "🔷",
    },
    {
      id: "common_plus",
      label: "Звичайні+ речі",
      icon: "🟢",
    },
    {
      id: "common",
      label: "Звичайні речі",
      icon: "⚪",
    },
  ],

  sage: [
    {
      id: "main",
      label: "Хижина мудреця",
      icon: "🧙",
    },
    {
      id: "knowledge",
      label: "Знання",
      icon: "📖",
    },
    {
      id: "research",
      label: "Дослідження",
      icon: "🔬",
    },
  ],
};

/* =========================================================
   КОМПОНЕНТИ СТОРІНОК
========================================================= */

const PAGE_COMPONENTS = {
  hero: Home,
  home: Home,
  battle: Battle,
  heroes: Heroes,
  pets: Pets,
  inventory: Inventory,
  arena: Arena,
  colosseum: Colosseum,
  cave: Cave,
  adventures: Adventures,
  mine: Mine,
  shop: Shop,
  forge: Forge,
  laboratory: Laboratory,
  clan: Clan,
  ranking: Ranking,
};

/* =========================================================
   ПРОФІЛЬ
========================================================= */

const PROFILE_FIELDS = [
  "id",
  "username",
  "display_name",
  "avatar_url",
  "role",
  "level",
  "experience",
  "gold",
  "crystals",
  "energy",
  "max_energy",
  "last_energy_update",
  "is_banned",
  "ban_reason",
  "last_seen_at",
  "created_at",
  "updated_at",
].join(", ");

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  /*
    section = основний розділ
    subsection = внутрішній розділ

    Наприклад:
    section: "forge"
    subsection: "runes"
  */
  const [section, setSection] = useState("hero");
  const [subsection, setSubsection] = useState(null);

  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* =======================================================
     ЗАВАНТАЖЕННЯ ПРОФІЛЮ
  ======================================================= */

  const loadProfile = useCallback(async (userId) => {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!data) {
      throw new Error(
        "Профіль не знайдено. Перевір створення профілю після реєстрації."
      );
    }

    setProfile(data);

    if (data.is_banned) {
      setError(
        data.ban_reason
          ? `Акаунт заблоковано: ${data.ban_reason}`
          : "Твій акаунт заблоковано."
      );
    }

    return data;
  }, []);

  /* =======================================================
     ІНІЦІАЛІЗАЦІЯ
  ======================================================= */

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!active) return;

        const currentSession = data.session;
        setSession(currentSession);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Не вдалося завантажити профіль.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;

      setSession(newSession);

      if (!newSession) {
        setProfile(null);
        setSection("hero");
        setSubsection(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /* =======================================================
     АВТОРИЗАЦІЯ
  ======================================================= */

  async function handleAuth(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (authMode === "register") {
        const { data, error: authError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                display_name: username.trim(),
              },
            },
          });

        if (authError) throw authError;

        if (data.session && data.user) {
          setSession(data.session);
          await loadProfile(data.user.id);
          setMessage("Реєстрація успішна!");
        } else {
          setMessage(
            "Акаунт створено. Перевір електронну пошту, щоб підтвердити реєстрацію."
          );
        }
      } else {
        const { data, error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (authError) throw authError;

        setSession(data.session);
        await loadProfile(data.user.id);
        setMessage("Вхід успішний!");
      }
    } catch (err) {
      setError(err.message || "Не вдалося виконати операцію.");
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     ВИХІД
  ======================================================= */

  async function handleLogout() {
    setError("");

    const { error: logoutError } =
      await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    setSession(null);
    setProfile(null);
    setSection("hero");
    setSubsection(null);
  }

  /* =======================================================
     ЦЕНТРАЛЬНА НАВІГАЦІЯ
     
     Старий варіант:
       navigateTo("forge")

     Новий варіант:
       navigateTo("forge", "runes")

     Старі сторінки продовжать працювати.
  ======================================================= */

  function navigateTo(nextSection, nextSubsection = null) {
    if (!PAGE_COMPONENTS[nextSection]) {
      return;
    }

    setSection(nextSection);

    /*
      Якщо для розділу передано підрозділ —
      відкриваємо його.

      Якщо підрозділ не передано —
      скидаємо попередній.
    */
    if (nextSubsection) {
      const availableSubsections =
        SUBSECTIONS[nextSection] || [];

      const exists = availableSubsections.some(
        (item) => item.id === nextSubsection
      );

      setSubsection(exists ? nextSubsection : null);
    } else {
      setSubsection(null);
    }

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.logo}>⚔️</div>

        <h2>
          Хроніки Згаслого Світанку
        </h2>

        <p style={styles.muted}>
          Завантаження світу...
        </p>
      </div>
    );
  }

  /* =======================================================
     AUTH
  ======================================================= */

  if (!session || !profile) {
    return (
      <div style={styles.centerScreen}>
        <form
          style={styles.authCard}
          onSubmit={handleAuth}
        >
          <div style={styles.logo}>⚔️</div>

          <h1 style={styles.title}>
            Хроніки Згаслого Світанку
          </h1>

          <p style={styles.muted}>
            {authMode === "login"
              ? "Повернися у світ Eldara"
              : "Створи свого героя"}
          </p>

          {authMode === "register" && (
            <input
              style={styles.input}
              placeholder="Ім'я гравця"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              required
              minLength={2}
              maxLength={30}
            />
          )}

          <input
            style={styles.input}
            type="email"
            placeholder="Електронна пошта"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Пароль (мінімум 6 символів)"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            minLength={6}
          />

          {error && (
            <p style={styles.error}>
              {error}
            </p>
          )}

          {message && (
            <p style={styles.success}>
              {message}
            </p>
          )}

          <button
            style={styles.primaryButton}
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Зачекай..."
              : authMode === "login"
                ? "Увійти в гру"
                : "Зареєструватися"}
          </button>

          <button
            style={styles.textButton}
            type="button"
            onClick={() => {
              setAuthMode(
                authMode === "login"
                  ? "register"
                  : "login"
              );

              setError("");
              setMessage("");
            }}
          >
            {authMode === "login"
              ? "Немає акаунта? Реєстрація"
              : "Вже є акаунт? Увійти"}
          </button>
        </form>
      </div>
    );
  }

  /* =======================================================
     BANNED
  ======================================================= */

  if (profile.is_banned) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.authCard}>
          <div style={styles.logo}>🚫</div>

          <h2>
            Акаунт заблоковано
          </h2>

          <p>
            {profile.ban_reason ||
              "Звернися до адміністрації гри."}
          </p>

          <button
            style={styles.primaryButton}
            onClick={handleLogout}
          >
            Вийти з акаунта
          </button>
        </div>
      </div>
    );
  }

  const CurrentPage =
    PAGE_COMPONENTS[section] || Home;

  const currentSubsections =
    SUBSECTIONS[section] || [];

  return (
    <div style={styles.app}>

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <header style={styles.topBar}>
        <div style={styles.playerInfo}>

          <div style={styles.avatar}>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Аватар"
                style={styles.avatarImage}
              />
            ) : (
              "⚔️"
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={styles.playerName}>
              {profile.display_name ||
                profile.username ||
                "Мандрівник"}
            </div>

            <div style={styles.smallText}>
              Рівень {profile.level ?? 1} ·{" "}
              {profile.role || "player"}
            </div>
          </div>

        </div>

        <div style={styles.resources}>
          <span title="Золото">
            🪙 {profile.gold ?? 0}
          </span>

          <span title="Кристали">
            💎 {profile.crystals ?? 0}
          </span>

          <span title="Енергія">
            ⚡ {profile.energy ?? 0}/
            {profile.max_energy ?? 100}
          </span>
        </div>
      </header>

      {/* ===================================================
          XP
      =================================================== */}

      <div
        style={styles.xpTrack}
        title="Досвід героя"
      >
        <div
          style={{
            ...styles.xpFill,

            width: `${Math.min(
              100,
              Math.max(
                0,
                ((profile.experience ?? 0) % 1000) /
                  10
              )
            )}%`,
          }}
        />
      </div>

      {/* ===================================================
          ОСНОВНА НАВІГАЦІЯ
      =================================================== */}

      <nav style={styles.navigation}>
        {PAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              navigateTo(item.id)
            }
            style={{
              ...styles.navButton,

              ...(section === item.id
                ? styles.activeNavButton
                : {}),
            }}
          >
            <span style={styles.navIcon}>
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* ===================================================
          ВНУТРІШНЄ МЕНЮ
          
          З'являється тільки там, де є SUBSECTIONS.
      =================================================== */}

      {currentSubsections.length > 0 && (
        <nav style={styles.subNavigation}>

          <div style={styles.subNavigationTitle}>
            {PAGES.find(
              (item) => item.id === section
            )?.icon}{" "}
            {PAGES.find(
              (item) => item.id === section
            )?.label}
          </div>

          <div style={styles.subNavigationList}>
            {currentSubsections.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  navigateTo(
                    section,
                    item.id
                  )
                }
                style={{
                  ...styles.subNavButton,

                  ...(subsection === item.id
                    ? styles.activeSubNavButton
                    : {}),
                }}
              >
                <span style={styles.subNavIcon}>
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

        </nav>
      )}

      {/* ===================================================
          CONTENT
      =================================================== */}

      <main style={styles.content}>

        {error && (
          <div style={styles.notice}>
            <span>
              {error}
            </span>

            <button
              style={styles.dismissButton}
              onClick={() =>
                setError("")
              }
              aria-label="Закрити повідомлення"
            >
              ×
            </button>
          </div>
        )}

        <CurrentPage
          profile={profile}
          player={profile}
          onNavigate={navigateTo}

          /*
            Нові сторінки зможуть отримати:
            subsection = "runes"
          */
          subsection={subsection}
          section={section}
        />

      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer style={styles.footer}>

        <div>
          <strong>
            {profile.display_name ||
              profile.username ||
              "Гравець"}
          </strong>

          <span style={styles.smallText}>
            {" "}· Рівень{" "}
            {profile.level ?? 1}
          </span>
        </div>

        <button
          type="button"
          style={styles.textButton}
          onClick={handleLogout}
        >
          ⚙️ Вийти
        </button>

      </footer>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = {
  app: {
    minHeight: "100vh",
    background: "#100811",
    color: "#f8edf5",
    fontFamily: "Arial, sans-serif",
  },
  centerScreen: {
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    background:
      "radial-gradient(circle at top, #40152f, #100811 65%)",
    color: "#fff",
    textAlign: "center",
  },

  authCard: {
    width: "100%",
    maxWidth: 390,
    boxSizing: "border-box",
    padding: 24,
    border: "1px solid #67314f",
    borderRadius: 18,
    background: "#1d1020",
  },

  logo: {
    fontSize: 52,
    marginBottom: 12,
  },

  title: {
    fontSize: 23,
    lineHeight: 1.3,
    margin: "0 0 10px",
  },

  muted: {
    color: "#bcaabd",
    lineHeight: 1.5,
  },

  input: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    marginTop: 12,
    padding: "13px 14px",
    border: "1px solid #59324f",
    borderRadius: 10,
    background: "#120b16",
    color: "#fff",
    fontSize: 16,
  },

  primaryButton: {
    width: "100%",
    marginTop: 16,
    padding: 14,
    border: 0,
    borderRadius: 10,
    background: "#c23e79",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },

  textButton: {
    border: 0,
    background: "transparent",
    color: "#f08cba",
    padding: 10,
    cursor: "pointer",
  },

  error: {
    color: "#ff8d8d",
    overflowWrap: "anywhere",
  },

  success: {
    color: "#8fe0b0",
    overflowWrap: "anywhere",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: "#1b101e",
    borderBottom: "1px solid #42243e",
    flexWrap: "wrap",
  },

  playerInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    background: "#3c1b39",
    fontSize: 24,
    flexShrink: 0,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  playerName: {
    fontWeight: 700,
    overflowWrap: "anywhere",
  },

  smallText: {
    fontSize: 12,
    color: "#c4afc4",
  },

  resources: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 13,
  },

  xpTrack: {
    height: 3,
    background: "#352137",
  },

  xpFill: {
    height: "100%",
    background: "#f16da8",
    transition: "width 0.2s",
  },

  /* =========================================
     ОСНОВНА НАВІГАЦІЯ
  ========================================= */

  navigation: {
    display: "flex",
    gap: 6,
    padding: 10,
    overflowX: "auto",
    background: "#170d1a",
    borderBottom: "1px solid #42243e",
    scrollbarWidth: "thin",
  },

  navButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minWidth: 76,
    padding: "10px 8px",
    border: "1px solid transparent",
    borderRadius: 10,
    background: "transparent",
    color: "#cbb9cd",
    fontSize: 11,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  activeNavButton: {
    background: "#3a1935",
    borderColor: "#a43f76",
    color: "#fff",
  },

  navIcon: {
    fontSize: 22,
    lineHeight: 1,
  },

  /* =========================================
     ВНУТРІШНЄ МЕНЮ
  ========================================= */

  subNavigation: {
    padding: "8px 10px 10px",
    background: "#120a15",
    borderBottom: "1px solid #42243e",
  },

  subNavigationTitle: {
    padding: "4px 6px 8px",
    color: "#f08cba",
    fontSize: 12,
    fontWeight: 700,
  },

  subNavigationList: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 2,
    scrollbarWidth: "thin",
  },

  subNavButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexShrink: 0,
    padding: "8px 11px",
    border: "1px solid #3b2439",
    borderRadius: 8,
    background: "#1b101e",
    color: "#bfaabd",
    fontSize: 11,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },

  activeSubNavButton: {
    background: "#48203f",
    borderColor: "#c24e88",
    color: "#fff",
  },

  subNavIcon: {
    fontSize: 16,
    lineHeight: 1,
  },

  /* =========================================
     ОСНОВНИЙ КОНТЕНТ
  ========================================= */

  content: {
    width: "100%",
    maxWidth: 1200,
    boxSizing: "border-box",
    margin: "0 auto",
    padding: 14,
  },

  notice: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    background: "#42202b",
    color: "#ffd1df",
    overflowWrap: "anywhere",
  },

  dismissButton: {
    flexShrink: 0,
    border: 0,
    background: "transparent",
    color: "#fff",
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
  },

  /* =========================================
     FOOTER
  ========================================= */

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "14px",
    borderTop: "1px solid #42243e",
    background: "#170d1a",
  },
};
  
  
