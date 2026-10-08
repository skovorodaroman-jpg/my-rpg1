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
import Training from "./pages/Training";


/* =========================================================
   ОСНОВНІ РОЗДІЛИ
   ========================================================= */

const MAIN_PAGES = [
  { id: "hero", label: "Мій герой", icon: "⚔️" },
  { id: "home", label: "Головна", icon: "🏰" },
  { id: "clan", label: "Мій клан", icon: "🛡️" },
];


/* =========================================================
   МЕНЮ ГОЛОВНОЇ
   ========================================================= */

const HOME_MENU = [
  { id: "arena", label: "Арена", icon: "⚔️" },
  { id: "career", label: "Карьера", icon: "🏆" },
  { id: "cave", label: "Пещера", icon: "🗿" },

  {
    id: "sage",
    label: "Хижина мудреца",
    icon: "🧙",
    expandable: true,
  },

  {
    id: "immortalKing",
    label: "Король бессмертных",
    icon: "👑",
  },

  {
    id: "battles",
    label: "Сражения",
    icon: "⚔️",
    expandable: true,
  },

  { id: "colosseum", label: "Колизей", icon: "🏟️" },
  { id: "adventures", label: "Поход", icon: "🗺️" },

  {
    id: "getGold",
    label: "Получить золото",
    icon: "🪙",
  },

  {
    id: "equipmentShop",
    label: "Магазин снаряжения",
    icon: "🛒",
    expandable: true,
  },

  {
    id: "forge",
    label: "Кузница",
    icon: "🔨",
    expandable: true,
  },

  {
    id: "laboratory",
    label: "Лаборатория",
    icon: "🧪",
    expandable: true,
  },

  { id: "ranking", label: "Рейтинг", icon: "📊" },
];


/* =========================================================
   ВКЛАДЕНІ РОЗДІЛИ
   ========================================================= */

const SUBSECTIONS = {
  sage: [
    { id: "quests", label: "Задания", icon: "📜" },
    { id: "trophies", label: "Трофеи", icon: "🏆" },
    { id: "collections", label: "Коллекции", icon: "📚" },
    { id: "relics", label: "Древние реликвии", icon: "🏺" },
  ],

  battles: [
    {
      id: "clan_tournament",
      label: "Клановый турнир",
      icon: "🛡️",
    },
    {
      id: "ancient_altars",
      label: "Древние алтари",
      icon: "🗿",
    },
    {
      id: "immortals_valley",
      label: "Долина бессмертных",
      icon: "🏔️",
    },
    {
      id: "immortal_king",
      label: "Король бессмертных",
      icon: "👑",
    },
    {
      id: "chosen_league",
      label: "Лига избранных",
      icon: "⚔️",
    },
  ],

  equipmentShop: [
    {
      id: "titanic",
      label: "Титанические вещи",
      icon: "🔱",
    },
    {
      id: "legendary",
      label: "Легендарные вещи",
      icon: "👑",
    },
    {
      id: "epic_plus",
      label: "Эпические+ вещи",
      icon: "🟣",
    },
    {
      id: "epic",
      label: "Эпические вещи",
      icon: "🟪",
    },
    {
      id: "rare_plus",
      label: "Редкие+ вещи",
      icon: "🔵",
    },
    {
      id: "rare",
      label: "Редкие вещи",
      icon: "🔷",
    },
    {
      id: "common_plus",
      label: "Обычные+ вещи",
      icon: "🟢",
    },
    {
      id: "common",
      label: "Обычные вещи",
      icon: "⚪",
    },
  ],

  forge: [
    {
      id: "runes",
      label: "Торговец рунами",
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
      label: "Звезды",
      icon: "⭐",
    },
    {
      id: "rings",
      label: "Кольца",
      icon: "💍",
    },
  ],

  laboratory: [
    {
      id: "boosts",
      label: "Усиления",
      icon: "⚡",
    },
    {
      id: "elixirs",
      label: "Эликсиры",
      icon: "🧪",
    },
    {
      id: "stone",
      label: "Камень",
      icon: "🪨",
    },
    {
      id: "herb",
      label: "Трава",
      icon: "🌿",
    },
  ],
};


/* =========================================================
   ІСНУЮЧІ СТОРІНКИ + НОВІ АЛІАСИ
   ========================================================= */

