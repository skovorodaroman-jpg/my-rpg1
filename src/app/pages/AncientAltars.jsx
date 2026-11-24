
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AncientAltars({ profile, player }) {
  const [event, setEvent] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  const styles = {
    page: {
      minHeight: "100%",
      padding: "16px 12px 30px",
      color: "#ead9bd",
      background: "#120e0b",
    },
    card: {
      background: "linear-gradient(145deg, #251b16, #18120f)",
      border: "1px solid #59402b",
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
      boxShadow: "0 5px 18px #0005",
    },
    title: {
      textAlign: "center",
      color: "#e8b96e",
      fontSize: 25,
      fontWeight: 900,
      margin: "5px 0 8px",
      textShadow: "0 2px 8px #000",
    },
    subtitle: {
      textAlign: "center",
      color: "#bca58a",
      fontSize: 13,
      lineHeight: 1.5,
      marginBottom: 18,
    },
    sectionTitle: {
      color: "#e8b96e",
      fontSize: 16,
      fontWeight: 800,
      marginBottom: 12,
    },
    text: {
      color: "#cbbba5",
      fontSize: 13,
      lineHeight: 1.6,
    },
    button: {
      width: "100%",
      border: "1px solid #a66a24",
      borderRadius: 10,
      padding: "13px 12px",
      background: "linear-gradient(180deg, #e99b36, #a95616)",
      color: "#fff4df",
      fontWeight: 900,
      fontSize: 15,
      cursor: "pointer",
      marginTop: 14,
    },
    disabledButton: {
      width: "100%",
      border: "1px solid #51483e",
      borderRadius: 10,
      padding: "13px 12px",
      background: "#39312b",
      color: "#a99a88",
      fontWeight: 800,
      fontSize: 14,
      marginTop: 14,
      cursor: "not-allowed",
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      padding: "9px 0",
      borderBottom: "1px solid #ffffff12",
      fontSize: 13,
    },
    value: {
      color: "#f0c47f",
      fontWeight: 800,
      textAlign: "right",
    },
    notice: {
      padding: 11,
      borderRadius: 9,
      background: "#ffffff0b",
      border: "1px solid #ffffff18",
      color: "#cbbba5",
      fontSize: 13,
      lineHeight: 1.5,
      marginTop: 12,
    },
  };

  const loadData = useCallback(async () => {
    setError("");

    try {
      const { data: authData } = await supabase.auth.getUser();

      const currentUserId =
        authData?.user?.id || profile?.id || player?.id;

      if (!currentUserId) {
        setError("Не вдалося визначити гравця. Увійди в акаунт.");
        setEvent(null);
        setParticipant(null);
        setLoading(false);
        return;
      }

      setUserId(currentUserId);

      const { data: events, error: eventError } = await supabase
        .from("altar_events")
        .select("id, scheduled_at, starts_at, ends_at, status")
        .in("status", ["registration", "active"])
        .order("scheduled_at", { ascending: true })
        .limit(1);

      if (eventError) throw eventError;

      const currentEvent = events?.[0] || null;
      setEvent(currentEvent);

      if (currentEvent) {
        const { data: registered, error: participantError } =
          await supabase
            .from("altar_event_participants")
            .select(`
  id, event_id, user_id, clan_id,
  is_alive, control_mode,
  battle_hp, max_battle_hp,
  attack, defense, speed, crit,
  current_opponent_id,
  hero_snapshot
`)
          .eq("event_id", currentEvent.id)
            .eq("user_id", currentUserId)
            .maybeSingle();

        if (participantError) throw participantError;

        setParticipant(registered || null);
      } else {
        setParticipant(null);
      }
    } catch (err) {
      console.error("Ancient Altars load error:", err);
      setError(err.message || "Не вдалося завантажити дані події.");
    } finally {
      setLoading(false);
    }
  }, [profile?.id, player?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRegister = async () => {
    if (!event || !userId || registering || participant) return;

    setRegistering(true);
    setError("");
    setMessage("");

    try {
      const { error: registerError } = await supabase.rpc(
        "register_for_altar_event",
        {
          p_event_id: event.id,
        }
      );

      if (registerError) throw registerError;

      setMessage("Ти успішно зареєструвався на битву за алтарі!");
      await loadData();
    } catch (err) {
      console.error("Altar registration error:", err);

      setError(
        err.message || "Не вдалося зареєструватися. Спробуй ще раз."
      );
    } finally {
      setRegistering(false);
    }
  };

  const formatCountdown = (date) => {
    if (!date) return "Очікуємо початку";

    const difference = Math.max(
      0,
      new Date(date).getTime() - now
    );

    const totalSeconds = Math.floor(difference / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  };

  const formatDate = (date) => {
    if (!date) return "Не визначено";

    return new Date(date).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatus = () => {
    if (!event) return "Немає активної події";

    if (event.status === "registration") {
      return "Відкрита реєстрація";
    }

    if (event.status === "active") {
      return "Битва триває";
    }

    return "Очікування";
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: 30 }}>
            <div style={{ fontSize: 32 }}>🏛️</div>
            <p style={styles.text}>Завантаження древніх алтарів...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", fontSize: 48 }}>🏛️</div>

        <h1 style={styles.title}>ДРЕВНІ АЛТАРІ</h1>

        <div style={styles.subtitle}>
          Битва кланів за право володіти древньою силою
        </div>

        <div style={styles.notice}>
          ⚔️ Титани — це інші гравці. Кожен учасник клану самостійно
          реєструється та бере участь у битві.
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>📜 Інформація про подію</div>

        <div style={styles.infoRow}>
          <span>Статус</span>
          <span style={styles.value}>{getStatus()}</span>
        </div>

        {event && (
          <>
            <div style={styles.infoRow}>
              <span>Початок</span>
              <span style={styles.value}>
                {formatDate(event.scheduled_at)}
              </span>
            </div>

            <div style={styles.infoRow}>
              <span>Тривалість битви</span>
              <span style={styles.value}>5 хвилин</span>
            </div>

            <div style={styles.infoRow}>
              <span>Розклад</span>
              <span style={styles.value}>13:00 та 20:00</span>
            </div>

            {event.status === "registration" && (
              <div
                style={{
                  marginTop: 18,
                  padding: 15,
                  borderRadius: 12,
                  background: "#0d0b09",
                  border: "1px solid #8e642e",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#bda98e", fontSize: 12 }}>
                  ДО ПОЧАТКУ ПОДІЇ
                </div>

                <div
                  style={{
                    color: "#f4bd65",
                    fontSize: 30,
                    fontWeight: 900,
                    letterSpacing: 3,
                    marginTop: 7,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatCountdown(event.scheduled_at)}
                </div>
              </div>
            )}
          </>
        )}

        {!event && (
          <div style={styles.notice}>
            Наразі немає запланованої події. Коли наступний алтар
            буде створено, тут з'явиться можливість реєстрації.
          </div>
        )}
      </div>

      {event && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>⚔️ Участь у битві</div>

          {participant ? (
            <>
              <div
                style={{
                  textAlign: "center",
                  fontSize: 42,
                  margin: "8px 0",
                }}
              >
                {participant.is_alive ? "🛡️" : "💀"}
              </div>

              <div
                style={{
                  textAlign: "center",
                  color: participant.is_alive ? "#75d58a" : "#d78b79",
                  fontWeight: 900,
                  fontSize: 17,
                }}
              >
                {participant.is_alive
                  ? "Ти зареєстрований!"
                  : "Ти вибув із битви"}
              </div>

              <div style={styles.notice}>
                {event.status === "registration"
                  ? "Твоя заявка прийнята. Очікуй початку битви."
                  : participant.is_alive
                  ? "Ти береш участь у битві за древні алтарі."
                  : "Ти можеш спостерігати за перебігом битви до її завершення."}
              </div>

              <button
                type="button"
                style={styles.disabledButton}
                disabled
              >
                ✓ Заявку подано
              </button>
            </>
          ) : (
            <>
              <div style={styles.text}>
                Щоб твій клан міг боротися за алтар, подай особисту
                заявку на участь.
              </div>

              <div style={styles.notice}>
                <div>• Реєстрація безкоштовна.</div>
                <div>• Кожен гравець реєструється окремо.</div>
                <div>• До битви допускаються учасники кланів.</div>
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={
                  registering ||
                  event.status !== "registration" ||
                  new Date(event.scheduled_at).getTime() <= now
                }
                style={
                  registering ||
                  event.status !== "registration" ||
                  new Date(event.scheduled_at).getTime() <= now
                    ? styles.disabledButton
                    : styles.button
                }
              >
                {registering
                  ? "Реєстрація..."
                  : event.status !== "registration"
                  ? "Реєстрація закрита"
                  : "⚔️ УЧАСТВУВАТИ"}
              </button>
            </>
          )}

          {message && (
            <div
              style={{
                ...styles.notice,
                color: "#83dc96",
                borderColor: "#397b49",
              }}
            >
              ✓ {message}
            </div>
          )}

          {error && (
            <div
              style={{
                ...styles.notice,
                color: "#ff9b88",
                borderColor: "#9c4638",
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.sectionTitle}>🏆 Нагороди кланів</div>

        <div style={styles.infoRow}>
          <span>1–25 місце</span>
          <span style={styles.value}>1000 золота</span>
        </div>

        <div style={styles.infoRow}>
          <span>26–75 місце</span>
          <span style={styles.value}>250 золота</span>
        </div>

        <div style={styles.infoRow}>
          <span>76 місце і нижче</span>
          <span style={styles.value}>Без золота</span>
        </div>

        <div style={{ ...styles.text, marginTop: 12 }}>
          Учасники також отримують особисті нагороди за завдану
          шкоду та перемоги над супротивниками. Підсумковий рейтинг
          визначається після завершення битви.
        </div>
      </div>

      <button
        type="button"
        onClick={loadData}
        style={{
          ...styles.disabledButton,
          cursor: "pointer",
          background: "#292019",
          borderColor: "#6d5237",
        }}
      >
        ↻ Оновити інформацію
      </button>
    </div>
  );
}
