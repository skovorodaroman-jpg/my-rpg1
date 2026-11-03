import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  BookOpen,
  Trophy,
  Users,
  Shield,
  Coins,
  RefreshCw,
  Clock,
  Sparkles,
  User,
  Activity,
  Crown,
} from "lucide-react";
import "./ClanJournal.css";

const TABS = [
  { id: "journal", label: "Журнал", icon: BookOpen },
  { id: "experience", label: "Досвід", icon: Trophy },
  { id: "members", label: "Хто де?", icon: Users },
];

const EVENT_INFO = {
  member_joined: {
    label: "Вступ до клану",
    icon: "➕",
    color: "green",
  },
  member_left: {
    label: "Вихід із клану",
    icon: "🚪",
    color: "red",
  },
  deputy_assigned: {
    label: "Новий заступник",
    icon: "🛡️",
    color: "blue",
  },
  leader_changed: {
    label: "Зміна лідера",
    icon: "👑",
    color: "gold",
  },
  gold_contribution: {
    label: "Внесок золота",
    icon: "🪙",
    color: "gold",
  },
  statue_upgraded: {
    label: "Покращення статуї",
    icon: "🗿",
    color: "purple",
  },
  clan_level_up: {
    label: "Новий рівень клану",
    icon: "⬆️",
    color: "purple",
  },
};

const number = (value) =>
  Math.floor(Number(value) || 0).toLocaleString("uk-UA");

function getPlayerName(profile) {
  return profile?.display_name || profile?.username || "Гравець";
}

