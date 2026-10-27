
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const styles = {
  page: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
    color: "#E8D8B8",
    paddingBottom: 24,
  },
  heading: {
    textAlign: "center",
    color: "#E8B56B",
    fontSize: 24,
    margin: "8px 0",
  },
  subtitle: {
    textAlign: "center",
    color: "#9E8C72",
    fontSize: 13,
    marginBottom: 20,
  },
  card: {
    background: "linear-gradient(145deg, #282019, #17120F)",
    border: "1px solid #51402C",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  title: {
    color: "#F1D6A3",
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 7,
  },
  description: {
    color: "#B9A88D",
    fontSize: 13,
    lineHeight: 1.5,
  },
  track: {
    height: 8,
    background: "#0E0C0A",
    borderRadius: 8,
    overflow: "hidden",
    margin: "12px 0 7px",
  },
  button: {
    width: "100%",
    padding: 11,
    border: "1px solid #A8793E",
    borderRadius: 8,
    background: "#49331D",
    color: "#F7DCA7",
    fontWeight: 700,
    marginTop: 12,
  },
  error: {
    color: "#F0A09A",
    background: "#301A18",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    overflowWrap: "anywhere",
  },
};

function formatReward(rewards = {}) {
  const labels = {
    relics: "🏺 реліквій",
    gold: "🪙 золота",
    silver: "⚪ срібла",
    experience: "✨ досвіду",
    energy: "⚡ енергії",
    clan_treasury_gold: "🛡️ золота клану",
  };

  return Object.entries(rewards)
    .filter(([, value]) => Number(value) > 0)
    .map(([key, value]) => `${labels[key] || key}: +${value}`)
    .join(" · ");
}

function remainingTime(date) {
  const seconds = Math.max(
    0,
    Math.ceil((new Date(date).getTime() - Date.now()) / 1000)
  );

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  if (hours > 0) return `${hours} год ${minutes} хв ${rest} сек`;
  return `${minutes} хв ${rest} сек`;
}

export default function Sage({ profile, subsection }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const loadQuests = useCallback(async () => {
    if (!profile?.id) {
      setQuests([]);
      setLoading(false);
      return;
    }

    setError("");

    try {
      const { error: refreshError } = await supabase.rpc(
        "refresh_sage_quests"
      );

      if (refreshError) throw refreshError;

      const { data: catalog, error: catalogError } = await supabase
        .from("quests")
        .select("id, code, title, description, requirements, rewards")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (catalogError) throw catalogError;

      const { data: progress, error: progressError } = await supabase
        .from("player_quests")
        .select(
          "quest_id, progress, status, completed_at, claimed_at, available_again_at"
        )
        .eq("user_id", profile.id);

      if (progressError) throw progressError;

      const progressById = new Map(
        (progress || []).map((item) => [item.quest_id, item])
      );

      setQuests(
        (catalog || []).map((quest) => ({
          ...quest,
          playerQuest: progressById.get(quest.id) || null,
        }))
      );
    } catch (err) {
      console.error("Sage quests load error:", err);
      setError(err.message || "Не вдалося завантажити завдання.");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (subsection && subsection !== "quests") {
    const sections = {
      trophies: ["🏆", "Трофеї"],
      collections: ["📚", "Колекції"],
      relics: ["🏺", "Стародавні реліквії"],
    };
    const [icon, title] = sections[subsection] || ["🧙", "Хижа мудреця"];

    return (
      <section style={styles.card}>
        <div style={{ fontSize: 36 }}>{icon}</div>
        <h2 style={styles.heading}>{title}</h2>
        <p style={styles.subtitle}>
          Цей розділ буде реалізовано окремо.
        </p>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <h2 style={styles.heading}>🧙 Завдання мудреця</h2>
      <p style={styles.subtitle}>
        Виконуй завдання, отримуй нагороди та повертайся після відновлення.
      </p>

      {error && (
        <div style={styles.error}>
          {error}
          <button
            type="button"
            style={styles.button}
            onClick={loadQuests}
          >
            Спробувати ще раз
          </button>
        </div>
      )}

      {loading && <p style={styles.subtitle}>Завантаження завдань...</p>}

      {!loading && !error && quests.length === 0 && (
        <div style={styles.card}>
          Активних завдань поки немає.
        </div>
      )}

      {quests.map((quest) => {
        const playerQuest = quest.playerQuest;
        const progress = playerQuest?.progress || {};
        const target = Number(
          quest.requirements?.target ?? progress.target ?? 1
        );
        const current = Math.min(
          target,
          Math.max(0, Number(progress.current ?? 0))
        );
        const percent = target > 0 ? (current / target) * 100 : 0;
        const cooldown =
          playerQuest?.status === "cooldown" &&
          playerQuest?.available_again_at &&
          new Date(playerQuest.available_again_at).getTime() > now;

        return (
          <article key={quest.id} style={styles.card}>
            <div style={styles.title}>{quest.title}</div>
            <div style={styles.description}>{quest.description}</div>

            <div style={styles.track}>
              <div
                style={{
                  height: "100%",
                  width: `${percent}%`,
                  background: "linear-gradient(90deg, #98703A, #E8B45F)",
                  borderRadius: 8,
                  transition: "width 0.25s",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                color: "#B9A88D",
                fontSize: 12,
              }}
            >
              <span>Прогрес</span>
              <span>{current} / {target}</span>
            </div>

            <div style={{ ...styles.description, marginTop: 10 }}>
              🎁 {formatReward(quest.rewards) || "Нагорода уточнюється"}
            </div>

            {cooldown && (
              <div
                style={{
                  color: "#E8B45F",
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                ⏳ Повторно доступне через{" "}
                {remainingTime(playerQuest.available_again_at)}
              </div>
            )}

            {!playerQuest && (
              <div style={{ ...styles.description, marginTop: 10 }}>
                Завдання ще не ініціалізовано для цього гравця.
              </div>
            )}

            {playerQuest?.status === "completed" && (
              <div style={{ color: "#9DD49A", marginTop: 10 }}>
                ✓ Завдання виконано
              </div>
            )}

            {playerQuest?.status === "claimed" && (
              <div style={{ color: "#9DD49A", marginTop: 10 }}>
                ✓ Нагороду отримано
              </div>
            )}
          </article>
        );
      })}

      <button
        type="button"
        style={styles.button}
        onClick={loadQuests}
        disabled={loading}
      >
        ↻ Оновити завдання
      </button>
    </section>
  );
    }
          
