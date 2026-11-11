
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  MessageCircle,
  Users,
  Shield,
  Crown,
  User,
  AlertCircle,
} from "lucide-react";

const ROLE_NAMES = {
  leader: "Лідер клану",
  deputy: "Заступник",
  general: "Генерал",
  officer: "Офіцер",
  fighter: "Воїн",
  newbie: "Новачок",
};

const ROLE_COLORS = {
  leader: "#f3c76e",
  deputy: "#d7a8ff",
  general: "#e99b67",
  officer: "#79b9e8",
  fighter: "#9acb8a",
  newbie: "#b5a58e",
};

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInitials(name) {
  return String(name || "Г")
    .trim()
    .slice(0, 2)
    .toUpperCase();
}

export default function ClanChat({
  clan,
  membership,
  profile,
  onBack,
}) {
  const clanId = clan?.id || membership?.clan_id;

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  const loadMessages = useCallback(async (showLoading = false) => {
    if (!clanId) {
      setLoading(false);
      setError("Не вдалося визначити клан.");
      return;
    }

    if (showLoading) setLoading(true);

    try {
      setError("");

      const { data: messageRows, error: messageError } =
        await supabase
          .from("clan_chat_messages")
          .select("id, clan_id, user_id, message, created_at")
          .eq("clan_id", clanId)
          .order("created_at", { ascending: true })
          .limit(100);

      if (messageError) throw messageError;

      const rows = messageRows || [];
      const userIds = [
        ...new Set(rows.map((item) => item.user_id)),
      ];

      if (!userIds.length) {
        setMessages([]);
        return;
      }

      const [
        { data: memberRows, error: memberError },
        { data: profiles, error: profileError },
      ] = await Promise.all([
        supabase
          .from("clan_members")
          .select("user_id, role, title")
          .eq("clan_id", clanId)
          .in("user_id", userIds),

        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds),
      ]);

      if (memberError) throw memberError;
      if (profileError) throw profileError;

      const memberMap = new Map(
        (memberRows || []).map((item) => [item.user_id, item])
      );

      const profileMap = new Map(
        (profiles || []).map((item) => [item.id, item])
      );

      const normalized = rows.map((item) => {
        const member = memberMap.get(item.user_id) || {};
        const player = profileMap.get(item.user_id) || {};

        return {
          ...item,
          authorName:
            player.display_name ||
            player.username ||
            "Гравець",
          avatarUrl: player.avatar_url || null,
          role: member.role || "newbie",
        };
      });

      setMessages(normalized);
    } catch (err) {
      console.error("Clan chat loading error:", err);
      setError(err?.message || "Не вдалося завантажити повідомлення.");
    } finally {
      setLoading(false);
    }
  }, [clanId]);

  useEffect(() => {
    loadMessages(true);
  }, [loadMessages]);

  // Автоматичне оновлення чату через Supabase Realtime
  useEffect(() => {
    if (!clanId) return;

    const channel = supabase
      .channel(`clan-chat-${clanId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clan_chat_messages",
          filter: `clan_id=eq.${clanId}`,
        },
        () => {
          loadMessages(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clanId, loadMessages]);

  // Прокручування до останнього повідомлення
  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [messages, loading, scrollToBottom]);

  const sendMessage = async (event) => {
    event?.preventDefault();

    const text = messageText.trim();

    if (!text || sending || !clanId) return;

    if (text.length > 2000) {
      setError("Повідомлення не може бути довшим за 2000 символів.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const userId = authData?.user?.id;

      if (!userId) {
        throw new Error("Потрібно авторизуватися.");
      }

      const { error: insertError } = await supabase
        .from("clan_chat_messages")
        .insert({
          clan_id: clanId,
          user_id: userId,
          message: text,
        });

      if (insertError) throw insertError;

      setMessageText("");
      await loadMessages(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Clan chat send error:", err);
      setError(err?.message || "Не вдалося надіслати повідомлення.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(event);
    }
  };

  if (!clanId) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          Не вдалося визначити клан.
        </div>
        {onBack && (
          <button style={styles.backButton} onClick={onBack}>
            <ArrowLeft size={17} />
            Назад
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ЗАГОЛОВОК */}
      <header style={styles.header}>
        <button
          type="button"
          style={styles.backButton}
          onClick={onBack}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={styles.headerIcon}>
          <MessageCircle size={22} />
        </div>

        <div style={styles.headerInfo}>
          <h2 style={styles.title}>Чат клану</h2>
          <p style={styles.subtitle}>
            <Users size={12} />
            Спілкування учасників
          </p>
        </div>

        <button
          type="button"
          style={styles.refreshButton}
          onClick={() => loadMessages(true)}
          disabled={loading}
          title="Оновити чат"
        >
          <RefreshCw
            size={17}
            className={loading ? "clan-chat-spinning" : ""}
          />
        </button>
      </header>

      {/* ІНФОРМАЦІЯ */}
      <div style={styles.infoBanner}>
        <Shield size={16} />
        <span>
          Чат доступний лише учасникам цього клану
        </span>
      </div>

      {/* ПОВІДОМЛЕННЯ */}
      <section
        ref={scrollContainerRef}
        style={styles.chatPanel}
      >
        {loading ? (
          <div style={styles.centerState}>
            <RefreshCw size={25} className="clan-chat-spinning" />
            <span>Завантаження повідомлень...</span>
          </div>
        ) : error && messages.length === 0 ? (
          <div style={styles.centerState}>
            <AlertCircle size={26} color="#df8b70" />
            <span>{error}</span>
            <button
              type="button"
              style={styles.retryButton}
              onClick={() => loadMessages(true)}
            >
              Спробувати ще раз
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <MessageCircle size={34} />
            </div>
            <h3>Поки що тут тихо</h3>
            <p>
              Напишіть перше повідомлення та розпочніть
              спілкування свого клану!
            </p>
          </div>
        ) : (
          <div style={styles.messageList}>
            {messages.map((message) => {
              const isMine =
                message.user_id === profile?.id ||
                message.user_id === membership?.user_id;

              const roleColor =
                ROLE_COLORS[message.role] || "#b5a58e";

              return (
                <article
                  key={message.id}
                  style={{
                    ...styles.message,
                    ...(isMine ? styles.myMessage : {}),
                  }}
                >
                  <div style={styles.messageAvatar}>
                    {message.avatarUrl ? (
                      <img
                        src={message.avatarUrl}
                        alt=""
                        style={styles.avatarImage}
                      />
                    ) : (
                      <span>
                        {getInitials(message.authorName)}
                      </span>
                    )}
                  </div>

                  <div style={styles.messageContent}>
                    <div style={styles.messageTop}>
                      <strong style={styles.authorName}>
                        {message.authorName}
                        {isMine ? " (Ти)" : ""}
                      </strong>

                      <span
                        style={{
                          ...styles.role,
                          color: roleColor,
                          borderColor: `${roleColor}55`,
                        }}
                      >
                        {message.role === "leader" && (
                          <Crown size={11} />
                        )}
                        {ROLE_NAMES[message.role] ||
                          message.role}
                      </span>
                    </div>

                    <div style={styles.messageBubble}>
                      <p style={styles.messageText}>
                        {message.message}
                      </p>
                    </div>

                    <time style={styles.messageTime}>
                      {formatDate(message.created_at)}
                    </time>
                  </div>
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </section>

      {/* ПОМИЛКА НАДСИЛАННЯ */}
      {error && messages.length > 0 && (
        <div style={styles.inlineError}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* ПОЛЕ ВВЕДЕННЯ */}
      <form style={styles.inputArea} onSubmit={sendMessage}>
        <textarea
          ref={inputRef}
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напиши повідомлення клану..."
          maxLength={2000}
          rows={2}
          disabled={sending}
          style={styles.textarea}
        />

        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          style={{
            ...styles.sendButton,
            opacity: !messageText.trim() || sending ? 0.45 : 1,
          }}
          title="Надіслати повідомлення"
        >
          {sending ? (
            <RefreshCw size={19} className="clan-chat-spinning" />
          ) : (
            <Send size={19} />
          )}
        </button>
      </form>

      <div style={styles.inputHint}>
        Enter — надіслати · Shift + Enter — новий рядок
      </div>

      <style>{`
        @keyframes clanChatSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .clan-chat-spinning {
          animation: clanChatSpin 1s linear infinite;
        }

        .clan-chat-message-scroll::-webkit-scrollbar {
          width: 5px;
        }

        .clan-chat-message-scroll::-webkit-scrollbar-thumb {
          background: #60472d;
          border-radius: 10px;
        }

        @media (max-width: 480px) {
          .clan-chat-placeholder {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    color: "#ead8b8",
    fontFamily: "inherit",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "4px 0 8px",
  },

  backButton: {
    width: 38,
    height: 38,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    border: "1px solid #59432c",
    borderRadius: 11,
    background: "#261b13",
    color: "#e8bd78",
    cursor: "pointer",
  },

  headerIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: 13,
    color: "#e8bd78",
    background: "linear-gradient(145deg,#49321d,#2b1e14)",
    border: "1px solid #79572f",
  },

  headerInfo: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "#f2d6a5",
  },

  subtitle: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    margin: "4px 0 0",
    color: "#a99070",
    fontSize: 11,
  },

  refreshButton: {
    width: 36,
    height: 36,
    display: "grid",
    placeItems: "center",
    border: "1px solid #59432c",
    borderRadius: 10,
    background: "#261b13",
    color: "#d9b77f",
    cursor: "pointer",
  },

  infoBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #514027",
    background: "#251c13",
    color: "#c5a875",
    fontSize: 11,
  },

  chatPanel: {
    minHeight: 380,
    maxHeight: 560,
    overflowY: "auto",
    padding: "14px 10px",
    border: "1px solid #493622",
    borderRadius: 15,
    background: "linear-gradient(160deg,#211810,#17120e)",
  },

  centerState: {
    minHeight: 340,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "#bca17c",
    fontSize: 13,
    textAlign: "center",
    padding: 20,
  },

  retryButton: {
    padding: "9px 14px",
    borderRadius: 9,
    border: "1px solid #76532c",
    background: "#382719",
    color: "#f0c77e",
    cursor: "pointer",
  },

  emptyState: {
    minHeight: 340,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 25,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    display: "grid",
    placeItems: "center",
    borderRadius: 22,
    background: "#332417",
    border: "1px solid #684b2a",
    color: "#d9ad68",
    marginBottom: 14,
  },

  messageList: {
    display: "flex",
    flexDirection: "column",
    gap: 17,
  },

  message: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    width: "100%",
  },

  myMessage: {
    flexDirection: "row",
  },

  messageAvatar: {
    width: 35,
    height: 35,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    borderRadius: 11,
    background: "#44301d",
    border: "1px solid #785630",
    color: "#f0c77e",
    fontSize: 11,
    fontWeight: 900,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  messageContent: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 5,
  },

  messageTop: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  authorName: {
    color: "#f0d8b1",
    fontSize: 12,
    fontWeight: 900,
  },

  role: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 7px",
    border: "1px solid",
    borderRadius: 20,
    background: "#302316",
    fontSize: 10,
    fontWeight: 800,
  },

  messageBubble: {
    maxWidth: "100%",
    padding: "10px 12px",
    border: "1px solid #4b3927",
    borderRadius: "4px 13px 13px 13px",
    background: "#302319",
    overflowWrap: "anywhere",
  },

  messageText: {
    margin: 0,
    color: "#e9d9c0",
    fontSize: 13,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },

  messageTime: {
    color: "#89765e",
    fontSize: 10,
    paddingLeft: 2,
  },

  inlineError: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 11px",
    borderRadius: 9,
    background: "#3b211a",
    border: "1px solid #784638",
    color: "#e6a18c",
    fontSize: 11,
  },

  inputArea: {
    display: "flex",
    alignItems: "flex-end",
    gap: 9,
    padding: 10,
    border: "1px solid #59432c",
    borderRadius: 14,
    background: "#241a12",
  },

  textarea: {
    flex: 1,
    minWidth: 0,
    resize: "vertical",
    minHeight: 42,
    maxHeight: 120,
    padding: "10px 11px",
    border: "1px solid #493622",
    borderRadius: 10,
    outline: "none",
    background: "#17120e",
    color: "#f0dfc5",
    fontFamily: "inherit",
    fontSize: 13,
    lineHeight: 1.45,
  },

  sendButton: {
    width: 43,
    height: 43,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    border: "1px solid #a87938",
    borderRadius: 11,
    background: "linear-gradient(145deg,#9a682d,#62401e)",
    color: "#fff0d2",
    cursor: "pointer",
  },

  inputHint: {
    color: "#88745a",
    fontSize: 10,
    textAlign: "center",
    marginTop: -5,
  },

  errorBox: {
    padding: 14,
    borderRadius: 10,
    background: "#3b211a",
    color: "#e6a18c",
  },
};
