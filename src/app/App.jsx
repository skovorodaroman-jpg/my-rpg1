
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";

import Home from "./pages/Home";
import Heroes from "./pages/Heroes";
import Inventory from "./pages/Inventory";
import Pets from "./pages/Pets";
import Battle from "./pages/Battle";
import Arena from "./pages/Arena";
import Career from "./pages/Career";
import League from "./pages/League";
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
import Skills from "./pages/Skills";

const MAIN_PAGES = [
  { id: "hero", label: "Мій герой", icon: "⚔️" },
  { id: "clan", label: "Мій клан", icon: "🛡️" },
  { id: "home", label: "Головна", icon: "🏰" },
];

const HOME_MENU = [
  { id: "arena", label: "Арена", icon: "⚔️" },
  { id: "career", label: "Кар'єра", icon: "🏆" },
  { id: "cave", label: "Печера", icon: "🗿" },
  { id: "sage", label: "Хижа мудреця", icon: "🧙" },
  { id: "immortalKing", label: "Король безсмертних", icon: "👑" },
  { id: "battles", label: "Битви", icon: "⚔️" },
  { id: "colosseum", label: "Колізей", icon: "🏟️" },
  { id: "adventures", label: "Похід", icon: "🗺️" },
  { id: "getGold", label: "Отримати золото", icon: "🪙" },
  { id: "equipmentShop", label: "Магазин спорядження", icon: "🛒" },
  { id: "forge", label: "Кузня", icon: "🔨" },
  { id: "laboratory", label: "Лабораторія", icon: "🧪" },
  { id: "ranking", label: "Рейтинг", icon: "📊" },
];

const SUBSECTIONS = {
  sage: [
    { id: "quests", label: "Завдання", icon: "📜" },
    { id: "trophies", label: "Трофеї", icon: "🏆" },
    { id: "collections", label: "Колекції", icon: "📚" },
    { id: "relics", label: "Стародавні реліквії", icon: "🏺" },
  ],
  battles: [
    { id: "clan_tournament", label: "Клановий турнір", icon: "🛡️" },
    { id: "ancient_altars", label: "Стародавні вівтарі", icon: "🗿" },
    { id: "immortals_valley", label: "Долина безсмертних", icon: "🏔️" },
    { id: "immortal_king", label: "Король безсмертних", icon: "👑" },
    { id: "chosen_league", label: "Ліга обраних", icon: "⚔️" },
  ],
  equipmentShop: [
    { id: "titanic", label: "Титанічні речі", icon: "🔱" },
    { id: "legendary", label: "Легендарні речі", icon: "👑" },
    { id: "epic_plus", label: "Епічні+ речі", icon: "🟣" },
    { id: "epic", label: "Епічні речі", icon: "🟪" },
    { id: "rare_plus", label: "Рідкісні+ речі", icon: "🔵" },
    { id: "rare", label: "Рідкісні речі", icon: "🔷" },
    { id: "common_plus", label: "Звичайні+ речі", icon: "🟢" },
    { id: "common", label: "Звичайні речі", icon: "⚪" },
  ],
  forge: [
    { id: "runes", label: "Торговець рунами", icon: "🔮" },
    { id: "upgrade", label: "Заточка", icon: "⚔️" },
    { id: "bonus", label: "Бонус", icon: "✨" },
    { id: "amulet", label: "Амулет", icon: "📿" },
    { id: "stars", label: "Зірки", icon: "⭐" },
    { id: "rings", label: "Кільця", icon: "💍" },
  ],
  laboratory: [
    { id: "boosts", label: "Посилення", icon: "⚡" },
    { id: "elixirs", label: "Еліксири", icon: "🧪" },
    { id: "stone", label: "Камінь", icon: "🪨" },
    { id: "herb", label: "Трава", icon: "🌿" },
  ],
};

