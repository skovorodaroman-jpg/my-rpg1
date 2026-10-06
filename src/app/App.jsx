import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      setError("Пароль має містити щонайменше 6 символів.");
      return;
    }

    if (mode === "register" && !displayName.trim()) {
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
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          setSession(data.session);
          setMessage("Героя створено! Ласкаво просимо до Eldara ⚔️");
        } else {
          setMessage(
            "Реєстрацію виконано! Перевір email для підтвердження акаунта."
          );
        }
      }
    } catch (err) {
      console.error("Auth error:", err);

      let text = "Сталася помилка. Спробуй ще раз.";

      if (err?.message) {
        text = err.message;
      }

      if (
        text.toLowerCase().includes("invalid login credentials")
      ) {
        text = "Неправильний email або пароль.";
      }

      if (
        text.toLowerCase().includes("user already registered")
      ) {
        text = "Користувач із таким email вже існує.";
      }

      if (
        text.toLowerCase().includes("email not confirmed")
      ) {
        text = "Спочатку підтвердь email.";
      }

      if (
        text.toLowerCase().includes("password should be at least")
      ) {
        text = "Пароль має містити щонайменше 6 символів.";
      }

      setError(text);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setSession(null);
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Не вдалося вийти з акаунта.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    setMessage("");
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.logo}>⚔️</div>

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

  if (session) {
    const userName =
      session.user?.user_metadata?.display_name ||
      session.user?.email?.split("@")[0] ||
      "Герой";

    return (
      <div style={styles.page}>
        <div style={styles.gameCard}>
          <div style={styles.logoLarge}>⚔️</div>

          <div style={styles.badge}>
            ONLINE
          </div>

          <h1 style={styles.title}>
            Хроніки Згаслого Світанку
          </h1>

          <p style={styles.subtitle}>
            Ласкаво просимо, {userName}
          </p>

          <div style={styles.profileBox}>
            <div style={styles.avatar}>
              {userName.charAt(0).toUpperCase()}
            </div>

            <div>
              <div style={styles.profileName}>
                {userName}
              </div>

              <div style={styles.profileEmail}>
                {session.user?.email}
              </div>
            </div>
          </div>

          <div style={styles.stats}>
            <div style={styles.stat}>
              <span>⭐</span>
              <strong>1</strong>
              <small>Рівень</small>
            </div>

            <div style={styles.stat}>
              <span>🪙</span>
              <strong>1000</strong>
              <small>Золото</small>
            </div>

            <div style={styles.stat}>
              <span>💎</span>
              <strong>100</strong>
              <small>Кристали</small>
            </div>
          </div>

          <div style={styles.success}>
            ⚔️ Авторизація працює!
          </div>

          <p style={styles.muted}>
            Наступним кроком підключимо справжній профіль,
            героїв, пети та прогрес гри.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            style={styles.secondaryButton}
          >
            {busy ? "Вихід..." : "Вийти з акаунта"}
          </button>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.authCard}>
        <div style={styles.logo}>⚔️</div>

        <h1 style={styles.title}>
          Хроніки Згаслого Світанку
        </h1>

        <p style={styles.subtitle}>
          Eldara чекає на свого героя
        </p>

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => switchMode("login")}
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
            onClick={() => switchMode("register")}
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

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <label style={styles.label}>
              Ім'я героя

              <input
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
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
    maxWidth: "520px",
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
    fontSize: "68px",
    marginBottom: "10px",
  },

  badge: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: "999px",
    background: "rgba(70, 200, 120, 0.12)",
    color: "#70e0a0",
    fontSize: "11px",
    fontWeight: "700",
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
    gridTemplateColumns: "1fr 1fr",
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
    width: "52px",
    height: "52px",
    flexShrink: 0,
    borderRadius: "15px",
    background:
      "linear-gradient(135deg, #e84c82, #702040)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "23px",
    fontWeight: "800",
  },

  profileName: {
    fontSize: "16px",
    fontWeight: "800",
    marginBottom: "4px",
  },

  profileEmail: {
    color: "#8e7986",
    fontSize: "12px",
    wordBreak: "break-all",
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "18px",
  },

  stat: {
    padding: "14px 8px",
    borderRadius: "14px",
    background: "#100610",
    border:
      "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
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
