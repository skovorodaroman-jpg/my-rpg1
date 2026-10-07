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
  const [page, setPage] = useState("hero");

  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        setPage("hero");
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

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

  async function handleLogout() {
    setError("");
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    setSession(null);
    setProfile(null);
    setPage("hero");
  }

  function navigateTo(nextPage) {
    if (PAGE_COMPONENTS[nextPage]) {
      setPage(nextPage);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.logo}>⚔️</div>
        <h2>Хроніки Згаслого Світанку</h2>
        <p style={styles.muted}>Завантаження світу...</p>
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <div style={styles.centerScreen}>
        <form style={styles.authCard} onSubmit={handleAuth}>
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
              onChange={(event) => setUsername(event.target.value)}
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
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Пароль (мінімум 6 символів)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />

          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

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
                authMode === "login" ? "register" : "login"
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

  if (profile.is_banned) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.authCard}>
          <div style={styles.logo}>🚫</div>
          <h2>Акаунт заблоковано</h2>
          <p>{profile.ban_reason || "Звернися до адміністрації гри."}</p>
          <button style={styles.primaryButton} onClick={handleLogout}>
            Вийти з акаунта
          </button>
        </div>
      </div>
    );
  }

  const CurrentPage = PAGE_COMPONENTS[page] || Home;

  return (
    <div style={styles.app}>
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
              Рівень {profile.level ?? 1} · {profile.role || "player"}
            </div>
          </div>
        </div>

        <div style={styles.resources}>
          <span title="Золото">🪙 {profile.gold ?? 0}</span>
          <span title="Кристали">💎 {profile.crystals ?? 0}</span>
          <span title="Енергія">
            ⚡ {profile.energy ?? 0}/{profile.max_energy ?? 100}
          </span>
        </div>
      </header>

      <div style={styles.xpTrack} title="Досвід героя">
        <div
          style={{
            ...styles.xpFill,
            width: `${Math.min(
              100,
              Math.max(
                0,
                ((profile.experience ?? 0) % 1000) / 10
              )
            )}%`,
          }}
        />
      </div>

      <nav style={styles.navigation}>
        {PAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigateTo(item.id)}
            style={{
              ...styles.navButton,
              ...(page === item.id ? styles.activeNavButton : {}),
            }}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <main style={styles.content}>
        {error && (
          <div style={styles.notice}>
            {error}
            <button
              style={styles.dismissButton}
              onClick={() => setError("")}
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
        />
      </main>

      <footer style={styles.footer}>
        <div>
          <strong>
            {profile.display_name || profile.username || "Гравець"}
          </strong>
          <span style={styles.smallText}>
            {" "}· Рівень {profile.level ?? 1}
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
    background: "radial-gradient(circle at top, #40152f, #100811 65%)",
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
  navigation: {
    display: "flex",
    gap: 6,
    padding: 10,
    overflowX: "auto",
    background: "#170d1a",
    borderBottom: "1px solid #42243e",
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
  },
  activeNavButton: {
    background: "#3a1935",
    borderColor: "#a43f76",
    color: "#fff",
  },
  navIcon: {
    fontSize: 22,
  },
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
    gap: 12,
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    background: "#42202b",
    color: "#ffd1df",
    overflowWrap: "anywhere",
  },
  dismissButton: {
    border: 0,
    background: "transparent",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
  },
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