const PAGE_COMPONENTS = {
  /* Основні */
  hero: Heroes,
   training: Training,
  home: Home,
  clan: Clan,

  /* Існуючі */
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
  ranking: Ranking,

  /* Нові назви */
  battles: Battle,
  equipmentShop: Shop,

  /* Тимчасові нові розділи */
  career: ComingSoon,
  sage: ComingSoon,
  immortalKing: ComingSoon,
  getGold: ComingSoon,
};


/* =========================================================
   ЗАГЛУШКА ДЛЯ ЩЕ НЕ СТВОРЕНИХ СТОРІНОК
   ========================================================= */

function ComingSoon({ section, subsection }) {
  const homeItem = HOME_MENU.find((item) => item.id === section);

  const subsectionItem =
    SUBSECTIONS[section]?.find(
      (item) => item.id === subsection
    );

  const title =
    subsectionItem?.label ||
    homeItem?.label ||
    section ||
    "Розділ";

  const icon =
    subsectionItem?.icon ||
    homeItem?.icon ||
    "🏰";

  return (
    <div style={styles.comingSoon}>
      <div style={styles.comingSoonIcon}>
        {icon}
      </div>

      <h2 style={styles.comingSoonTitle}>
        {title}
      </h2>

      <p style={styles.comingSoonText}>
        Цей розділ уже доданий до структури гри.
        <br />
        Сторінку та її механіку створимо наступним етапом.
      </p>
    </div>
  );
}