const PROFILE_FIELDS = [
  "id",
  "username",
  "display_name",
  "avatar_url",
  "role",
  "level",
  "experience",
  "gold",
  "silver",
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

function ComingSoon({ section, subsection }) {
  const homeItem = HOME_MENU.find((item) => item.id === section);
  const child = SUBSECTIONS[section]?.find(
    (item) => item.id === subsection
  );

  return (
    <section style={styles.panel}>
      <div style={{ fontSize: 44 }}>
        {child?.icon || homeItem?.icon || "🏰"}
      </div>
      <h2 style={styles.panelTitle}>
        {child?.label || homeItem?.label || section}
      </h2>
      <p style={styles.muted}>
        Цей розділ уже є в меню. Його механіку буде додано наступним етапом.
      </p>
    </section>
  );
}

const PAGE_COMPONENTS = {
  hero: Heroes,
  heroes: Heroes,
  home: Home,
  clan: Clan,
  training: Training,
  skills: Skills,
  battle: Battle,
  battles: Battle,
  pets: Pets,
  inventory: Inventory,
  bag: Inventory,
  chest: Inventory,
  arena: Arena,
  career: Career,
  league: League,
  colosseum: Colosseum,
  cave: Cave,
  adventures: Adventures,
  mine: Mine,
  shop: Shop,
  equipmentShop: Shop,
  forge: Forge,
  laboratory: Laboratory,
  ranking: Ranking,
  sage: ComingSoon,
  immortalKing: ComingSoon,
  getGold: ComingSoon,
};

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value) {
  return number(value).toLocaleString("uk-UA");
}

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
  const [levelUpNotice, setLevelUpNotice] = useState(null);

  // Запам'ятовуємо попередній рівень, щоб не показувати
  // сповіщення під час першого входу в акаунт.
  const previousLevelRef = useRef(null);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      previousLevelRef.current = null;
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
      return;
    }

    if (!data) {
      setProfile(null);
      return;
    }

    const newLevel = Math.max(1, number(data.level, 1));
    const previous = previousLevelRef.current;

    // Перший профіль або інший користувач — лише встановлюємо базовий рівень.
    if (!previous || previous.userId !== userId) {
      previousLevelRef.current = { userId, level: newLevel };
      setProfile(data);
      setLevelUpNotice(null);
      return;
    }

    // Оновлюємо попередній рівень одразу, щоб уникнути повторних сповіщень.
    previousLevelRef.current = { userId, level: newLevel };
    setProfile(data);

    if (newLevel <= previous.level) {
      return;
    }

    // Беремо справжні нагороди з бази даних, а не вигадуємо суму.
    const { data: rewards, error: rewardsError } = await supabase
      .from("level_up_rewards")
      .select("level_reached, gold_reward")
      .eq("user_id", userId)
      .gt("level_reached", previous.level)
      .lte("level_reached", newLevel)
      .order("level_reached", { ascending: true });

    if (rewardsError) {
      console.error("Level rewards load error:", rewardsError);

      // Рівень підвищився, але дані нагороди недоступні.
      setLevelUpNotice({
        level: newLevel,
        gold: null,
      });
      return;
    }

    const totalGold = (rewards || []).reduce(
      (sum, reward) => sum + number(reward.gold_reward),
      0
    );

    setLevelUpNotice({
      level: newLevel,
      gold: totalGold,
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }

      setSession(currentSession);

      if (currentSession?.user?.id) {
        await loadProfile(currentSession.user.id);
      }

      if (mounted) setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);

      if (!nextSession?.user?.id) {
        setProfile(null);
        previousLevelRef.current = null;
        setLevelUpNotice(null);
        setLoading(false);
        return;
      }

      loadProfile(nextSession.user.id).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage("");

    if (!email.trim() || !password) {
      setAuthMessage("Введи email та пароль.");
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) setAuthMessage(error.message);
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthMessage(error.message);
        } else {
          setAuthMessage(
            "Акаунт створено. Перевір пошту для підтвердження."
          );
        }
      }
    } finally {
      setAuthLoading(false);
    }
  }

  function navigateTo(nextSection, nextSubsection = null) {
    if (!PAGE_COMPONENTS[nextSection]) {
      console.warn("Unknown navigation section:", nextSection);
      return;
    }

    setSection(nextSection);
    setSubsection(nextSubsection);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderBottomNavigation() {
    return (
      <nav style={styles.bottomNav}>
        {MAIN_PAGES.map((item) => {
          const active =
            section === item.id ||
            (item.id === "home" &&
              HOME_MENU.some((menuItem) => menuItem.id === section));

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.id)}
              style={{
                ...styles.bottomNavItem,
                ...(active ? styles.bottomNavItemActive : {}),
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  function renderHomeMenu() {
    if (section !== "home") return null;

    return (
      <section style={styles.menuSection}>
        <h2 style={styles.menuHeading}>🏰 ГОЛОВНА</h2>
        <div style={styles.menuGrid}>
          {HOME_MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(item.id)}
              style={styles.menuItem}
            >
              <span style={{ fontSize: 25 }}>{item.icon}</span>
              <span>{item.label}</span>
              {SUBSECTIONS[item.id] && <span>›</span>}
            </button>
          ))}
        </div>
      </section>
    );
  }

  function renderSubsectionMenu() {
    const items = SUBSECTIONS[section];
    if (!items) return null;

    const parent = HOME_MENU.find((item) => item.id === section);

    return (
      <section style={styles.menuSection}>
        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigateTo("home")}
        >
          ← На головну
        </button>

        <h2 style={styles.menuHeading}>
          {parent?.icon} {parent?.label}
        </h2>

        <div style={styles.menuGrid}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTo(section, item.id)}
              style={{
                ...styles.menuItem,
                ...(subsection === item.id ? styles.menuItemActive : {}),
              }}
            >
              <span style={{ fontSize: 23 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <div style={{ fontSize: 42 }}>🌅</div>
        <div>Завантаження...</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={styles.centerScreen}>
        <h2>Помилка авторизації</h2>
        <p>{authError}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={styles.authScreen}>
        <form onSubmit={handleAuth} style={styles.authCard}>
          <div style={{ fontSize: 44 }}>🌅</div>
          <h1 style={styles.authTitle}>Хроніки Згаслого Світанку</h1>
          <p style={styles.muted}>
            {authMode === "login"
              ? "Увійди у свій акаунт"
              : "Створи акаунт"}
          </p>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            autoComplete="email"
            style={styles.authInput}
            disabled={authLoading}
          />

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            autoComplete={
              authMode === "login" ? "current-password" : "new-password"
            }
            style={styles.authInput}
            disabled={authLoading}
          />

          {authMessage && (
            <p style={styles.authMessage}>{authMessage}</p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            style={styles.primaryButton}
          >
            {authLoading
              ? "Зачекай..."
              : authMode === "login"
              ? "Увійти"
              : "Зареєструватися"}
          </button>

          <button
            type="button"
            style={styles.textButton}
            onClick={() => {
              setAuthMessage("");
              setAuthMode(authMode === "login" ? "register" : "login");
            }}
          >
            {authMode === "login"
              ? "Немає акаунта? Зареєструватися"
              : "Вже є акаунт? Увійти"}
          </button>
        </form>
      </div>
    );
  }

  if (profile?.is_banned) {
    return (
      <div style={styles.centerScreen}>
        <div style={{ fontSize: 42 }}>⛔</div>
        <h2>Акаунт заблоковано</h2>
        <p>
          {profile.ban_reason ||
            "Доступ до гри обмежено адміністратором."}
        </p>
      </div>
    );
  }

  const CurrentPage = PAGE_COMPONENTS[section] || Home;
  const experiencePercent = Math.min(
    100,
    Math.max(0, number(profile?.experience) % 100)
  );

  const bottomHudStyle = {
    ...styles.bottomHud,
    bottom: 82,
  };

  return (
    <div style={styles.app}>
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

          <div style={{ minWidth: 0 }}>
            <div style={styles.playerName}>
              {profile?.display_name || profile?.username || "Гравець"}
            </div>
            {profile?.role === "admin" && (
              <span style={styles.adminBadge}>ADMIN</span>
            )}
          </div>
        </div>

        <div style={styles.topHud}>
          <div style={styles.topHudStat}>
            <span>❤️</span>
            <span>
              {profile?.health != null && profile?.max_health != null
                ? `${profile.health}/${profile.max_health}`
                : "—"}
            </span>
          </div>

          <div style={styles.topHudStat}>
            <span>⚡</span>
            <span>
              {profile?.energy ?? 0}/{profile?.max_energy ?? 100}
            </span>
          </div>
        </div>
      </header>

      <div style={styles.xpTrack}>
        <div
          style={{
            ...styles.xpFill,
            width: `${experiencePercent}%`,
          }}
        />
      </div>

      <main style={styles.content}>
        {section === "home" && renderHomeMenu()}

        {SUBSECTIONS[section] && renderSubsectionMenu()}

        {!(SUBSECTIONS[section] && subsection === null) &&
          (section === "arena" ? (
            <Arena
              key="arena"
              profile={profile}
              player={profile}
              onNavigate={navigateTo}
              onOpenLeague={() => navigateTo("league")}
              onProfileUpdate={() =>
                profile?.id && loadProfile(profile.id)
              }
            />
          ) : section === "league" ? (
            <League
              key="league"
              profile={profile}
              player={profile}
              onNavigate={navigateTo}
              onBack={() => navigateTo("arena")}
              onProfileUpdate={() =>
                profile?.id && loadProfile(profile.id)
              }
            />
          ) : (
            <CurrentPage
              key={`${section}-${subsection || ""}`}
              profile={profile}
              player={profile}
              section={section}
              subsection={subsection}
              onNavigate={navigateTo}
              onProfileUpdate={() =>
                profile?.id && loadProfile(profile.id)
              }
            />
          ))}

        {profileError && (
          <div style={styles.profileError}>
            Не вдалося оновити профіль: {profileError}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <div>Хроніки Згаслого Світанку</div>
        <div style={styles.muted}>Світло ще не згасло...</div>
      </footer>

      <div style={bottomHudStyle}>
        <div style={styles.hudItem}>
          <span style={styles.hudLabel}>РІВЕНЬ</span>
          <strong>{profile?.level ?? 1}</strong>
        </div>

        <div style={styles.hudItem}>
          <span style={styles.hudLabel}>ЗОЛОТО</span>
          <strong>🪙 {formatNumber(profile?.gold)}</strong>
        </div>

        <div style={styles.hudItem}>
          <span style={styles.hudLabel}>СРІБЛО</span>
          <strong>⚪ {formatNumber(profile?.silver)}</strong>
        </div>

        <div style={styles.hudItem}>
          <span style={styles.hudLabel}>КРИСТАЛИ</span>
          <strong>💎 {formatNumber(profile?.crystals)}</strong>
        </div>
      </div>

      {/* Глобальне сповіщення про підвищення рівня */}
      {levelUpNotice && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Підвищення рівня"
          style={styles.levelUpOverlay}
        >
          <div style={styles.levelUpCard}>
            <button
              type="button"
              aria-label="Закрити сповіщення"
              onClick={() => setLevelUpNotice(null)}
              style={styles.levelUpClose}
            >
              ×
            </button>

            <div style={styles.levelUpIcon}>✨</div>
            <div style={styles.levelUpEyebrow}>НОВА СИЛА ПРОБУДЖЕНА</div>
            <h2 style={styles.levelUpTitle}>Рівень підвищено!</h2>

            <div style={styles.levelUpLevel}>
              {levelUpNotice.level}
            </div>

                <p style={styles.levelUpText}>
              Ти став сильнішим. Подорож триває!
            </p>

            {levelUpNotice.gold !== null && (
              <div style={styles.levelUpReward}>
                <span>🪙</span>
                <span>+{formatNumber(levelUpNotice.gold)} золота</span>
              </div>
            )}

            <button
              type="button"
              style={styles.levelUpButton}
              onClick={() => setLevelUpNotice(null)}
            >
              
        
              ПРОДОВЖИТИ
            </button>
          </div>
        </div>
      )}

      {renderBottomNavigation()}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    paddingBottom: 160,
    background: "#120E0B",
    color: "#F1E5D3",
    fontFamily: "system-ui, sans-serif",
    boxSizing: "border-box",
  },

  centerScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
    textAlign: "center",
    background: "#120E0B",
    color: "#F1E5D3",
  },

  authScreen: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    background: "#120E0B",
    color: "#F1E5D3",
  },

  authCard: {
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    gap: 13,
    padding: 24,
    border: "1px solid #4A3726",
    borderRadius: 18,
    background: "#1D1714",
    textAlign: "center",
  },

  authTitle: {
    margin: 0,
    fontSize: 25,
    color: "#E7C394",
  },

  authInput: {
    width: "100%",
    padding: "13px 12px",
    border: "1px solid #4A3726",
    borderRadius: 10,
    background: "#120E0B",
    color: "#F1E5D3",
    fontSize: 15,
    boxSizing: "border-box",
  },

  authMessage: {
    margin: 0,
    color: "#E7A18B",
    fontSize: 13,
  },

  primaryButton: {
    padding: 13,
    border: "1px solid #B78343",
    borderRadius: 10,
    background: "#75491F",
    color: "#FFF0D6",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
  },

  textButton: {
    padding: 8,
    border: 0,
    background: "transparent",
    color: "#D4B382",
    cursor: "pointer",
  },

  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "12px 12px",
    borderBottom: "1px solid #39291D",
    background: "rgba(18,14,11,0.97)",
  },

  playerBlock: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    minWidth: 0,
  },

  avatar: {
    width: 42,
    height: 42,
    flexShrink: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    border: "1px solid #76542F",
    borderRadius: 12,
    background: "#291D14",
    fontSize: 23,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  playerName: {
    maxWidth: 155,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    fontWeight: 800,
    color: "#F0D7B1",
  },

  adminBadge: {
    display: "inline-block",
    marginTop: 4,
    padding: "2px 5px",
    borderRadius: 4,
    background: "#5D3A20",
    color: "#F1C47D",
    fontSize: 9,
    fontWeight: 900,
  },

  topHud: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  topHudStat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "8px 9px",
    border: "1px solid #493729",
    borderRadius: 9,
    background: "#211811",
    color: "#F0DFCA",
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  xpTrack: {
    height: 4,
    background: "#302319",
  },

  xpFill: {
    height: "100%",
    background: "#D4A04F",
    transition: "width 0.2s ease",
  },

  content: {
    width: "100%",
    maxWidth: 760,
    minHeight: "55vh",
    margin: "0 auto",
    padding: "14px 12px 25px",
    boxSizing: "border-box",
  },

  menuSection: {
    marginBottom: 18,
  },

  menuHeading: {
    margin: "8px 0 14px",
    color: "#D4B382",
    fontSize: 16,
    letterSpacing: 1,
  },

  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 9,
  },

  menuItem: {
    minHeight: 82,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    padding: 10,
    border: "1px solid #403023",
    borderRadius: 12,
    background: "#1D1714",
    color: "#E9D9C2",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    cursor: "pointer",
  },

  menuItemActive: {
    borderColor: "#B78343",
    background: "#302116",
  },

  backButton: {
    marginBottom: 12,
    padding: "9px 12px",
    border: "1px solid #493729",
    borderRadius: 9,
    background: "#211811",
    color: "#E7C394",
    cursor: "pointer",
  },

  panel: {
    padding: 24,
    border: "1px solid #403023",
    borderRadius: 15,
    background: "#1D1714",
    textAlign: "center",
  },

  panelTitle: {
    color: "#E7C394",
  },

  muted: {
    color: "#A99A89",
    fontSize: 13,
    lineHeight: 1.6,
  },

  profileError: {
    marginTop: 14,
    padding: 12,
    border: "1px solid #75443A",
    borderRadius: 9,
    color: "#E8A18D",
    fontSize: 12,
    overflowWrap: "anywhere",
  },

  bottomHud: {
    position: "fixed",
    zIndex: 45,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 3,
    width: "calc(100% - 16px)",
    maxWidth: 430,
    padding: "9px 4px",
    border: "1px solid #60472E",
    borderRadius: 13,
    background: "rgba(25,18,13,0.98)",
    boxShadow: "0 5px 20px rgba(0,0,0,0.4)",
    boxSizing: "border-box",
  },

  hudItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minWidth: 0,
    flex: 1,
  },

  hudLabel: {
    color: "#AD9476",
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: 0.3,
  },

  bottomNav: {
    position: "fixed",
    zIndex: 60,
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "space-around",
    gap: 5,
    padding: "8px 8px max(9px, env(safe-area-inset-bottom))",
    borderTop: "1px solid #493729",
    background: "#17110E",
  },

  bottomNavItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "5px 2px",
    border: "1px solid transparent",
    borderRadius: 9,
    background: "transparent",
    color: "#A99A89",
    fontSize: 10,
    cursor: "pointer",
  },

  bottomNavItemActive: {
    borderColor: "#60472E",
    background: "#2A1D13",
    color: "#E7C394",
  },

  footer: {
    padding: "15px 12px 25px",
    color: "#8E7B67",
    fontSize: 11,
    textAlign: "center",
  },

  levelUpOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    background: "rgba(7,5,4,0.82)",
    backdropFilter: "blur(5px)",
    boxSizing: "border-box",
  },

  levelUpCard: {
    position: "relative",
    width: "100%",
    maxWidth: 340,
    padding: "30px 22px 24px",
    border: "1px solid #B78343",
    borderRadius: 20,
    background:
      "radial-gradient(ellipse at top, #49301B 0%, #211710 52%, #15100D 100%)",
    boxShadow:
      "0 0 45px rgba(212,160,79,0.18), 0 20px 60px rgba(0,0,0,0.55)",
    textAlign: "center",
    boxSizing: "border-box",
  },

  levelUpClose: {
    position: "absolute",
    top: 8,
    right: 12,
    width: 34,
    height: 34,
    border: "1px solid #60472E",
    borderRadius: 9,
    background: "#211811",
    color: "#E7C394",
    fontSize: 25,
    lineHeight: 1,
    cursor: "pointer",
  },

  levelUpIcon: {
    fontSize: 48,
    marginBottom: 8,
    filter: "drop-shadow(0 0 14px rgba(231,195,148,0.4))",
  },

  levelUpEyebrow: {
    color: "#D4A04F",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 2,
  },

  levelUpTitle: {
    margin: "10px 0 15px",
    color: "#F5D8A7",
    fontSize: 24,
    lineHeight: 1.2,
  },

  levelUpLevel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 92,
    height: 92,
    margin: "0 auto",
    border: "2px solid #D4A04F",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, #5A3B20 0%, #2A1D13 70%)",
    color: "#FFE5AD",
    fontSize: 38,
    fontWeight: 900,
    boxShadow: "0 0 25px rgba(212,160,79,0.2)",
  },

  levelUpText: {
    margin: "16px 0",
    color: "#C6B39A",
    fontSize: 13,
    lineHeight: 1.5,
  },

  levelUpReward: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    margin: "0 0 20px",
    padding: "12px 10px",
    border: "1px solid #70512D",
    borderRadius: 11,
    background: "rgba(212,160,79,0.09)",
    color: "#F4D18E",
    fontSize: 16,
    fontWeight: 900,
  },

  levelUpButton: {
    width: "100%",
    padding: 13,
    border: "1px solid #D4A04F",
    borderRadius: 10,
    background: "linear-gradient(180deg, #98672E 0%, #65401D 100%)",
    color: "#FFF0D6",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
    cursor: "pointer",
  },
};
      
