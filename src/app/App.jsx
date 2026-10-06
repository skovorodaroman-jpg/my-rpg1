import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // SESSION
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Supabase session error:", error);

          if (mounted) {
            setError("Не вдалося перевірити авторизацію.");
          }
        }

        if (mounted) {
          setSession(data?.session ?? null);
        }
      } catch (err) {
        console.error("Session exception:", err);

        if (mounted) {
          setError("Помилка підключення до Supabase.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }

    loadProfile(session.user.id);
  }, [session]);

  async function loadProfile(userId) {
    setProfileLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          username,
          display_name,
          avatar_url,
          role,
          level,
          experience,
          gold,
          crystals,
          energy,
          max_energy,
          last_energy_update,
          is_banned,
          ban_reason,
          last_seen_at,
          created_at,
          updated_at
          `
        )
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profile load error:", error);
        throw error;
      }

      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);

      setError(
        "Не вдалося завантажити профіль гравця."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  // ============================================================
  // LOGIN / REGISTER
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Введи email.");
      return;
    }

    if (!password) {
      setError("Введи пароль.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Пароль має містити щонайменше 6 символів."
      );
      return;
    }

    if (
      mode === "register" &&
      !displayName.trim()
    ) {
      setError("Введи ім'я героя.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "login") {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) {
          throw error;
        }

        setSession(data.session);
        setMessage("Вхід виконано успішно! ⚔️");
      } else {
        const { data, error } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                display_name:
                  displayName.trim(),
              },
            },
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          setSession(data.session);

          setMessage(
            "Героя створено! Ласкаво просимо до Eldara ⚔️"
          );
        } else {
          setMessage(
            "Реєстрацію виконано! Перевір email для підтвердження акаунта."
          );
        }
      }
    } catch (err) {
      console.error("Auth error:", err);

      let text =
        "Сталася помилка. Спробуй ще раз.";

      if (err?.message) {
        text = err.message;
      }

      const lowerText =
        text.toLowerCase();

      if (
        lowerText.includes(
          "invalid login credentials"
        )
      ) {
        text =
          "Неправильний email або пароль.";
      }

      if (
        lowerText.includes(
          "user already registered"
        )
      ) {
        text =
          "Користувач із таким email вже існує.";
      }

      if (
        lowerText.includes(
          "email not confirmed"
        )
      ) {
        text =
          "Спочатку підтвердь email.";
      }

      if (
        lowerText.includes(
          "password should be at least"
        )
      ) {
        text =
          "Пароль має містити щонайменше 6 символів.";
      }

      setError(text);
    } finally {
      setBusy(false);
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async function handleLogout() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setSession(null);
      setProfile(null);

      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (err) {
      console.error("Logout error:", err);

      setError(
        "Не вдалося вийти з акаунта."
      );
    } finally {
      setBusy(false);
    }
  }

  // ============================================================
  // SWITCH AUTH MODE
  // ============================================================

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    setMessage("");
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.logo}>
            ⚔️
          </div>

          <h1 style={styles.title}>
            Хроніки Згаслого Світанку
          </h1>

          <p style={styles.muted}>
            Завантаження світу...
          </p>

          <div style={styles.loader} />
        </div>
      </div>
    );
  }

  // ============================================================
  // AUTHENTICATED USER
  // ============================================================

  if (session) {
    const userName =
      profile?.display_name ||
      profile?.username ||
      session.user?.user_metadata
        ?.display_name ||
      session.user?.email?.split("@")[0] ||
      "Герой";

    // ----------------------------------------------------------
    // PROFILE LOADING
    // ----------------------------------------------------------

    if (profileLoading) {
      return (
        <div style={styles.page}>
          <div style={styles.loadingCard}>
            <div style={styles.logo}>
              ⚔️
            </div>

            <h1 style={styles.title}>
              Хроніки Згаслого Світанку
            </h1>

            <p style={styles.muted}>
              Завантажуємо профіль героя...
            </p>

            <div style={styles.loader} />
          </div>
        </div>
      );
    }

    // ----------------------------------------------------------
    // PROFILE NOT FOUND
    // ----------------------------------------------------------

    if (!profile) {
      return (
        <div style={styles.page}>
          <div style={styles.gameCard}>
            <div style={styles.logoLarge}>
              ⚠️
            </div>

            <h1 style={styles.title}>
              Профіль не знайдено
            </h1>

            <p style={styles.muted}>
              Авторизація працює, але запис
              гравця в таблиці profiles
              не завантажився.
            </p>

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                loadProfile(session.user.id)
              }
              style={styles.primaryButton}
            >
              🔄 Спробувати ще раз
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={busy}
              style={styles.secondaryButton}
            >
              Вийти
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------------
    // BANNED USER
    // ----------------------------------------------------------

    if (profile.is_banned) {
      return (
        <div style={styles.page}>
          <div style={styles.gameCard}>
            <div style={styles.logoLarge}>
              🚫
            </div>

            <h1 style={styles.title}>
              Доступ заблоковано
            </h1>

            <p style={styles.muted}>
              Твій акаунт заблокований.
            </p>

            {profile.ban_reason && (
              <div style={styles.error}>
                Причина: {profile.ban_reason}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={busy}
              style={styles.secondaryButton}
            >
              Вийти з акаунта
            </button>
          </div>
        </div>
      );
    }

    // ----------------------------------------------------------
    // REAL PROFILE
    // ----------------------------------------------------------

    const level =
      Number(profile.level) || 1;

    const experience =
      Number(profile.experience) || 0;

    const gold =
      Number(profile.gold) || 0;

    const crystals =
      Number(profile.crystals) || 0;

    const energy =
      Number(profile.energy) || 0;

    const maxEnergy =
      Number(profile.max_energy) || 100;

    const role =
      profile.role || "player";

    return (
      <div style={styles.page}>
        <div style={styles.gameCard}>

          {/* HEADER */}

          <div style={styles.gameHeader}>
            <div style={styles.logoLarge}>
              ⚔️
            </div>

            <div style={styles.onlineBadge}>
              ● ONLINE
            </div>
          </div>

          <h1 style={styles.title}>
            Хроніки Згаслого Світанку
          </h1>

          <p style={styles.subtitle}>
            Ласкаво просимо, {userName}
          </p>

          {/* PROFILE */}

          <div style={styles.profileBox}>
            <div style={styles.avatar}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={userName}
                  style={styles.avatarImage}
                />
              ) : (
                userName
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            <div style={styles.profileInfo}>
              <div style={styles.profileName}>
                {userName}
              </div>

              <div style={styles.profileEmail}>
                {session.user?.email}
              </div>

              <div style={styles.role}>
                {role === "super_admin"
                  ? "👑 SUPER ADMIN"
                  : role === "admin"
                  ? "🛡️ ADMIN"
                  : role === "moderator"
                  ? "🔨 MODERATOR"
                  : "⚔️ ГРАВЕЦЬ"}
              </div>
            </div>
          </div>

          {/* LEVEL */}

          <div style={styles.levelCard}>
            <div style={styles.levelTop}>
              <span>
                Рівень героя
              </span>

              <strong>
                {level}
              </strong>
            </div>

            <div style={styles.xpBar}>
              <div
                style={{
                  ...styles.xpFill,
                  width: `${Math.min(
                    100,
                    experience % 100
                  )}%`,
                }}
              />
            </div>

            <div style={styles.xpText}>
              ✨ {experience} XP
            </div>
          </div>

          {/* RESOURCES */}

          <div style={styles.resources}>

            <div style={styles.resource}>
              <span style={styles.resourceIcon}>
                🪙
              </span>

              <strong>
                {gold.toLocaleString("uk-UA")}
              </strong>

              <small>
                Золото
              </small>
            </div>

            <div style={styles.resource}>
              <span style={styles.resourceIcon}>
                💎
              </span>

              <strong>
                {crystals.toLocaleString(
                  "uk-UA"
                )}
              </strong>

              <small>
                Кристали
              </small>
            </div>

            <div style={styles.resource}>
              <span style={styles.resourceIcon}>
                ⚡
              </span>

              <strong>
                {energy}/{maxEnergy}
              </strong>

              <small>
                Енергія
              </small>
            </div>

          </div>

          {/* GAME MENU */}

          <div style={styles.menuGrid}>

            <button
              type="button"
              style={styles.menuButton}
            >
              ⚔️
              <span>
                Бій
              </span>
            </button>

            <button
              type="button"
              style={styles.menuButton}
            >
              🦸
              <span>
                Герої
              </span>
            </button>

            <button
              type="button"
              style={styles.menuButton}
            >
              🐾
              <span>
                Пети
              </span>
            </button>

            <button
              type="button"
              style={styles.menuButton}
            >
              🎒
              <span>
                Інвентар
              </span>
            </button>

            <button
              type="button"
              style={styles.menuButton}
            >
              🏆
              <span>
                Арена
              </span>
            </button>

            <button
              type="button"
              style={styles.menuButton}
            >
              🏰
              <span>
                Клан
              </span>
            </button>

          </div>

          {/* DATABASE INFO */}

          <div style={styles.databaseInfo}>
            <div>
              🗄️ Профіль завантажено з Supabase
            </div>

            <div style={styles.userId}>
              ID: {profile.id}
            </div>
          </div>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            style={styles.secondaryButton}
          >
            {busy
              ? "Вихід..."
              : "🚪 Вийти з акаунта"}
          </button>

          {message && (
            <div style={styles.success}>
              ✅ {message}
            </div>
          )}

          {error && (
            <div style={styles.error}>
              ❌ {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // LOGIN / REGISTER
  // ============================================================

  return (
    <div style={styles.page}>
      <div style={styles.authCard}>

        <div style={styles.logo}>
          ⚔️
        </div>

        <h1 style={styles.title}>
          Хроніки Згаслого Світанку
        </h1>

        <p style={styles.subtitle}>
          Eldara чекає на свого героя
        </p>

        {/* TABS */}

        <div style={styles.tabs}>

          <button
            type="button"
            onClick={() =>
              switchMode("login")
            }
            style={{
              ...styles.tab,
              ...(mode === "login"
                ? styles.tabActive
                : {}),
            }}
          >
            Вхід
          </button>

          <button
            type="button"
            onClick={() =>
              switchMode("register")
            }
            style={{
              ...styles.tab,
              ...(mode === "register"
                ? styles.tabActive
                : {}),
            }}
          >
            Реєстрація
          </button>

        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit}>

          {mode === "register" && (
            <label style={styles.label}>
              Ім'я героя

              <input
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value
                  )
                }
                placeholder="Наприклад: Роман"
                maxLength={30}
                disabled={busy}
                style={styles.input}
              />
            </label>
          )}

          <label style={styles.label}>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="your@email.com"
              autoComplete="email"
              disabled={busy}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Пароль

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Мінімум 6 символів"
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              disabled={busy}
              style={styles.input}
            />
          </label>

          {error && (
            <div style={styles.error}>
              ❌ {error}
            </div>
          )}

          {message && (
            <div style={styles.success}>
              ✅ {message}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={styles.primaryButton}
          >
            {busy
              ? "Зачекай..."
              : mode === "login"
              ? "⚔️ Увійти в гру"
              : "✨ Створити героя"}
          </button>

        </form>

        <p style={styles.footerText}>
          {mode === "login"
            ? "Ще немає акаунта?"
            : "Вже маєш акаунт?"}{" "}

          <button
            type="button"
            onClick={() =>
              switchMode(
                mode === "login"
                  ? "register"
                  : "login"
              )
            }
            style={styles.linkButton}
          >
            {mode === "login"
              ? "Зареєструватися"
              : "Увійти"}
          </button>
        </p>

        <div style={styles.worldInfo}>
          🌑 Світ згасає.
          <br />
          🔥 Але надія ще жива.
        </div>

      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    background:
      "radial-gradient(circle at top, #3a1028 0%, #160812 45%, #080308 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily:
      "Inter, Arial, sans-serif",
  },

  authCard: {
    width: "100%",
    maxWidth: "440px",
    boxSizing: "border-box",
    background:
      "rgba(25, 9, 20, 0.94)",
    border:
      "1px solid rgba(232, 76, 130, 0.28)",
    borderRadius: "24px",
    padding: "30px 24px",
    boxShadow:
      "0 25px 80px rgba(0,0,0,0.55)",
  },

  loadingCard: {
    width: "100%",
    maxWidth: "440px",
    textAlign: "center",
    background:
      "rgba(25, 9, 20, 0.94)",
    border:
      "1px solid rgba(232, 76, 130, 0.25)",
    borderRadius: "24px",
    padding: "40px 24px",
    boxSizing: "border-box",
  },

  gameCard: {
    width: "100%",
    maxWidth: "560px",
    boxSizing: "border-box",
    textAlign: "center",
    background:
      "rgba(25, 9, 20, 0.96)",
    border:
      "1px solid rgba(232, 76, 130, 0.3)",
    borderRadius: "24px",
    padding: "30px 24px",
    boxShadow:
      "0 25px 80px rgba(0,0,0,0.55)",
  },

  gameHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  logo: {
    width: "76px",
    height: "76px",
    margin: "0 auto 18px",
    borderRadius: "22px",
    background:
      "linear-gradient(135deg, #e84c82, #7a1f4a)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px",
    boxShadow:
      "0 10px 35px rgba(232,76,130,0.25)",
  },

  logoLarge: {
    fontSize: "58px",
    marginBottom: "8px",
  },

  onlineBadge: {
    display: "inline-block",
    color: "#70e0a0",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1px",
    marginBottom: "12px",
  },

  title: {
    margin: "0",
    fontSize: "27px",
    lineHeight: "1.2",
    fontWeight: "800",
  },

  subtitle: {
    margin:
      "10px 0 24px",
    color: "#c7aeba",
    fontSize: "15px",
  },

  muted: {
    color: "#9d8996",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  tabs: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "8px",
    padding: "5px",
    marginBottom: "22px",
    background: "#100610",
    borderRadius: "13px",
  },

  tab: {
    border: "none",
    borderRadius: "10px",
    padding: "11px",
    background: "transparent",
    color: "#9d8996",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  tabActive: {
    background: "#e84c82",
    color: "#ffffff",
  },

  label: {
    display: "block",
    textAlign: "left",
    marginBottom: "15px",
    color: "#e9dbe3",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "7px",
    padding: "14px 15px",
    borderRadius: "12px",
    border:
      "1px solid rgba(255,255,255,0.1)",
    outline: "none",
    background: "#100610",
    color: "#ffffff",
    fontSize: "15px",
  },

  primaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "13px",
    padding: "15px",
    marginTop: "6px",
    background:
      "linear-gradient(135deg, #e84c82, #b92f65)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow:
      "0 10px 25px rgba(232,76,130,0.2)",
  },

  secondaryButton: {
    width: "100%",
    border:
      "1px solid rgba(232,76,130,0.35)",
    borderRadius: "13px",
    padding: "14px",
    marginTop: "18px",
    background: "transparent",
    color: "#f1b4c9",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  error: {
    margin:
      "12px 0",
    padding: "12px",
    borderRadius: "12px",
    background:
      "rgba(220, 60, 80, 0.12)",
    border:
      "1px solid rgba(220, 60, 80, 0.25)",
    color: "#ff9eab",
    fontSize: "13px",
    lineHeight: "1.5",
    wordBreak: "break-word",
  },

  success: {
    margin:
      "12px 0",
    padding: "12px",
    borderRadius: "12px",
    background:
      "rgba(70, 200, 120, 0.1)",
    border:
      "1px solid rgba(70, 200, 120, 0.2)",
    color: "#8de2ad",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  footerText: {
    marginTop: "20px",
    textAlign: "center",
    color: "#9d8996",
    fontSize: "13px",
  },

  linkButton: {
    border: "none",
    padding: "0",
    background: "transparent",
    color: "#e84c82",
    fontWeight: "700",
    cursor: "pointer",
  },

  worldInfo: {
    marginTop: "25px",
    paddingTop: "20px",
    borderTop:
      "1px solid rgba(255,255,255,0.07)",
    color: "#806b77",
    fontSize: "12px",
    lineHeight: "1.8",
  },

  profileBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textAlign: "left",
    padding: "15px",
    margin:
      "20px 0",
    borderRadius: "16px",
    background: "#100610",
    border:
      "1px solid rgba(255,255,255,0.06)",
  },

  avatar: {
    width: "60px",
    height: "60px",
    flexShrink: 0,
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, #e84c82, #702040)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    fontWeight: "800",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  profileInfo: {
    minWidth: 0,
    flex: 1,
  },

  profileName: {
    fontSize: "17px",
    fontWeight: "800",
    marginBottom: "4px",
  },

  profileEmail: {
    color: "#8e7986",
    fontSize: "12px",
    wordBreak: "break-all",
  },

  role: {
    marginTop: "6px",
    color: "#e84c82",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.5px",
  },

  levelCard: {
    textAlign: "left",
    padding: "16px",
    marginBottom: "12px",
    borderRadius: "16px",
    background: "#100610",
    border:
      "1px solid rgba(255,255,255,0.06)",
  },

  levelTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
    color: "#d8c5cf",
    fontSize: "13px",
  },

  xpBar: {
    width: "100%",
    height: "8px",
    overflow: "hidden",
    borderRadius: "99px",
    background: "#251421",
  },

  xpFill: {
    height: "100%",
    borderRadius: "99px",
    background:
      "linear-gradient(90deg, #e84c82, #ff9bc0)",
  },

  xpText: {
    marginTop: "7px",
    color: "#806b77",
    fontSize: "11px",
  },

  resources: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "18px",
  },

  resource: {
    padding: "14px 6px",
    borderRadius: "14px",
    background: "#100610",
    border:
      "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },

  resourceIcon: {
    fontSize: "20px",
  },

  menuGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "9px",
    marginBottom: "18px",
  },

  menuButton: {
    minHeight: "82px",
    border:
      "1px solid rgba(232,76,130,0.15)",
    borderRadius: "15px",
    background: "#100610",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    fontSize: "25px",
    cursor: "pointer",
  },

  databaseInfo: {
    marginTop: "8px",
    padding: "12px",
    borderRadius: "12px",
    background:
      "rgba(70, 200, 120, 0.06)",
    color: "#79c796",
    fontSize: "11px",
    lineHeight: "1.7",
  },

  userId: {
    color: "#607c6b",
    wordBreak: "break-all",
    marginTop: "3px",
  },

  loader: {
    width: "28px",
    height: "28px",
    margin: "22px auto 0",
    border:
      "3px solid rgba(255,255,255,0.1)",
    borderTop:
      "3px solid #e84c82",
    borderRadius: "50%",
    animation:
      "spin 1s linear infinite",
  },
};