/* =========================================================
   PROFILE
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


/* =========================================================
   APP
   ========================================================= */

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [section, setSection] = useState("home");
  const [subsection, setSubsection] = useState(null);

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [profileError, setProfileError] = useState("");
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [authMode, setAuthMode] = useState("login");

  /* -------------------------------------------------------
     LOAD PROFILE
     ------------------------------------------------------- */

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    setProfileError("");

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile load error:", error);
      setProfileError(error.message);
      setProfile(null);
      return;
    }

    setProfile(data);
  }, []);


  /* -------------------------------------------------------
     AUTH
     ------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }

      setSession(session);

      if (session?.user?.id) {
        await loadProfile(session.user.id);
      }

      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);

        if (nextSession?.user?.id) {
          await loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

async function handleAuth(event) {
    event.preventDefault();

    setAuthMessage("");
    setAuthLoading(true);

    try {
      if (!email.trim() || !password) {
        setAuthMessage("Введи email та пароль.");
        return;
      }

      if (authMode === "login") {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) {
          setAuthMessage(error.message);
        }

        return;
      }

      const { error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      setAuthMessage(
        "Акаунт створено. Перевір пошту для підтвердження."
      );
    } finally {
      setAuthLoading(false);
    }
         }
  /* -------------------------------------------------------
     NAVIGATION
     
     Старий формат:
       navigateTo("forge")

     Новий формат:
       navigateTo("forge", "runes")
     ------------------------------------------------------- */

  function navigateTo(nextSection, nextSubsection = null) {
    if (!PAGE_COMPONENTS[nextSection]) {
      console.warn(
        `Unknown navigation section: ${nextSection}`
      );
      return;
    }

    setSection(nextSection);
    setSubsection(nextSubsection);

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }


  /* -------------------------------------------------------
     MAIN BOTTOM NAVIGATION
     ------------------------------------------------------- */

  function renderBottomNavigation() {
    return (
      <nav style={styles.bottomNav}>
        {MAIN_PAGES.map((item) => {
          const active =
            section === item.id ||
            (item.id === "home" &&
              HOME_MENU.some(
                (menuItem) => menuItem.id === section
              ));

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.id)}
              style={{
                ...styles.bottomNavItem,
                ...(active
                  ? styles.bottomNavItemActive
                  : {}),
              }}
            >
              <span style={styles.bottomNavIcon}>
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }


  /* -------------------------------------------------------
     HOME MENU
     ------------------------------------------------------- */

  function renderHomeMenu() {
    if (section !== "home") return null;

    return (
      <div style={styles.homeMenu}>
        <div style={styles.homeMenuTitle}>
          <span>🏰</span>
          <span>ГОЛОВНА</span>
        </div>

        <div style={styles.homeMenuGrid}>
          {HOME_MENU.map((item) => {
            const hasChildren =
              Array.isArray(SUBSECTIONS[item.id]) &&
              SUBSECTIONS[item.id].length > 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                style={styles.homeMenuItem}
              >
                <span style={styles.homeMenuIcon}>
                  {item.icon}
                </span>

                <span style={styles.homeMenuLabel}>
                  {item.label}
                </span>

                {hasChildren && (
                  <span style={styles.homeMenuArrow}>
                    ›
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }


  /* -------------------------------------------------------
     SUBSECTION MENU
     ------------------------------------------------------- */

  function renderSubsectionMenu() {
    const items = SUBSECTIONS[section];

    if (!items) return null;

    return (
      <div style={styles.subsectionWrapper}>
        <button
          type="button"
          onClick={() => navigateTo("home")}
          style={styles.backButton}
        >
          ← Головна
        </button>

        <div style={styles.subsectionHeader}>
          <span>
            {
              HOME_MENU.find(
                (item) => item.id === section
              )?.icon
            }
          </span>

          <span>
            {
              HOME_MENU.find(
                (item) => item.id === section
              )?.label
            }
          </span>
        </div>

        <div style={styles.subsectionGrid}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                navigateTo(section, item.id)
              }
              style={{
                ...styles.subsectionItem,
                ...(subsection === item.id
                  ? styles.subsectionItemActive
                  : {}),
              }}
            >
              <span style={styles.subsectionIcon}>
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }


  /* -------------------------------------------------------
     LOADING
     ------------------------------------------------------- */

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingIcon}>🌅</div>
        <div>Завантаження...</div>
      </div>
    );
  }


  /* -------------------------------------------------------
     AUTH ERROR
     ------------------------------------------------------- */

  if (authError) {
    return (
      <div style={styles.errorScreen}>
        <h2>Помилка авторизації</h2>
        <p>{authError}</p>
      </div>
    );
  }


  /* -------------------------------------------------------
     NO SESSION
     
     Тут залишаємо твою існуючу систему авторизації.
     Якщо в поточному App.jsx є окремий Login-компонент,
     його можна повернути сюди без зміни навігації.
     ------------------------------------------------------- */

  if (!session) {
    return (
      <div style={styles.authScreen}>

        <div style={styles.authCard}>

          <div style={styles.authLogo}>
            🌅
          </div>

          <h1 style={styles.authTitle}>
            Хроніки Згаслого Світанку
          </h1>

          <p style={styles.authSubtitle}>
            {authMode === "login"
              ? "Увійди у свій акаунт"
              : "Створи свій акаунт"}
          </p>

          <form
            onSubmit={handleAuth}
            style={styles.authForm}
          >

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Email"
              autoComplete="email"
              style={styles.authInput}
              disabled={authLoading}
            />

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Пароль"
              autoComplete={
                authMode === "login"
                  ? "current-password"
                  : "new-password"
              }
              style={styles.authInput}
              disabled={authLoading}
            />

            {authMessage && (
              <div style={styles.authMessage}>
                {authMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={styles.authButton}
            >
              {authLoading
                ? "Зачекай..."
                : authMode === "login"
                ? "Увійти"
                : "Зареєструватися"}
            </button>

          </form>

          <button
            type="button"
            onClick={() => {
              setAuthMessage("");
              setAuthMode(
                authMode === "login"
                  ? "register"
                  : "login"
              );
            }}
            style={styles.authSwitch}
          >
            {authMode === "login"
              ? "Немає акаунта? Зареєструватися"
              : "Вже є акаунт? Увійти"}
          </button>

        </div>

      </div>
    );
  }

  /* -------------------------------------------------------
     BAN
     ------------------------------------------------------- */

  if (profile?.is_banned) {
    return (
      <div style={styles.errorScreen}>
        <div style={styles.loadingIcon}>⛔</div>

        <h2>Акаунт заблоковано</h2>

        <p>
          {profile.ban_reason ||
            "Доступ до гри обмежено адміністратором."}
        </p>
      </div>
    );
  }


  /* -------------------------------------------------------
     CURRENT PAGE
     ------------------------------------------------------- */

  const CurrentPage =
    PAGE_COMPONENTS[section] || Home;


  return (
    <div style={styles.app}>

      {/* ===================================================
          TOP PLAYER BAR
          =================================================== */}

      <header style={styles.topBar}>
        <div style={styles.playerBlock}>

          <div style={styles.avatar}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                style={styles.avatarImage}
              />
            ) : (
              "⚔️"
            )}
          </div>

          <div>
            <div style={styles.playerName}>
              {profile?.display_name ||
                profile?.username ||
                "Гравець"}
            </div>

            <div style={styles.playerLevel}>
              Ур. {profile?.level || 1}
              {profile?.role === "admin" && (
                <span style={styles.adminBadge}>
                  ADMIN
                </span>
              )}
            </div>
          </div>
        </div>


        <div style={styles.resources}>

          <div style={styles.resource}>
            <span>🪙</span>
            <span>
              {Number(profile?.gold || 0).toLocaleString()}
            </span>
          </div>

          <div style={styles.resource}>
            <span>💎</span>
            <span>
              {Number(profile?.crystals || 0).toLocaleString()}
            </span>
          </div>

          <div style={styles.resource}>
            <span>⚡</span>
            <span>
              {profile?.energy ?? 0}/
              {profile?.max_energy ?? 100}
            </span>
          </div>

        </div>
      </header>


      {/* ===================================================
          XP
          =================================================== */}

      <div style={styles.xpTrack}>
        <div
          style={{
            ...styles.xpFill,
            width: `${Math.min(
              100,
              Math.max(
                0,
                Number(profile?.experience || 0) % 100
              )
            )}%`,
          }}
        />
      </div>


      {/* ===================================================
          CONTENT
          =================================================== */}

      <main style={styles.content}>

        {/* Головне меню */}
        {renderHomeMenu()}

        {/* Вкладені меню */}
        {renderSubsectionMenu()}

        {/* Сторінка */}
        <CurrentPage
          profile={profile}
          player={profile}
          section={section}
          subsection={subsection}
          onNavigate={navigateTo}
        />

        {profileError && (
          <div style={styles.profileError}>
            Не вдалося оновити профіль:
            {" "}
            {profileError}
          </div>
        )}

      </main>


      {/* ===================================================
          ПОСТІЙНА НИЖНЯ НАВІГАЦІЯ
          =================================================== */}

      {renderBottomNavigation()}


      {/* ===================================================
          FOOTER
          =================================================== */}

      <footer style={styles.footer}>
        <div>
          Хроніки Згаслого Світанку
        </div>

        <div>
          Світло ще не згасло...
        </div>
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
    background:
      "linear-gradient(180deg, #120812 0%, #1b0d1e 45%, #100711 100%)",
    color: "#f5eaf5",
    paddingBottom: "90px",
  },

  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    minHeight: "58px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "8px 12px",
    background:
      "rgba(26, 8, 25, 0.96)",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
  },

  playerBlock: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: 0,
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #56203f, #241025)",
    border:
      "1px solid rgba(255,255,255,0.15)",
    flexShrink: 0,
    overflow: "hidden",
    fontSize: "20px",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  playerName: {
    fontWeight: 700,
    fontSize: "14px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "130px",
  },

  playerLevel: {
    fontSize: "11px",
    opacity: 0.65,
    marginTop: "2px",
  },

   authScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at top, #35142f 0%, #120812 55%, #090509 100%)",
  },

  authCard: {
    width: "100%",
    maxWidth: "390px",
    padding: "30px 22px",
    boxSizing: "border-box",
    borderRadius: "20px",
    background:
      "linear-gradient(145deg, rgba(55,21,51,0.96), rgba(22,9,23,0.98))",
    border:
      "1px solid rgba(255,255,255,0.1)",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.45)",
    textAlign: "center",
  },

  authLogo: {
    fontSize: "56px",
    marginBottom: "10px",
  },

  authTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.2,
    fontWeight: 800,
  },

  authSubtitle: {
    margin: "8px 0 22px",
    color: "rgba(255,255,255,0.55)",
    fontSize: "13px",
  },

  authForm: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
  },

  authInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    borderRadius: "10px",
    border:
      "1px solid rgba(255,255,255,0.1)",
    outline: "none",
    background:
      "rgba(10,5,12,0.75)",
    color: "#fff",
    fontSize: "14px",
  },

  authButton: {
    marginTop: "5px",
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #8c315e, #d65388)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  authSwitch: {
    marginTop: "18px",
    border: "none",
    background: "transparent",
    color: "#e28bb3",
    fontSize: "12px",
    cursor: "pointer",
  },

  authMessage: {
    padding: "10px",
    borderRadius: "8px",
    background:
      "rgba(180,70,100,0.15)",
    color: "#e9a5bc",
    fontSize: "12px",
    lineHeight: 1.4,
  },

  adminBadge: {
    marginLeft: "6px",
    padding: "2px 5px",
    borderRadius: "4px",
    background: "#7d294f",
    color: "#fff",
    fontSize: "8px",
    fontWeight: 800,
  },

  resources: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "11px",
    flexShrink: 0,
  },

  resource: {
    display: "flex",
    alignItems: "center",
    gap: "3px",
    whiteSpace: "nowrap",
  },

  xpTrack: {
    height: "3px",
    width: "100%",
    background: "rgba(255,255,255,0.08)",
  },

  xpFill: {
    height: "100%",
    background:
      "linear-gradient(90deg, #7c315e, #e45c91)",
    transition: "width 0.3s ease",
  },

  content: {
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
    padding: "14px 12px 20px",
    boxSizing: "border-box",
  },

  homeMenu: {
    marginBottom: "18px",
  },

  homeMenuTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "17px",
    fontWeight: 800,
    marginBottom: "12px",
    padding: "4px 2px",
  },

  homeMenuGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "8px",
  },

  homeMenuItem: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minHeight: "56px",
    padding: "9px 10px",
    borderRadius: "11px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(71,25,60,0.75), rgba(30,13,31,0.9))",
    color: "#f8edf8",
    cursor: "pointer",
    textAlign: "left",
  },

  homeMenuIcon: {
    fontSize: "22px",
    width: "28px",
    textAlign: "center",
    flexShrink: 0,
  },

  homeMenuLabel: {
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1.2,
  },

  homeMenuArrow: {
    position: "absolute",
    right: "9px",
    fontSize: "21px",
    opacity: 0.45,
  },

  subsectionWrapper: {
    marginBottom: "18px",
  },

  backButton: {
    border: "none",
    background: "transparent",
    color: "#dba0c2",
    padding: "4px 0 12px",
    fontSize: "13px",
    cursor: "pointer",
  },

  subsectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "18px",
    fontWeight: 800,
    marginBottom: "12px",
  },

  subsectionGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "8px",
  },

  subsectionItem: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minHeight: "52px",
    padding: "9px 10px",
    borderRadius: "10px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background:
      "rgba(43, 20, 43, 0.9)",
    color: "#f5eaf5",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 700,
  },

  subsectionItemActive: {
    border:
      "1px solid rgba(224, 92, 145, 0.55)",
    background:
      "linear-gradient(145deg, rgba(105,39,78,0.9), rgba(49,18,46,0.95))",
  },

  subsectionIcon: {
    fontSize: "20px",
    width: "26px",
    textAlign: "center",
    flexShrink: 0,
  },

  comingSoon: {
    marginTop: "15px",
    padding: "35px 18px",
    borderRadius: "16px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(52,20,49,0.85), rgba(25,11,27,0.95))",
    textAlign: "center",
  },

  comingSoonIcon: {
    fontSize: "50px",
    marginBottom: "10px",
  },

  comingSoonTitle: {
    margin: 0,
    fontSize: "21px",
  },

  comingSoonText: {
    marginTop: "10px",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.5,
    fontSize: "13px",
  },

  bottomNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    minHeight: "64px",
    background:
      "rgba(20, 8, 20, 0.97)",
    borderTop:
      "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(12px)",
  },

  bottomNavItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  bottomNavItemActive: {
    color: "#f08ab5",
    background:
      "rgba(117, 40, 82, 0.18)",
  },

  bottomNavIcon: {
    fontSize: "20px",
    lineHeight: 1,
  },

  footer: {
    textAlign: "center",
    padding: "15px 10px",
    color: "rgba(255,255,255,0.35)",
    fontSize: "10px",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#120812",
    color: "#f5eaf5",
    gap: "10px",
    textAlign: "center",
  },

  loadingIcon: {
    fontSize: "48px",
  },

  errorScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#120812",
    color: "#f5eaf5",
    padding: "20px",
    textAlign: "center",
  },

  profileError: {
    marginTop: "12px",
    padding: "10px",
    borderRadius: "8px",
    background:
      "rgba(150, 50, 70, 0.15)",
    color: "#e8a8b8",
    fontSize: "11px",
  },
};
