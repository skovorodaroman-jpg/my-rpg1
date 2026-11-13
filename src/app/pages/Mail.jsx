
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Mail.css";

const TABS = [
  { id: "inbox", label: "Вхідні", icon: "📥" },
  { id: "write", label: "Написати", icon: "✉️" },
  { id: "friends", label: "Друзі", icon: "🤝" },
  { id: "blacklist", label: "Чорний список", icon: "🚫" },
  { id: "gifts", label: "Подарунки", icon: "🎁" },
];

const getName = (person) =>
  person?.display_name || person?.username || "Мандрівник";

const getId = (item) =>
  item?.user_id ||
  item?.friend_id ||
  item?.player_id ||
  item?.id ||
  item?.sender_id ||
  item?.receiver_id;

const getMessageSender = (message) =>
  message?.sender ||
  message?.sender_profile ||
  message?.sender_data ||
  {};

const getMessageReceiver = (message) =>
  message?.receiver ||
  message?.receiver_profile ||
  message?.receiver_data ||
  {};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Mail({ profile, player, onNavigate }) {
  const [activeTab, setActiveTab] = useState("inbox");
  const [mailData, setMailData] = useState({});
  const [userId, setUserId] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const [messageText, setMessageText] = useState("");
  const [friendUsername, setFriendUsername] = useState("");

  const [giftFriend, setGiftFriend] = useState("");
  const [giftName, setGiftName] = useState("");
  const [giftDescription, setGiftDescription] = useState("");
  const [giftImage, setGiftImage] = useState("");
  const [giftGold, setGiftGold] = useState("0");
  const [giftSilver, setGiftSilver] = useState("0");
  const [giftCrystals, setGiftCrystals] = useState("0");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadMail = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Потрібно авторизуватися.");

      setUserId(user.id);

      const { data, error: rpcError } = await supabase.rpc(
        "get_player_mail_data_v1"
      );

      if (rpcError) throw rpcError;

      setMailData(data || {});
    } catch (err) {
      console.error("Mail loading error:", err);
      setError(err.message || "Не вдалося завантажити пошту.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMail();
  }, [loadMail]);

  const friends = useMemo(
    () => mailData?.friends || [],
    [mailData]
  );

  const incomingRequests = useMemo(
    () => mailData?.incoming_requests || [],
    [mailData]
  );

  const outgoingRequests = useMemo(
    () => mailData?.outgoing_requests || [],
    [mailData]
  );

  const messages = useMemo(
    () => mailData?.messages || [],
    [mailData]
  );

  const blacklist = useMemo(
    () => mailData?.blacklist || [],
    [mailData]
  );

  const incomingGifts = useMemo(
    () => mailData?.incoming_gifts || [],
    [mailData]
  );

  const outgoingGifts = useMemo(
    () => mailData?.outgoing_gifts || [],
    [mailData]
  );

  const unreadCount = Number(mailData?.unread_messages || 0);
  const requestCount = Number(
    mailData?.incoming_requests_count ?? incomingRequests.length
  );
  const giftCount = Number(mailData?.new_gifts ?? incomingGifts.filter(
    (gift) => gift.status === "pending"
  ).length);

  const getFriend = useCallback(
    (id) => friends.find((friend) => getId(friend) === id),
    [friends]
  );

  const conversations = useMemo(() => {
    if (!userId) return [];

    const grouped = new Map();

    messages.forEach((message) => {
      const senderId = message.sender_id || getId(getMessageSender(message));
      const receiverId =
        message.receiver_id || getId(getMessageReceiver(message));

      const otherId = senderId === userId ? receiverId : senderId;
      if (!otherId) return;

      const friend = getFriend(otherId);
      if (!friend) return;

      const current = grouped.get(otherId) || {
        friend,
        messages: [],
        unread: 0,
      };

      current.messages.push(message);

      if (
        receiverId === userId &&
        message.is_read === false
      ) {
        current.unread += 1;
      }

      grouped.set(otherId, current);
    });

    return [...grouped.values()]
      .map((conversation) => ({
        ...conversation,
        messages: conversation.messages.sort(
          (a, b) =>
            new Date(a.created_at) - new Date(b.created_at)
        ),
      }))
      .sort((a, b) => {
        const aDate = a.messages.at(-1)?.created_at || "";
        const bDate = b.messages.at(-1)?.created_at || "";
        return new Date(bDate) - new Date(aDate);
      });
  }, [messages, userId, getFriend]);

  const activeConversation = useMemo(() => {
    if (!selectedFriend) return null;

    return conversations.find(
      (conversation) => getId(conversation.friend) === selectedFriend
    );
  }, [conversations, selectedFriend]);

  const notify = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 3500);
  };

  const handleSelectConversation = async (friend) => {
    const id = getId(friend);
    if (!id) return;

    setSelectedFriend(id);
    setActiveTab("inbox");

    const hasUnread = messages.some((message) => {
      const senderId =
        message.sender_id || getId(getMessageSender(message));
      const receiverId =
        message.receiver_id || getId(getMessageReceiver(message));

      return (
        senderId === id &&
        receiverId === userId &&
        message.is_read === false
      );
    });

    if (hasUnread) {
      const { error: readError } = await supabase.rpc(
        "mark_private_messages_read_v1",
        { p_sender_id: id }
      );

      if (readError) {
        console.error("Mark messages read error:", readError);
      } else {
        await loadMail();
      }
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!selectedFriend) {
      setError("Спочатку обери друга.");
      return;
    }

    const text = messageText.trim();

    if (!text) return;

    setSending(true);
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "send_private_message_v1",
        {
          p_receiver_id: selectedFriend,
          p_message: text,
        }
      );

      if (rpcError) throw rpcError;

      setMessageText("");
      await loadMail();
      notify("Повідомлення надіслано!");
    } catch (err) {
      setError(err.message || "Не вдалося надіслати повідомлення.");
    } finally {
      setSending(false);
    }
  };

  const handleSendFriendRequest = async (event) => {
    event.preventDefault();

    const username = friendUsername.trim().replace(/^@/, "");

    if (!username) {
      setError("Введи ім'я гравця.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data: target, error: searchError } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .ilike("username", username)
        .maybeSingle();

      if (searchError) throw searchError;
      if (!target) throw new Error("Гравця з таким ім'ям не знайдено.");

      const { data, error: rpcError } = await supabase.rpc(
        "send_friend_request_v1",
        { p_target_id: target.id }
      );

      if (rpcError) throw rpcError;

      setFriendUsername("");
      await loadMail();

      if (data?.status === "accepted") {
        notify("Ви вже друзі!");
      } else {
        notify("Запит на дружбу надіслано.");
      }
    } catch (err) {
      setError(err.message || "Не вдалося надіслати запит.");
    } finally {
      setSending(false);
    }
  };

  const handleFriendRequest = async (friendshipId, accept) => {
    setSending(true);
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "respond_friend_request_v1",
        {
          p_friendship_id: friendshipId,
          p_accept: accept,
        }
      );

      if (rpcError) throw rpcError;

      await loadMail();
      notify(accept ? "Гравця додано до друзів!" : "Запит відхилено.");
    } catch (err) {
      setError(err.message || "Не вдалося обробити запит.");
    } finally {
      setSending(false);
    }
  };

  const handleBlock = async (targetId) => {
    if (!targetId) return;

    if (!window.confirm("Заблокувати цього гравця?")) return;

    setSending(true);
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "block_player_v1",
        { p_target_id: targetId }
      );

      if (rpcError) throw rpcError;

      if (selectedFriend === targetId) setSelectedFriend(null);

      await loadMail();
      notify("Гравця заблоковано.");
    } catch (err) {
      setError(err.message || "Не вдалося заблокувати гравця.");
    } finally {
      setSending(false);
    }
  };

  const handleUnblock = async (targetId) => {
    setSending(true);
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "unblock_player_v1",
        { p_target_id: targetId }
      );

      if (rpcError) throw rpcError;

      await loadMail();
      notify("Гравця розблоковано.");
    } catch (err) {
      setError(err.message || "Не вдалося розблокувати гравця.");
    } finally {
      setSending(false);
    }
  };

  const handleSendGift = async (event) => {
    event.preventDefault();

    if (!giftFriend) {
      setError("Обери друга, якому хочеш надіслати подарунок.");
      return;
    }

    if (!giftName.trim()) {
      setError("Вкажи назву подарунка.");
      return;
    }

    const amounts = {
      gold: Number(giftGold || 0),
      silver: Number(giftSilver || 0),
      crystals: Number(giftCrystals || 0),
    };

    if (
      Object.values(amounts).some(
        (amount) => !Number.isSafeInteger(amount) || amount < 0
      )
    ) {
      setError("Кількість ресурсів має бути цілим невід'ємним числом.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "send_player_gift_v1",
        {
          p_receiver_id: giftFriend,
          p_gift_name: giftName.trim(),
          p_description: giftDescription.trim() || null,
          p_image_url: giftImage.trim() || null,
          p_gold: amounts.gold,
          p_silver: amounts.silver,
          p_crystals: amounts.crystals,
        }
      );

      if (rpcError) throw rpcError;

      setGiftName("");
      setGiftDescription("");
      setGiftImage("");
      setGiftGold("0");
      setGiftSilver("0");
      setGiftCrystals("0");

      await loadMail();
      notify("Подарунок надіслано!");
    } catch (err) {
      setError(err.message || "Не вдалося надіслати подарунок.");
    } finally {
      setSending(false);
    }
  };

  const handleGiftResponse = async (giftId, accept) => {
    setSending(true);
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "respond_player_gift_v1",
        {
          p_gift_id: giftId,
          p_accept: accept,
        }
      );

      if (rpcError) throw rpcError;

      await loadMail();
      notify(accept ? "Подарунок отримано!" : "Подарунок відхилено.");
    } catch (err) {
      setError(err.message || "Не вдалося обробити подарунок.");
    } finally {
      setSending(false);
    }
  };

  const renderPlayer = (person, actions = null) => (
    <div className="mail-player" key={getId(person)}>
      <div className="mail-avatar">
        {person?.avatar_url ? (
          <img src={person.avatar_url} alt="" />
        ) : (
          <span>⚔️</span>
        )}
      </div>

      <div className="mail-player-info">
        <strong>{getName(person)}</strong>
        <small>
          {person?.username ? `@${person.username}` : "Гравець"}
          {person?.level ? ` · Рівень ${person.level}` : ""}
        </small>
      </div>

      {actions && <div className="mail-player-actions">{actions}</div>}
    </div>
  );

  const renderInbox = () => (
    <div className="mail-content">
      {selectedFriend && activeConversation ? (
        <div className="mail-chat">
          <div className="mail-chat-header">
            <button
              className="mail-back-button"
              onClick={() => setSelectedFriend(null)}
            >
              ←
            </button>

            <div>
              <strong>{getName(activeConversation.friend)}</strong>
              <small>Особисте листування</small>
            </div>

            <button
              className="mail-icon-button danger"
              title="Заблокувати"
              onClick={() => handleBlock(selectedFriend)}
            >
              🚫
            </button>
          </div>

          <div className="mail-chat-messages">
            {activeConversation.messages.map((message) => {
              const senderId =
                message.sender_id || getId(getMessageSender(message));
              const mine = senderId === userId;

              return (
                <div
                  className={`mail-message ${mine ? "mine" : "theirs"}`}
                  key={message.id || message.message_id}
                >
                  <div className="mail-message-bubble">
                    {message.message || message.content || ""}
                  </div>
                  <small>{formatDate(message.created_at)}</small>
                </div>
              );
            })}

            {activeConversation.messages.length === 0 && (
              <div className="mail-empty">
                Тут поки немає повідомлень. Напиши першим!
              </div>
            )}
          </div>

          <form className="mail-send-form" onSubmit={handleSendMessage}>
            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="Напиши повідомлення..."
              maxLength={3000}
              rows={2}
            />
            <button disabled={sending || !messageText.trim()}>
              {sending ? "..." : "Надіслати"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="mail-section-heading">
            <div>
              <h3>Повідомлення</h3>
              <p>Твої особисті розмови з друзями</p>
            </div>
            <span className="mail-count">{unreadCount} нових</span>
          </div>

          {conversations.length > 0 ? (
            <div className="mail-list">
              {conversations.map((conversation) => {
                const friend = conversation.friend;
                const lastMessage = conversation.messages.at(-1);

                return (
                  <button
                    className="mail-conversation"
                    key={getId(friend)}
                    onClick={() => handleSelectConversation(friend)}
                  >
                    <div className="mail-avatar">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt="" />
                      ) : (
                        <span>⚔️</span>
                      )}
                    </div>

                    <div className="mail-conversation-info">
                      <strong>{getName(friend)}</strong>
                      <p>
                        {lastMessage?.sender_id === userId
                          ? "Ти: "
                          : ""}
                        {lastMessage?.message || "Почни розмову"}
                      </p>
                    </div>

                    <div className="mail-conversation-meta">
                      <small>{formatDate(lastMessage?.created_at)}</small>
                      {conversation.unread > 0 && (
                        <span className="mail-unread">
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mail-empty-card">
              <span>📭</span>
              <strong>Поки немає повідомлень</strong>
              <p>Коли друзі напишуть тобі, розмови з'являться тут.</p>
              <button onClick={() => setActiveTab("friends")}>
                Перейти до друзів
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderWrite = () => (
    <div className="mail-content">
      <div className="mail-section-heading">
        <div>
          <h3>Нове повідомлення</h3>
          <p>Спілкуватися можна лише з друзями</p>
        </div>
        <span>✉️</span>
      </div>

      {friends.length === 0 ? (
        <div className="mail-empty-card">
          <span>🤝</span>
          <strong>У тебе поки немає друзів</strong>
          <p>Спочатку знайди гравця та надішли йому запит на дружбу.</p>
          <button onClick={() => setActiveTab("friends")}>
            Знайти друзів
          </button>
        </div>
      ) : (
        <>
          <div className="mail-friend-picker">
            <label>Обери отримувача</label>
            <div className="mail-friend-grid">
              {friends.map((friend) => (
                <button
                  key={getId(friend)}
                  className={`mail-friend-choice ${
                    selectedFriend === getId(friend) ? "selected" : ""
                  }`}
                  onClick={() => setSelectedFriend(getId(friend))}
                >
                  <div className="mail-avatar">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt="" />
                    ) : (
                      <span>⚔️</span>
                    )}
                  </div>
                  <strong>{getName(friend)}</strong>
                  <small>Рівень {friend.level || 1}</small>
                </button>
              ))}
            </div>
          </div>

          {selectedFriend && (
            <form className="mail-compose-form" onSubmit={handleSendMessage}>
              <label>Твоє повідомлення</label>
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Напиши щось своє..."
                maxLength={3000}
                rows={5}
              />
              <div className="mail-compose-footer">
                <small>{messageText.length}/3000</small>
                <button disabled={sending || !messageText.trim()}>
                  {sending ? "Надсилання..." : "✉️ Надіслати"}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );

  const renderFriends = () => (
    <div className="mail-content">
      <div className="mail-section-heading">
        <div>
          <h3>Друзі</h3>
          <p>Гравці, з якими ти можеш спілкуватися</p>
        </div>
        <span className="mail-count">{friends.length}</span>
      </div>

      <form className="mail-add-friend" onSubmit={handleSendFriendRequest}>
        <input
          value={friendUsername}
          onChange={(event) => setFriendUsername(event.target.value)}
          placeholder="Введи username гравця"
        />
        <button disabled={sending || !friendUsername.trim()}>
          Додати
        </button>
      </form>

      {incomingRequests.length > 0 && (
        <div className="mail-subsection">
          <h4>📩 Вхідні заявки ({incomingRequests.length})</h4>

          {incomingRequests.map((request) => (
            <div className="mail-request-card" key={request.friendship_id}>
              {renderPlayer(request, (
                <>
                  <button
                    className="mail-small-button accept"
                    disabled={sending}
                    onClick={() =>
                      handleFriendRequest(request.friendship_id, true)
                      }
                  >
                    ✕
                  </button>
                </>
              ))}
            </div>
          ))}
        </div>
      )}

      {outgoingRequests.length > 0 && (
        <div className="mail-subsection">
          <h4>⏳ Надіслані заявки ({outgoingRequests.length})</h4>
          {outgoingRequests.map((request) => (
            <div key={request.friendship_id}>
              {renderPlayer(request, (
                <span className="mail-pending-label">Очікує</span>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mail-subsection">
        <h4>🤝 Мої друзі ({friends.length})</h4>

        {friends.length > 0 ? (
          friends.map((friend) => (
            <div className="mail-friend-row" key={getId(friend)}>
              {renderPlayer(friend, (
                <>
                  <button
                    className="mail-small-button"
                    title="Написати"
                    onClick={() => handleSelectConversation(friend)}
                        >
                    ✉️
                  </button>
                  <button
                    className="mail-small-button reject"
                    title="Заблокувати"
                    disabled={sending}
                    onClick={() => handleBlock(getId(friend))}
                  >
                    🚫
                  </button>
                </>
              ))}
            </div>
          ))
        ) : (
          <div className="mail-empty">
            Список друзів поки порожній.
          </div>
        )}
      </div>
    </div>
  );

  const renderBlacklist = () => (
    <div className="mail-content">
      <div className="mail-section-heading">
        <div>
          <h3>Чорний список</h3>
          <p>Заблоковані гравці не можуть спілкуватися з тобою</p>
        </div>
        <span>🚫</span>
      </div>

      {blacklist.length > 0 ? (
        blacklist.map((person) => (
          <div className="mail-blacklist-row" key={getId(person)}>
            {renderPlayer(person, (
              <button
                className="mail-small-button accept"
                disabled={sending}
                onClick={() => handleUnblock(getId(person))}
              >
                Розблокувати
              </button>
            ))}
          </div>
        ))
      ) : (
        <div className="mail-empty-card">
          <span>🛡️</span>
          <strong>Чорний список порожній</strong>
          <p>Тут відображатимуться гравці, яких ти заблокував.</p>
        </div>
      )}
    </div>
  );

  const renderGiftCard = (gift, incoming) => {
    const person = incoming
      ? gift.sender || gift.sender_profile || {
          user_id: gift.sender_id,
          username: gift.sender_username,
          display_name: gift.sender_display_name,
          avatar_url: gift.sender_avatar_url,
          level: gift.sender_level,
        }
      : gift.receiver || gift.receiver_profile || {
          user_id: gift.receiver_id,
          username: gift.receiver_username,
          display_name: gift.receiver_display_name,
          avatar_url: gift.receiver_avatar_url,
          level: gift.receiver_level,
        };
    const pending = gift.status === "pending";

    return (
      <div className="mail-gift-card" key={gift.id || gift.gift_id}>
        <div className="mail-gift-top">
          <div className="mail-gift-icon">🎁</div>
          <div className="mail-gift-title">
            <strong>{gift.gift_name || "Подарунок"}</strong>
            <small>
              {incoming ? "Від: " : "Для: "}
              {getName(person)}
            </small>
          </div>
          <span className={`mail-gift-status ${gift.status || "pending"}`}>
            {gift.status === "accepted"
              ? "Отримано"
              : gift.status === "rejected"
              ? "Відхилено"
              : "Очікує"}
          </span>
        </div>

        {gift.gift_description && (
          <p className="mail-gift-description">
            {gift.gift_description}
          </p>
        )}

        {gift.gift_image_url && (
          <img
            className="mail-gift-image"
            src={gift.gift_image_url}
            alt={gift.gift_name || "Подарунок"}
          />
        )}
           <div className="mail-gift-resources">
          {Number(gift.gold_amount) > 0 && (
            <span>🪙 {gift.gold_amount} золота</span>
          )}
          {Number(gift.silver_amount) > 0 && (
            <span>🥈 {gift.silver_amount} срібла</span>
          )}
          {Number(gift.crystals_amount) > 0 && (
            <span>💎 {gift.crystals_amount} кристалів</span>
          )}
        </div>

        <small className="mail-gift-date">
          {formatDate(gift.created_at)}
        </small>

        {incoming && pending && (
          <div className="mail-gift-actions">
            <button
              className="mail-gift-accept"
              disabled={sending}
              onClick={() => handleGiftResponse(gift.id || gift.gift_id, true)}
            >
              ✓ Прийняти
            </button>
            <button
              className="mail-gift-reject"
              disabled={sending}
              onClick={() => handleGiftResponse(gift.id || gift.gift_id, false)}
            >
              ✕ Відхилити
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderGifts = () => (
    <div className="mail-content">
      <div className="mail-section-heading">
        <div>
          <h3>Подарунки</h3>
          <p>Приємні сюрпризи від інших мандрівників</p>
        </div>
          <span className="mail-count">{giftCount} нових</span>
      </div>

      <div className="mail-subsection">
        <h4>🎁 Надіслати подарунок</h4>

        {friends.length === 0 ? (
          <div className="mail-empty">
            Спочатку потрібно додати гравця до друзів.
          </div>
        ) : (
          <form className="mail-compose-form" onSubmit={handleSendGift}>
            <label>Отримувач</label>
            <select
              value={giftFriend}
              onChange={(event) => setGiftFriend(event.target.value)}
              required
            >
              <option value="">Обери друга</option>
              {friends.map((friend) => (
                <option key={getId(friend)} value={getId(friend)}>
                  {getName(friend)}
                </option>
              ))}
            </select>

            <label>Назва подарунка</label>
            <input
              value={giftName}
              onChange={(event) => setGiftName(event.target.value)}
              placeholder="Наприклад: Подарунок від друга"
              maxLength={100}
              required
            />

               <label>Опис</label>
            <textarea
              value={giftDescription}
              onChange={(event) => setGiftDescription(event.target.value)}
              placeholder="Напиши побажання..."
              rows={2}
            />

            <label>Посилання на зображення (необов'язково)</label>
            <input
              value={giftImage}
              onChange={(event) => setGiftImage(event.target.value)}
              placeholder="https://..."
            />

            <div className="mail-resource-fields">
              <div>
                <label>🪙 Золото</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={giftGold}
                  onChange={(event) => setGiftGold(event.target.value)}
                />
              </div>
              <div>
                <label>🥈 Срібло</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={giftSilver}
                  onChange={(event) => setGiftSilver(event.target.value)}
                />
              </div>
               <div>
                <label>💎 Кристали</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={giftCrystals}
                  onChange={(event) => setGiftCrystals(event.target.value)}
                />
              </div>
            </div>

            <button className="mail-submit-button" disabled={sending}>
              {sending ? "Надсилання..." : "🎁 Надіслати подарунок"}
            </button>
          </form>
        )}
      </div>

      <div className="mail-subsection">
        <h4>📥 Отримані подарунки</h4>
        {incomingGifts.length > 0 ? (
          incomingGifts.map((gift) => renderGiftCard(gift, true))
        ) : (
          <div className="mail-empty">
            Тобі ще не надсилали подарунків.
          </div>
        )}
      </div>

      <div className="mail-subsection">
        <h4>📤 Надіслані подарунки</h4>
        {outgoingGifts.length > 0 ? (
          outgoingGifts.map((gift) => renderGiftCard(gift, false))
      ) : (
          <div className="mail-empty">
            Ти ще не надсилав подарунків.
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "write":
        return renderWrite();
      case "friends":
        return renderFriends();
      case "blacklist":
        return renderBlacklist();
      case "gifts":
        return renderGifts();
      default:
        return renderInbox();
    }
  };

  return (
    <div className="mail-page">
      <div className="mail-page-header">
        <button
          className="mail-back-button"
          onClick={() => onNavigate?.("hero")}
          title="Повернутися до героя"
        >
          ←
        </button>
          <div className="mail-page-title">
          <span>✉️</span>
          <div>
            <h2>Пошта</h2>
            <p>Твій зв'язок зі світом</p>
          </div>
        </div>

        <button
          className="mail-refresh-button"
          onClick={loadMail}
          disabled={loading}
          title="Оновити"
        >
          ↻
        </button>
      </div>

      <div className="mail-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`mail-tab ${
              activeTab === tab.id ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedFriend(null);
              setError("");
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>

            {tab.id === "inbox" && unreadCount > 0 && (
              <i>{unreadCount}</i>
            )}
            {tab.id === "friends" && requestCount > 0 && (
              <i>{requestCount}</i>
            )}
            {tab.id === "gifts" && giftCount > 0 && (
              <i>{giftCount}</i>
            )}
                </button>
        ))}
      </div>

      {error && (
        <div className="mail-alert error">
          <span>{error}</span>
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {notice && (
        <div className="mail-alert success">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="mail-loading">
          <span className="mail-loader" />
          <p>Завантаження пошти...</p>
        </div>
      ) : (
        renderActiveTab()
      )}
    </div>
  );
}