function isOnline(lastSeen) {
  if (!lastSeen) return false;

  const timestamp = new Date(lastSeen).getTime();

  return (
    Number.isFinite(timestamp) &&
    Date.now() - timestamp >= 0 &&
    Date.now() - timestamp <= 5 * 60 * 1000
  );
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClanJournal() {
  const [activeTab, setActiveTab] = useState("journal");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [clan, setClan] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [ranking, setRanking] = useState(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData?.user;

      if (!user) {
        throw new Error("Увійди в гру, щоб переглянути журнал клану.");
      }

      const { data: myMembership, error: membershipError } =
        await supabase
          .from("clan_members")
          .select("clan_id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (membershipError) throw membershipError;

      if (!myMembership?.clan_id) {
        setClan(null);
        setMembers([]);
        setEvents([]);
        setRanking(null);
        return;
      }

      const clanId = myMembership.clan_id;

      const [
        clanResult,
        membersResult,
        eventsResult,
        clansResult,
      ] = await Promise.all([
        supabase
          .from("clans")
          .select(
            "id, name, level, experience, leader_id, statue_level"
          )
          .eq("id", clanId)
          .single(),

        supabase
          .from("clan_members")
          .select(`
            id,
            user_id,
            role,
            title,
            clan_experience,
            joined_at,
            last_activity_at
          `)
          .eq("clan_id", clanId)
          .order("clan_experience", { ascending: false }),

        supabase
          .from("clan_journal_events")
          .select(`
            id,
            actor_id,
            target_user_id,
            event_type,
            amount,
            description,
            event_data,
            created_at
          `)
          .eq("clan_id", clanId)
          .order("created_at", { ascending: false })
          .limit(100),

        supabase
          .from("clans")
          .select("id, name, experience")
          .eq("is_active", true)
          .order("experience", { ascending: false }),
      ]);

      if (clanResult.error) throw clanResult.error;
      if (membersResult.error) throw membersResult.error;
      if (eventsResult.error) throw eventsResult.error;
      if (clansResult.error) throw clansResult.error;

      const memberRows = membersResult.data || [];
      const eventRows = eventsResult.data || [];

      const userIds = [
        ...new Set([
          ...memberRows.map((row) => row.user_id),
          ...eventRows.flatMap((event) =>
            [event.actor_id, event.target_user_id].filter(Boolean)
          ),
        ]),
      ];

      let profilesById = {};

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } =
          await supabase
            .from("profiles")
            .select(
              "id, display_name, username, avatar_url, last_seen_at"
            )
            .in("id", userIds);

        if (profilesError) throw profilesError;

        profilesById = Object.fromEntries(
          (profiles || []).map((profile) => [
            profile.id,
            profile,
          ])
        );
      }

      const enrichedMembers = memberRows.map((member) => ({
        ...member,
        profile: profilesById[member.user_id] || null,
      }));

      const enrichedEvents = eventRows.map((event) => ({
        ...event,
        actor: profilesById[event.actor_id] || null,
        target: profilesById[event.target_user_id] || null,
      }));

      const clanList = clansResult.data || [];

      const position = clanList.findIndex(
        (item) => item.id === clanId
      );

      setClan(clanResult.data);
      setMembers(enrichedMembers);
      setEvents(enrichedEvents);
      setRanking({
        position: position >= 0 ? position + 1 : null,
        total: clanList.length,
      });
    } catch (err) {
      console.error("Помилка завантаження журналу клану:", err);

      setError(
        err.message || "Не вдалося завантажити журнал клану."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="clan-journal-loading">
        <RefreshCw className="clan-spin" size={25} />
        <span>Завантаження кланового журналу...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clan-journal-page">
        <div className="clan-journal-error">
          <strong>Не вдалося відкрити журнал</strong>
          <p>{error}</p>

          <button onClick={() => loadData()}>
            <RefreshCw size={16} />
            Спробувати ще раз
          </button>
        </div>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="clan-journal-page">
        <div className="clan-journal-empty">
          <Shield size={42} />
          <h2>Ти ще не в клані</h2>
          <p>
            Приєднайся до клану, щоб переглядати його журнал.
          </p>
        </div>
      </div>
    );
  }

  const onlineCount = members.filter((member) =>
    isOnline(member.profile?.last_seen_at)
  ).length;

  const totalMemberExperience = members.reduce(
    (sum, member) =>
      sum + Number(member.clan_experience || 0),
    0
  );

  return (
    <main className="clan-journal-page">
      <header className="cj-header">
        <div className="cj-header-icon">
          <BookOpen size={27} />
        </div>

        <div className="cj-header-info">
          <span className="cj-eyebrow">ЛІТОПИС КЛАНУ</span>
          <h1>{clan.name}</h1>
          <p>Історія та досягнення клану</p>
        </div>

        <button
          className="cj-refresh"
          onClick={() => loadData(true)}
          disabled={refreshing}
          title="Оновити"
        >
          <RefreshCw
            size={18}
            className={refreshing ? "clan-spin" : ""}
          />
        </button>
      </header>

      <section className="cj-ranking-card">
        <div className="cj-ranking-top">
          <div>
            <span className="cj-muted">
              Місце в рейтингу кланів
            </span>

            <div className="cj-rank-number">
              {ranking?.position
                ? `#${ranking.position}`
                : "—"}
            </div>
          </div>

          <div className="cj-trophy">
            <Trophy size={34} />
          </div>
        </div>

        <div className="cj-ranking-bottom">
          <span>
            <Sparkles size={15} />
            Рівень {clan.level || 1}
          </span>

          <span>
            <Users size={15} />
            {members.length} / 50 учасників
          </span>

          <span>
            <Crown size={15} />
            Статуя {clan.statue_level || 0}
          </span>
        </div>

        <div className="cj-clan-exp">
          <div className="cj-exp-label">
            <span>Загальний досвід клану</span>
            <strong>{number(clan.experience)}</strong>
          </div>

          <div className="cj-exp-track">
            <div
              className="cj-exp-fill"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div className="cj-rank-change">
          <span>Зміна місця за 24 години</span>
          <strong>—</strong>
        </div>

        <small className="cj-rank-note">
          Історію зміни позиції підключимо після створення
          щоденних знімків рейтингу.
        </small>
      </section>

      <nav className="cj-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              className={
                activeTab === tab.id ? "active" : ""
              }
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={17} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {activeTab === "journal" && (
        <section className="cj-section">
          <div className="cj-section-heading">
            <div>
              <h2>Події клану</h2>
              <p>Останні 100 записів</p>
            </div>

            <span className="cj-count">
              {events.length}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="cj-empty">
              <Clock size={30} />
              <strong>Поки немає подій</strong>
              <span>
                Важливі дії учасників з'являтимуться тут
                автоматично.
              </span>
            </div>
          ) : (
            <div className="cj-event-list">
              {events.map((event) => {
                const info =
                  EVENT_INFO[event.event_type] || {
                    label: "Подія клану",
                    icon: "📜",
                    color: "gold",
                  };

                return (
                  <article
                    className="cj-event"
                    key={event.id}
                  >
                    <div
                      className={`cj-event-icon ${info.color}`}
                    >
                      {info.icon}
                    </div>

                    <div className="cj-event-content">
                      <span className="cj-event-type">
                        {info.label}
                      </span>

                      <strong>
                        {event.description || info.label}
                      </strong>

                      {event.event_type === "gold_contribution" && (
                        <span className="cj-event-amount">
                          <Coins size={14} />
                          {number(event.amount)} золота
                        </span>
                      )}

                      <small>
                        {event.actor
                          ? getPlayerName(event.actor)
                          : "Система"}
                        {" · "}
                        {formatDate(event.created_at)}
                      </small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "experience" && (
        <section className="cj-section">
          <div className="cj-section-heading">
            <div>
              <h2>Клановий досвід</h2>
              <p>Внесок кожного учасника</p>
            </div>

            <span className="cj-count">
              {members.length}
            </span>
          </div>

          <div className="cj-total-member-exp">
            <span>Сумарний внесок учасників</span>
            <strong>
              {number(totalMemberExperience)}
            </strong>
          </div>

          {members.length === 0 ? (
            <div className="cj-empty">
              У клані поки немає учасників.
            </div>
          ) : (
            <div className="cj-member-list">
              {members.map((member, index) => (
                <article
                  className="cj-member-row"
                  key={member.id}
                >
                  <span className="cj-member-rank">
                    {index + 1}
                  </span>

                  <div className="cj-avatar">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt=""
                      />
                    ) : (
                      <User size={20} />
                    )}
                  </div>

                  <div className="cj-member-info">
                    <strong>
                      {getPlayerName(member.profile)}
                    </strong>

                    <small>
                      {member.title || member.role || "Учасник"}
                    </small>
                  </div>

                  <div className="cj-member-exp">
                    <strong>
                      {number(member.clan_experience)}
                    </strong>
                    <small>досвіду</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "members" && (
        <section className="cj-section">
          <div className="cj-section-heading">
            <div>
              <h2>Хто де?</h2>
              <p>Активність учасників клану</p>
            </div>

            <span className="cj-count">
              {members.length}
            </span>
          </div>

          <div className="cj-online-summary">
            <Activity size={17} />
            <span>
              У мережі: <strong>{onlineCount}</strong>
              {" / "}
              {members.length}
            </span>
          </div>

          <div className="cj-member-list">
            {members.map((member) => {
              const online = isOnline(
                member.profile?.last_seen_at
              );

              return (
                <article
                  className="cj-member-row"
                  key={member.id}
                >
                  <div className="cj-avatar">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt=""
                      />
                    ) : (
                      <User size={20} />
                    )}

                    <i className={online ? "online" : ""} />
                  </div>

                  <div className="cj-member-info">
                    <strong>
                      {getPlayerName(member.profile)}
                    </strong>

                    <small>
                      {member.title || member.role || "Учасник"}
                    </small>
                  </div>

                  <div
                    className={`cj-presence ${
                      online ? "online" : ""
                    }`}
                  >
                    <span />
                    {online ? "У мережі" : "Не в мережі"}
                  </div>
                </article>
              );
            })}
          </div>

          <p className="cj-location-note">
            Поки що тут показується статус онлайн. Для
            відображення конкретної локації гри потрібно
            окремо зберігати поточний розділ гравця.
          </p>
        </section>
      )}
    </main>
  );
            }
